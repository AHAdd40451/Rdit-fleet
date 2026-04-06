import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  Paid: "hsl(142 64% 42%)",
  Pending: "hsl(38 92% 50%)",
  Failed: "hsl(0 72% 51%)",
  Refunded: "hsl(280 65% 60%)",
};

type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";

type NormalizedIntent = {
  createdAt: Date;
  customerKey: string | null;
  netRevenueCents: number;
  status: PaymentStatus;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getMonthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function toMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function toMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function resolveCustomerKey(intent: Stripe.PaymentIntent, charge: Stripe.Charge | null) {
  if (typeof intent.customer === "string" && intent.customer) {
    return intent.customer;
  }

  if (intent.receipt_email) {
    return intent.receipt_email;
  }

  if (charge?.billing_details?.email) {
    return charge.billing_details.email;
  }

  if (typeof intent.payment_method === "string" && intent.payment_method) {
    return intent.payment_method;
  }

  return null;
}

function deriveStatus(intent: Stripe.PaymentIntent, charge: Stripe.Charge | null): PaymentStatus {
  if ((charge?.amount_refunded ?? 0) > 0 || charge?.refunded) {
    return "Refunded";
  }

  switch (intent.status) {
    case "succeeded":
      return "Paid";
    case "requires_action":
    case "requires_capture":
    case "requires_confirmation":
    case "processing":
      return "Pending";
    case "canceled":
    case "requires_payment_method":
      return "Failed";
    default:
      return "Pending";
  }
}

async function listPaymentIntents(stripe: Stripe) {
  const intents: Stripe.PaymentIntent[] = [];
  let startingAfter: string | undefined;

  while (true) {
    const page = await stripe.paymentIntents.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
      expand: ["data.latest_charge"],
    });

    intents.push(...page.data);

    if (!page.has_more || page.data.length === 0) {
      break;
    }

    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return intents;
}

function normalizeIntent(intent: Stripe.PaymentIntent): NormalizedIntent {
  const charge =
    intent.latest_charge && typeof intent.latest_charge !== "string"
      ? (intent.latest_charge as Stripe.Charge)
      : null;

  const amountBase = intent.amount_received > 0 ? intent.amount_received : intent.amount;
  const refundedCents = charge?.amount_refunded ?? 0;

  return {
    createdAt: new Date(intent.created * 1000),
    customerKey: resolveCustomerKey(intent, charge),
    netRevenueCents: Math.max(amountBase - refundedCents, 0),
    status: deriveStatus(intent, charge),
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    return jsonResponse({ error: "STRIPE_SECRET_KEY is not configured" }, 500);
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-11-20.acacia" });

  try {
    const now = new Date();
    const currentMonthStart = getMonthStart(now);
    const monthStarts = Array.from({ length: 7 }, (_, index) => addMonths(currentMonthStart, index - 6));
    const monthKeys = monthStarts.map(toMonthKey);

    const normalizedIntents = (await listPaymentIntents(stripe)).map(normalizeIntent);
    const paidOrRefunded = normalizedIntents.filter(
      (intent) => intent.status === "Paid" || intent.status === "Refunded"
    );

    const monthlyRevenueMap = new Map<string, number>();
    const monthlyCustomerMap = new Map<string, Set<string>>();
    const firstPaidMonthByCustomer = new Map<string, string>();
    const monthlyFailedMap = new Map<string, number>();
    const statusCounts: Record<PaymentStatus, number> = {
      Paid: 0,
      Pending: 0,
      Failed: 0,
      Refunded: 0,
    };

    for (const intent of normalizedIntents) {
      statusCounts[intent.status] += 1;

      const monthKey = toMonthKey(getMonthStart(intent.createdAt));
      if (intent.status === "Failed") {
        monthlyFailedMap.set(monthKey, (monthlyFailedMap.get(monthKey) ?? 0) + 1);
      }
    }

    for (const intent of paidOrRefunded) {
      const monthKey = toMonthKey(getMonthStart(intent.createdAt));

      monthlyRevenueMap.set(monthKey, (monthlyRevenueMap.get(monthKey) ?? 0) + intent.netRevenueCents);

      if (intent.customerKey) {
        const existingCustomers = monthlyCustomerMap.get(monthKey) ?? new Set<string>();
        existingCustomers.add(intent.customerKey);
        monthlyCustomerMap.set(monthKey, existingCustomers);

        const existingFirstMonth = firstPaidMonthByCustomer.get(intent.customerKey);
        if (!existingFirstMonth || monthKey < existingFirstMonth) {
          firstPaidMonthByCustomer.set(intent.customerKey, monthKey);
        }
      }
    }

    const revenueData = monthStarts.map((monthStart) => {
      const monthKey = toMonthKey(monthStart);
      return {
        month: toMonthLabel(monthStart),
        revenue: Number(((monthlyRevenueMap.get(monthKey) ?? 0) / 100).toFixed(2)),
      };
    });

    const subscriptionGrowth = monthStarts.map((monthStart, index) => {
      const monthKey = toMonthKey(monthStart);
      const currentCustomers = monthlyCustomerMap.get(monthKey) ?? new Set<string>();
      const previousCustomers =
        index > 0 ? monthlyCustomerMap.get(monthKeys[index - 1]) ?? new Set<string>() : new Set<string>();

      let newCustomers = 0;
      for (const value of firstPaidMonthByCustomer.values()) {
        if (value === monthKey) {
          newCustomers += 1;
        }
      }

      let churned = 0;
      for (const customer of previousCustomers) {
        if (!currentCustomers.has(customer)) {
          churned += 1;
        }
      }

      return {
        month: toMonthLabel(monthStart),
        active: currentCustomers.size,
        new: newCustomers,
        churned,
      };
    });

    const currentMonthKey = monthKeys[monthKeys.length - 1];
    const previousMonthKey = monthKeys[monthKeys.length - 2];
    const currentMonthRevenueCents = monthlyRevenueMap.get(currentMonthKey) ?? 0;
    const previousMonthRevenueCents = monthlyRevenueMap.get(previousMonthKey) ?? 0;

    const currentMonthActive = monthlyCustomerMap.get(currentMonthKey)?.size ?? 0;
    const previousMonthActive = monthlyCustomerMap.get(previousMonthKey)?.size ?? 0;

    const totalCustomers = firstPaidMonthByCustomer.size;
    const previousTotalCustomers = Array.from(firstPaidMonthByCustomer.values()).filter(
      (monthKey) => monthKey < currentMonthKey
    ).length;

    const failedThisMonth = monthlyFailedMap.get(currentMonthKey) ?? 0;
    const failedLastMonth = monthlyFailedMap.get(previousMonthKey) ?? 0;

    const paymentStatusData = (Object.keys(statusCounts) as PaymentStatus[]).map((status) => ({
      name: status,
      value: statusCounts[status],
      fill: PAYMENT_STATUS_COLORS[status],
    }));

    return jsonResponse({
      generatedAt: now.toISOString(),
      source: "stripe-payment-intents",
      summary: {
        totalRevenue: {
          valueCents: paidOrRefunded.reduce((sum, intent) => sum + intent.netRevenueCents, 0),
          changePct: percentChange(currentMonthRevenueCents, previousMonthRevenueCents),
        },
        totalCustomers: {
          value: totalCustomers,
          changePct: percentChange(totalCustomers, previousTotalCustomers),
        },
        activeSubscriptions: {
          value: currentMonthActive,
          changePct: percentChange(currentMonthActive, previousMonthActive),
        },
        monthlyRevenue: {
          valueCents: currentMonthRevenueCents,
          changePct: percentChange(currentMonthRevenueCents, previousMonthRevenueCents),
        },
        failedPayments: {
          value: failedThisMonth,
          changePct: percentChange(failedThisMonth, failedLastMonth),
        },
      },
      revenueData,
      subscriptionGrowth,
      paymentStatusData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
