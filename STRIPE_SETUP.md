# Stripe payment integration

Your app is set up to accept payments with Stripe.

## What’s in place

- **App (client)**  
  - Stripe publishable key is in `app.config.js` (and can be overridden with `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`).  
  - Payment screen: **Payment** in the sidebar (or navigate to `/payment`).  
  - Uses Stripe Payment Sheet (card, Apple Pay, Google Pay, etc.).

- **Backend (Supabase Edge Function)**  
  - `create-payment-intent`: creates a Stripe PaymentIntent and returns the `client_secret` for the Payment Sheet.  
  - **Your Stripe secret key must only be set on the server**, not in the app.

## 1. Set your Stripe secret key (required)

The secret key must **never** be in the app or in git. Set it as a Supabase secret for the Edge Function:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_51T1VBTPtxIqhswZc...
```

Use your real **secret** key (starts with `sk_test_` for test, `sk_live_` for production).

Then deploy the function (if you haven’t already):

```bash
supabase functions deploy create-payment-intent
```

## 2. (Optional) Use `.env` for the publishable key

To override the publishable key (e.g. per environment), add to `.env`:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51T1VBTPtxIqhswZc...
```

Restart the dev server after changing `.env`.

## 3. Test payments

- Use Stripe test cards: <https://docs.stripe.com/testing#cards>  
  - Success: `4242 4242 4242 4242`  
  - Decline: `4000 0000 0000 0002`  
- View payments in [Stripe Dashboard](https://dashboard.stripe.com/test/payments).

## 4. Production

- Create live keys in the Stripe Dashboard and set:
  - `STRIPE_SECRET_KEY` in Supabase to your **live** secret key.
  - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (or `app.config.js`) to your **live** publishable key.
- Do not commit secret keys; use Supabase secrets and env vars only.
