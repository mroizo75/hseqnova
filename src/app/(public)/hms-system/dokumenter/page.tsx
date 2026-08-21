import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Lock, Search, History, ArrowRight, ArrowLeft, FolderOpen } from "lucide-react";
import { FAQSection } from "@/components/faq-section";

export const metadata: Metadata = {
  title: "Dokumenthåndtering - Sentral lagring av HMS-dokumenter | HMS Nova",
  description: "Digital dokumenthåndtering med sentral lagring, versjonshistorikk, tilgangsstyring og søk. ISO 9001-compliance. Prøv gratis.",
  keywords: "dokumenthåndtering, hms dokumenter, dokumentstyring, digital arkivering, versjonskontr oll",
};

const faqs = [
  {
    question: "Hva er dokumenthåndtering?",
    answer: `Dokumenthåndtering (også kalt dokumentstyring) er systematisk lagring, organisering og 
    kontroll av bedriftens dokumenter. I HMS-sammenheng handler det om å ha alle HMS-relaterte 
    dokumenter tilgjengelig, oppdaterte og sporbare på ett sted.`,
  },
  {
    question: "Hvorfor trenger vi digital dokumenthåndtering?",
    answer: `Digital dokumenthåndtering gir:
    • Ingen kaos med utdaterte versjoner
    • Alle finner riktig dokument umiddelbart
    • Full historikk (hvem endret hva når)
    • Sikker lagring med backup
    • Oppfyller ISO 9001 krav til dokumentstyring
    • Aldri gå glipp av viktig HMS-informasjon`,
  },
  {
    question: "Hvilke dokumenter bør lagres i HMS Nova?",
    answer: `Alt HMS-relatert:
    • HMS-håndbok og retningslinjer
    • Risikovurderinger
    • Prosedyrer og arbeidsinstrukser
    • Opplæringsmateriell
    • Sertifikater og attester
    • Vernerundrappor ter
    • Avviksmeldinger
    • Revisjonsdokumenter`,
  },
  {
    question: "Hvordan fungerer tilgangsstyring?",
    answer: `Du bestemmer hvem som kan:
    • Lese dokumenter (alle ansatte? kun ledelse?)
    • Redigere dokumenter (HMS-ansvarlig? Kun admin?)
    • Godkjenne nye versjoner
    HMS Nova har 7 roller med ulike tilgangsnivåer fra ansatt til administrator.`,
  },
];

export default function DokumenterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Breadcrumb */}
      <section className="container mx-auto px-4 pt-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Hjem</Link>
          <span>/</span>
          <Link href="/hms-system" className="hover:text-foreground">HMS-system</Link>
          <span>/</span>
          <span className="text-foreground">Dokumenter</span>
        </div>
      </section>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4" variant="secondary">
            Organisering
          </Badge>
          <h1 className="text-5xl font-bold mb-6">
            Dokumenthåndtering - Alt på ett sted
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sentral lagring av alle HMS-dokumenter. Versjonshistorikk, tilgangsstyring, 
            kraftig søk og digital signatur. ISO 9001 compliance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg">
              <Link href="/registrer-bedrift">
                Prøv gratis i 14 dager
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/hms-system">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Tilbake til HMS-system
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Hva er dokumenthåndtering */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold mb-4">Hva er dokumenthåndtering?</h2>
              <p>
                <strong>Dokumenthåndtering</strong> (eller dokumentstyring) er systematisk lagring, 
                organisering og kontroll av bedriftens dokumenter.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Utfordringer med papir og mapper:</h3>
              <ul>
                <li>❌ Hvilken versjon er riktig?</li>
                <li>❌ Hvem har endret dokumentet?</li>
                <li>❌ Hvor ligger HMS-håndboka?</li>
                <li>❌ Har alle lest siste oppdatering?</li>
                <li>❌ Hva gjorde vi forrige gang?</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Løsning med HMS Nova:</h3>
              <ul>
                <li>✅ Alt samlet digitalt på ett sted</li>
                <li>✅ Alltid siste versjon tilgjengelig</li>
                <li>✅ Full historikk og sporbarhet</li>
                <li>✅ Enkel søk - finn på sekunder</li>
                <li>✅ Digital signatur - se hvem som har lest</li>
                <li>✅ Sikker backup og tilgangsstyring</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Funksjoner */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Kraftige funksjoner for dokumentstyring
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <FolderOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Sentral lagring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Alle HMS-dokumenter på ett sted. Strukturert i mapper. 
                  Tilgjengelig 24/7 fra mobil, nettbrett eller PC.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <History className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Versjonshistorikk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Se alle versjoner av et dokument. Hvem endret hva og når? 
                  Gå tilbake til tidligere versjon hvis nødvendig.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Tilgangsstyring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bestem hvem som kan lese, redigere og godkjenne dokumenter. 
                  7 roller fra ansatt til administrator.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Kraftig søk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Finn dokumentet du trenger på sekunder. 
                  Søk i tittel, innhold, tagger og metadata.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Digital signatur</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Send til godkjenning med ett klikk. 
                  Se hvem som har lest og signert dokumenter.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <History className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Automatisk backup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sikker lagring i sky med automatisk backup. 
                  Ingen risiko for å miste viktige dokumenter.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ISO 9001 krav */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            ISO 9001 krav til dokumentstyring
          </h2>
          <Card>
            <CardContent className="p-8">
              <p className="text-lg mb-6">
                ISO 9001 kapittel 7.5 stiller krav til hvordan dokumenter håndteres. 
                HMS Nova oppfyller alle kravene:
              </p>
              <div className="space-y-4">
                {[
                  {
                    req: "7.5.2 Oppretting og oppdatering",
                    desc: "Dokumenter må være identifiserbare, ha riktig format og godkjennes før bruk.",
                    status: "✅ Automatisk ID, versjoner og godkjenningsflyt",
                  },
                  {
                    req: "7.5.3.1 Tilgjengelighet",
                    desc: "Dokumenter skal være tilgjengelige der de trengs.",
                    status: "✅ Tilgjengelig 24/7 fra alle enheter",
                  },
                  {
                    req: "7.5.3.2 Beskyttelse",
                    desc: "Dokumenter må beskyttes mot utilsiktet endring eller tap.",
                    status: "✅ Tilgangsstyring, backup og versjonskontroll",
                  },
                  {
                    req: "7.5.3.3 Distribusjon",
                    desc: "Riktig versjon må være tilgjengelig for riktige personer.",
                    status: "✅ Automatisk distribusjon og varsling",
                  },
                ].map((item, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl">📄</div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{item.req}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{item.desc}</p>
                          <p className="text-sm font-semibold text-primary">{item.status}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Organisering */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            Slik organiserer du dokumenter i HMS Nova
          </h2>
          <Card>
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded p-2">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">📁 HMS-håndbok</h4>
                    <p className="text-sm text-muted-foreground">
                      Hovedhåndbok, retningslinjer, prosedyrer
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded p-2">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">📁 Risikovurderinger</h4>
                    <p className="text-sm text-muted-foreground">
                      Alle risikovurderinger med tiltak
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded p-2">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">📁 Opplæring</h4>
                    <p className="text-sm text-muted-foreground">
                      Kursmateriell, sertifikater, opplæringsplaner
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded p-2">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">📁 Revisjoner</h4>
                    <p className="text-sm text-muted-foreground">
                      Revisjonsdokumenter, funn, oppfølging
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded p-2">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">📁 Diverse</h4>
                    <p className="text-sm text-muted-foreground">
                      Avtaler, attester, sertifikater
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Relaterte emner */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6">Del av HMS Nova HMS-system</h3>
          <p className="text-muted-foreground mb-6">
            Dokumenthåndtering er en sentral del av vårt <Link href="/hms-system" className="text-primary hover:underline">komplette HMS-system</Link>. 
            Se også:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/hms-system/digital-signatur">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">Digital signatur</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Godkjenn dokumenter →</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/hms-system/iso-9001">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">ISO 9001</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">ISO-krav kap 7.5 →</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/hms-system/risikovurdering">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">Risikovurdering</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Dokumenter risiko →</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection 
        faqs={faqs}
        title="Ofte stilte spørsmål om dokumenthåndtering"
      />

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-3xl mx-auto bg-primary text-primary-foreground border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Få orden på HMS-dokumentene
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Alt på ett sted, alltid tilgjengelig. Test HMS Nova gratis i 14 dager.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100">
                <Link href="/registrer-bedrift">
                  Kom i gang gratis
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                className="border-2 border-white text-white hover:bg-white/10"
              >
                <Link href="/priser">
                  Se priser
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
