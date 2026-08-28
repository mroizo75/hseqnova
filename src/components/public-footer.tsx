import Link from "next/link";
import { Linkedin, Mail } from "lucide-react";
import Image from "next/image";
import { SITE_CONFIG } from "@/lib/seo-config";

const PRODUCT_LINKS = [
  { href: "/health-safety-software", label: "Health and safety software" },
  { href: "/pricing", label: "Pricing" },
  { href: "/riddor", label: "Accident book & RIDDOR" },
  { href: "/rams", label: "RAMS" },
  { href: "/coshh", label: "COSHH" },
  { href: "/digital-safety-board", label: "Digital safety board" },
  { href: "/health-and-safety-policy", label: "Living H&S policy" },
  { href: "/login", label: "Log in" },
] as const;

const COMPANY_LINKS = [
  { href: "/about", label: "About HSEQ Nova" },
  { href: "/contact", label: "Contact" },
  { href: "/personvern", label: "Privacy policy" },
  { href: "/vilkar", label: "Terms of service" },
  { href: "/cookies", label: "Cookie policy" },
] as const;

const GUIDANCE_LINKS = [
  { href: "https://www.hse.gov.uk/riddor/", label: "RIDDOR on HSE.gov.uk", external: true },
  { href: "https://www.hse.gov.uk/coshh/", label: "COSHH on HSE.gov.uk", external: true },
  { href: "https://www.hse.gov.uk/construction/cdm/", label: "CDM 2015 on HSE.gov.uk", external: true },
  { href: "https://www.legislation.gov.uk/ukpga/1974/37", label: "HSWA 1974", external: true },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-black.png"
                alt="HSEQ Nova"
                width={200}
                height={48}
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Health, safety, environment and quality software for UK employers. Built around HSWA,
              RIDDOR, COSHH and CDM.
            </p>
            <div className="flex space-x-3">
              {SITE_CONFIG.socialMedia.linkedin ? (
                <a
                  href={SITE_CONFIG.socialMedia.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="HSEQ Nova on LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              ) : null}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail}`}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label={`Email ${SITE_CONFIG.name}`}
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Guidance</h3>
            <ul className="space-y-2 text-sm">
              {GUIDANCE_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${SITE_CONFIG.contactEmail}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {SITE_CONFIG.contactEmail}
                </a>
              </li>
              <li className="text-muted-foreground">
                <strong>{SITE_CONFIG.name}</strong>
                <br />
                United Kingdom
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/personvern" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/vilkar" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
