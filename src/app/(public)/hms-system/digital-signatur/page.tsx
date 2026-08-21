import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Shield, Clock, CheckCircle2, ArrowRight, ArrowLeft, Smartphone } from "lucide-react";
import { FAQSection } from "@/components/faq-section";

export const metadata: Metadata = {
  title: "Digital signatur - Elektronisk godkjenning av HMS-dokumenter | HMS Nova",
  description: "Digital signatur inkludert i HMS Nova. Lovlig og bindende, sign på mobil, spar timer hver uke. Økt etterlevelse og ISO 9001. Prøv gratis.",
  keywords: "digital signatur, elektronisk signatur, digital godkjenning, hms digital signatur, signere dokumenter digitalt",
};

const faqs = [
  {
    question: "Er digital signatur juridisk bindende i Norge?",
    answer: `Ja! Digital signatur er fullt ut juridisk bindende i Norge etter eSignaturloven. 
    HMS Novas digitale signatur oppfyller alle lovkrav og kan brukes til godkjenning av HMS-dokumenter, 
    risikovurderinger, opplæring og andre HMS-relaterte dokumenter.`,
  },
  {
    question: "Hvordan fungerer digital signatur i HMS Nova?",
    answer: `Det er enkelt:
    1. Dokument sendes til ansatt/verneombud
    2. De får varsel på e-post og i appen
    3. De signerer med ett klikk på mobil eller PC
    4. Systemet dokumenterer hvem, hva og når
    Alt skjer automatisk - ingen papir, ingen scanning.`,
  },
  {
    question: "Hva kan signeres digitalt i HMS Nova?",
    answer: `Alt HMS-relatert kan signeres digitalt:
    • HMS-håndbok og retningslinjer
    • Risikovurderinger
    • Opplæringsbevis
    • Vernerunderappor ter
    • Avviksmeldinger
    • Kjørebok og dagbok
    • Personvern og GDPR-dokumenter`,
  },
  {
    question: "Koster digital signatur ekstra?",
    answer: `Nei! Digital signatur er inkludert i alle HMS Nova-abonnementer. 
    Ingen ekstrakostnader, ingen begrensninger på antall signaturer. 
    Dette skiller oss fra mange konkurrenter som tar betalt per signatur eller per dokument.`,
  },
];

export default function DigitalSignaturPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Breadcrumb */}
      <section className="container mx-auto px-4 pt-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Hjem</Link>
          <span>/</span>
          <Link href="/hms-system" className="hover:text-foreground">HMS-system</Link>
          <span>/</span>
          <span className="text-foreground">Digital signatur</span>
        </div>
      </section>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4" variant="secondary">
            Populær funksjon
          </Badge>
          <h1 className="text-5xl font-bold mb-6">
            Digital signatur - Inkludert i HMS Nova
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Elektronisk godkjenning av HMS-dokumenter. Lovlig, raskt og enkelt. 
            Spar timer hver uke og få 100% dokumentasjon.
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

      {/* Hva er digital signatur */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold mb-4">Hva er digital signatur?</h2>
              <p>
                <strong>Digital signatur</strong> (også kalt elektronisk signatur) er en digital 
                metode for å godkjenne dokumenter uten papir og penn.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Hvorfor digital signatur?</h3>
              <ul>
                <li><strong>Spar tid</strong> - Ingen printing, scanning eller fysisk arkivering</li>
                <li><strong>Øk etterlevelse</strong> - Ansatte kan signere fra mobilen med ett klikk</li>
                <li><strong>Full dokumentasjon</strong> - Hvem signerte hva og når? Alt er loggført</li>
                <li><strong>Juridisk bindende</strong> - Lovlig i Norge (eSignaturloven)</li>
                <li><strong>ISO-krav</strong> - Oppfyller krav til dokumentasjon i ISO 9001</li>
                <li><strong>Automatiske påminnelser</strong> - Varsel til de som ikke har signert</li>
              </ul>

              <div className="bg-primary/10 border-l-4 border-primary p-6 mt-6">
                <p className="font-semibold mb-2">💡 Reelt eksempel:</p>
                <p className="mb-0">
                  En byggmester med 15 ansatte brukte tidligere 2-3 timer hver måned på å samle inn 
                  signaturer på HMS-dokumenter. Med HMS Nova tar det nå 5 minutter. 
                  <strong> Det er en tidsbesparing på 30+ timer i året!</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Hvordan det fungerer */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Slik fungerer digital signatur i HMS Nova
          </h2>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Send dokument til signering",
                desc: "Velg dokument (f.eks. HMS-håndbok) og send til ansatte, verneombud eller hvem som helst.",
              },
              {
                step: 2,
                title: "Motta varsel",
                desc: "De får e-postvarsel og push-notifikasjon i mobilappen om at dokumentet venter på godkjenning.",
              },
              {
                step: 3,
                title: "Signer med ett klikk",
                desc: "Ansatte åpner dokumentet på mobil eller PC og godkjenner med ett klikk. Ingen BankID nødvendig.",
              },
              {
                step: 4,
                title: "Automatisk dokumentasjon",
                desc: "Systemet logger hvem som signerte, når, fra hvilken enhet og IP-adresse. Full sporbarhet.",
              },
            ].map((item) => (
              <Card key={item.step}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                      {item.step}
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fordeler */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Fordeler med digital signatur
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Spar enorm tid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Slutt med printing, scanning og jakt på signaturer. 
                  Send til alle med ett klikk. Spar timer hver måned.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Høyere etterlevelse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Når det er enkelt å signere (mobil, 2 sekunder), 
                  gjør folk det. Du får 95%+ etterlevelse.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Full dokumentasjon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Hvem har lest HMS-håndboka? Hvem har ikke? 
                  Full oversikt, automatiske påminnelser.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Sign på mobil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Perfekt for byggeplasser og ansatte uten PC. 
                  Sign fra mobiltelefonen, hvor som helst.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sammenligning */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Digital vs papir-signatur
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="p-4"></th>
                  <th className="p-4 text-center">❌ Papir</th>
                  <th className="p-4 text-center">✅ Digital (HMS Nova)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Tid per signatur", "5-10 min", "10 sekunder"],
                  ["Etterlevelse", "50-70%", "95%+"],
                  ["Dokumentasjon", "Manuell arkivering", "Automatisk"],
                  ["Påminnelser", "Manuelt", "Automatisk"],
                  ["Tilgang fra mobil", "Nei", "Ja"],
                  ["Kostnad", "Papir + tid", "Inkludert"],
                ].map(([feature, paper, digital], i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4 font-medium">{feature}</td>
                    <td className="p-4 text-center text-muted-foreground">{paper}</td>
                    <td className="p-4 text-center font-semibold text-primary">{digital}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Relaterte emner */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6">Del av HMS Nova HMS-system</h3>
          <p className="text-muted-foreground mb-6">
            Digital signatur er innebygd i vårt <Link href="/hms-system" className="text-primary hover:underline">komplette HMS-system</Link>. 
            Se også:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/hms-system/dokumenter">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">Dokumenthåndtering</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Sentral lagring →</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/hms-system/vernerunde">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">Vernerunde</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Digital vernerunde →</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/hms-system/iso-9001">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">ISO 9001</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Sertifisering →</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection 
        faqs={faqs}
        title="Ofte stilte spørsmål om digital signatur"
      />

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-3xl mx-auto bg-primary text-primary-foreground border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Digital signatur inkludert - ingen ekstrakostnad
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Test HMS Nova gratis i 14 dager og opplev hvor enkelt digital signatur er.
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
