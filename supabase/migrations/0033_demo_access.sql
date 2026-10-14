-- Admin-created product demos (time-limited access, then subscribe via Stripe).
ALTER TYPE "RegistrationType" ADD VALUE IF NOT EXISTS 'DEMO';
