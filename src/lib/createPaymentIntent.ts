import { supabase } from '../../lib/supabase';

export type CreatePaymentIntentParams = {
  amount: number; // in cents
  currency?: string;
};

export type CreatePaymentIntentResult =
  | { clientSecret: string; error?: never }
  | { clientSecret?: never; error: string };

/**
 * Calls the Supabase Edge Function to create a Stripe PaymentIntent.
 * The secret key is only used on the server; this returns the client secret for the Payment Sheet.
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<CreatePaymentIntentResult> {
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: {
      amount: params.amount,
      currency: params.currency || 'usd',
    },
  });

  if (error) {
    return { error: error.message || 'Failed to create payment intent' };
  }

  const clientSecret = data?.clientSecret;
  if (!clientSecret || typeof clientSecret !== 'string') {
    return { error: data?.error || 'No client secret returned' };
  }

  return { clientSecret };
}
