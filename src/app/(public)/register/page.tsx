import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { RegisterForm } from "@/features/signup/components/register-form";
import { needsPaymentGate } from "@/lib/signup-checkout";
import { getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Start HSEQ Nova",
  description: "Subscribe to HSEQ Nova Core and optional add-ons. Pay by card or Bacs Direct Debit.",
  alternates: { canonical: getCanonicalUrl("/register") },
  robots: ROBOTS_CONFIG,
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ pay?: string; cancelled?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const tenantId = session?.user && "tenantId" in session.user ? String(session.user.tenantId ?? "") : "";

  let unpaid = false;
  if (tenantId) {
    const { data } = await getAdminDb()
      .from("Tenant")
      .select("onboardingStatus, stripeSubscriptionId")
      .eq("id", tenantId)
      .maybeSingle();
    unpaid = Boolean(data && needsPaymentGate(data));
  }

  const mode = params.pay === "1" || unpaid ? "pay" : "signup";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <p className="mb-2 text-sm text-muted-foreground">
        <Link href="/pricing" className="hover:text-foreground">
          Pricing
        </Link>
        {" / "}
        Register
      </p>
      <h1 className="mb-2 text-3xl font-bold">
        {mode === "pay" ? "Complete your subscription" : "Start HSEQ Nova"}
      </h1>
      <p className="mb-8 text-muted-foreground">
        HSEQ Nova Core is £29 / month ex VAT, unlimited users. Choose add-ons if you need them, then pay on Stripe.
      </p>
      <RegisterForm
        mode={mode}
        cancelled={params.cancelled === "1"}
        prefillEmail={typeof session?.user?.email === "string" ? session.user.email : ""}
      />
    </div>
  );
}
