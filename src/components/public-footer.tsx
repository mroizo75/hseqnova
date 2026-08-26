import Link from "next/link";
import { Linkedin, Mail } from "lucide-react";
import Image from "next/image";
import { SITE_CONFIG } from "@/lib/seo-config";

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-black.png"
                alt="HSEQ Nova"
                width={200}
                height={48}
                className="h-9 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Health, safety, environment and quality software for UK employers. Built around HSWA,
              RIDDOR, COSHH and CDM — not a translated foreign checklist.
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
              <li>
                <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/riddor" className="text-muted-foreground hover:text-foreground transition-colors">
                  Accident book and RIDDOR
                </Link>
              </li>
              <li>
                <Link href="/rams" className="text-muted-foreground hover:text-foreground transition-colors">
                  RAMS
                </Link>
              </li>
              <li>
                <Link href="/coshh" className="text-muted-foreground hover:text-foreground transition-colors">
                  COSHH
                </Link>
              </li>
              <li>
                <Link href="/digital-safety-board" className="text-muted-foreground hover:text-foreground transition-colors">
                  Digital safety board
                </Link>
              </li>
              <li>
                <Link href="/health-and-safety-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Living H&amp;S policy
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Guidance</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/health-safety-software" className="text-muted-foreground hover:text-foreground transition-colors">
                  Health and safety software
                </Link>
              </li>
              <li>
                <a
                  href="https://www.hse.gov.uk/riddor/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  RIDDOR on HSE.gov.uk
                </a>
              </li>
              <li>
                <a
                  href="https://www.hse.gov.uk/coshh/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  COSHH on HSE.gov.uk
                </a>
              </li>
              <li>
                <a
                  href="https://www.hse.gov.uk/construction/cdm/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  CDM 2015 on HSE.gov.uk
                </a>
              </li>
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
            © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
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
