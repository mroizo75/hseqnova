import type { Metadata } from "next";
import { CookiesContent } from "./cookies-content";

export const metadata: Metadata = {
  title: "Cookie-policy | Informasjonskapsler | HMS Nova AS",
  description:
    "Les hvordan HMS Nova bruker cookies (informasjonskapsler). GDPR-compliant oversikt over strengt nødvendige, funksjonelle, analyse- og markedsførings-cookies. Administrer dine cookie-preferanser.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://hmsnova.no/cookies",
  },
};

export default function CookiesPage() {
  return <CookiesContent />;
}
