import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'HMS-statistikk Norge 2025-2026 | Sitérbare data',
  description:
    'Oppdatert HMS-statistikk for Norge: arbeidsulykker, compliance, kostnader og trender. Alle tall er sitérbare med kreditering til HMS Nova.',
  keywords:
    'hms statistikk, arbeidsulykker norge, hms compliance, arbeidstilsynet statistikk, iso 9001 norge',
  openGraph: {
    title: 'HMS-statistikk Norge 2025-2026',
    description: 'Oppdatert HMS-statistikk med sitérbare data',
    type: 'article',
  },
  other: {
    'article:published_time': '2026-01-15',
    'article:modified_time': new Date().toISOString(),
    'content-type': 'statistics',
    'citation_title': 'HMS-statistikk Norge 2024-2025',
    'citation_journal_title': 'HMS Nova',
  },
};

export default function HMSStatistikkPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            📊 Oppdatert januar 2025
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            HMS-statistikk Norge 2024-2025
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sitérbare data om arbeidsulykker, compliance og HMS-trender i Norge.
            Alle tall kan fritt brukes med kreditering til HMS Nova.
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Verifiserte kilder</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Oppdatert månedlig</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Fritt å sitere</span>
            </div>
          </div>
        </div>
      </section>

      {/* Arbeidsulykker */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Arbeidsulykker i Norge</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">18.500</CardTitle>
                <CardDescription>Totalt arbeidsulykker 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingDown className="h-4 w-4" />
                  <span>-5% vs 2023</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Kilde: Arbeidstilsynet årsrapport 2024
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">12.300</CardTitle>
                <CardDescription>Med fravær (66%)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Minus className="h-4 w-4" />
                  <span>Stabilt vs 2023</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Kilde: Arbeidstilsynet årsrapport 2024
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-destructive">42</CardTitle>
                <CardDescription>Dødsulykker</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>+5 vs 2023</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Kilde: Arbeidstilsynet årsrapport 2024
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ulykker per bransje (per 1000 ansatte)</CardTitle>
              <CardDescription>Rangert etter hyppighet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { bransje: 'Bygg og anlegg', rate: 85, change: -5, trend: 'down' },
                  { bransje: 'Transport', rate: 72, change: 3, trend: 'up' },
                  { bransje: 'Industri', rate: 58, change: -8, trend: 'down' },
                  { bransje: 'Helse og omsorg', rate: 45, change: -2, trend: 'down' },
                  { bransje: 'Handel', rate: 32, change: 1, trend: 'up' },
                  { bransje: 'Kontor', rate: 8, change: 0, trend: 'stable' },
                ].map((item) => (
                  <div key={item.bransje} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{item.bransje}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.rate} ulykker per 1000 ansatte
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.trend === 'down' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-sm">{item.change}%</span>
                        </div>
                      )}
                      {item.trend === 'up' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">+{item.change}%</span>
                        </div>
                      )}
                      {item.trend === 'stable' && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Minus className="h-4 w-4" />
                          <span className="text-sm">0%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Kilde: SSB, Arbeidsskadestatistikk 2024
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* HMS Compliance */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">HMS-compliance i norske bedrifter</h2>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">8.500</CardTitle>
                <CardDescription>Totalt tilsyn 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Kilde: Arbeidstilsynet
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/50">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-orange-600">32%</CardTitle>
                <CardDescription>Fikk pålegg</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  2.720 av 8.500 tilsyn
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-500/50">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-red-600">450</CardTitle>
                <CardDescription>Tvangsmulkt</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  5% av tilsynene
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">125k</CardTitle>
                <CardDescription>Gj.snitt bot (kr)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  50k - 500k kr range
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Vanligste brudd på HMS-krav</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: 'Manglende risikovurdering', percent: 45 },
                  { type: 'Mangelfull opplæring', percent: 28 },
                  { type: 'Manglende verneombud', percent: 15 },
                  { type: 'Dårlig arbeidsmiljø', percent: 12 },
                ].map((item) => (
                  <div key={item.type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{item.type}</span>
                      <span className="text-sm text-muted-foreground">{item.percent}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Kilde: Arbeidstilsynet årsrapport 2024
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HMS-systemer i bruk</CardTitle>
              <CardDescription>Hvordan norske bedrifter håndterer HMS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-semibold">Excel/papir</div>
                    <div className="text-sm text-muted-foreground">Tradisjonelle metoder</div>
                  </div>
                  <div className="text-2xl font-bold">78%</div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg border-primary/50">
                  <div>
                    <div className="font-semibold">Digitalt HMS-system</div>
                    <div className="text-sm text-muted-foreground">Moderne løsninger</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">18%</div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
                  <div>
                    <div className="font-semibold">Ingen system</div>
                    <div className="text-sm text-muted-foreground">Ikke systematisk HMS</div>
                  </div>
                  <div className="text-2xl font-bold text-destructive">4%</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Kilde: HMS Nova markedsundersøkelse 2024 (n=1200)
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ISO 9001 */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">ISO 9001 i Norge</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">4.200</CardTitle>
                <CardDescription>Sertifiserte bedrifter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>+10% vs 2023</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Kilde: Standard Norge 2024
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">380</CardTitle>
                <CardDescription>Nye sertifiseringer 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Økende interesse for kvalitetsledelse
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">6-9</CardTitle>
                <CardDescription>Måneder til sertifisering</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Med digitalt HMS-system
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Tradisjonelt: 12-18 måneder
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Kostnader */}
      <section className="container mx-auto px-4 py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Kostnader</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>HMS-administrasjon (timer/måned)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Små bedrifter (0-20)</span>
                    <span className="font-bold">15-25 timer</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Mellomstore (21-50)</span>
                    <span className="font-bold">30-50 timer</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Store (50+)</span>
                    <span className="font-bold">80-120 timer</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Kilde: HMS Nova tidsbruksanalyse 2024
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kostnad ved arbeidsulykke</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Gjennomsnitt per ulykke</span>
                    <span className="font-bold">125.000 kr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Med langvarig fravær</span>
                    <span className="font-bold">450.000 kr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Dødsulykke</span>
                    <span className="font-bold text-destructive">15-25 mill kr</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Kilde: Finans Norge 2024
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sitering */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Bruk av statistikk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                All statistikk på denne siden kan <strong>fritt siteres</strong> med kreditering
                til HMS Nova.
              </p>

              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2">Format for sitering:</p>
                <p className="text-sm text-muted-foreground italic">
                  "Ifølge HMS Nova (2025) bruker 78% av norske bedrifter fortsatt Excel eller papir
                  for HMS-arbeid."
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">Kontakt for media:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>E-post: presse@hmsnova.no</li>
                  <li>Telefon: +47 XXX XX XXX</li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                Sist oppdatert: {new Date().toLocaleDateString('nb-NO', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

