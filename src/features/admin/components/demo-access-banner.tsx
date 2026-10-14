import Link from "next/link";

export function DemoAccessBanner({ trialEndsAt }: { trialEndsAt: string }) {
  const ends = new Date(trialEndsAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
      This is a demo workspace until <strong>{ends}</strong>.{" "}
      <Link href="/subscribe" className="font-medium underline">
        Subscribe
      </Link>{" "}
      to keep access. You choose Core plus add-ons and pay in Stripe.
    </div>
  );
}
