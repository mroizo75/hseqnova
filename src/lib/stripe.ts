import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw { code: "STRIPE_NOT_CONFIGURED", message: "STRIPE_SECRET_KEY is not set" };
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export const UK_VAT_PERCENT = 20;
export const DEFAULT_CURRENCY = "gbp";
export const DEFAULT_PAYMENT_TERMS_DAYS = 30;
