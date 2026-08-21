"use client";

import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BcmHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          <span className="sr-only">Hjelp om BCM</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hva er BCM (Beredskap og kontinuitetsstyring)?</DialogTitle>
          <DialogDescription>
            ISO 22301: Business Continuity Management System (BCMS)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">📋 Formål</h3>
              <p className="text-sm text-muted-foreground">
                BCM sikrer at din bedrift kan fortsette å levere kritiske tjenester og produkter
                selv ved uforutsette hendelser som brann, strømbrudd, cyberangrep, pandemier eller
                naturkatastrofer.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">📄 Hva skal BCM-planen inneholde?</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-foreground">1. Kritiske prosesser og tjenester</h4>
                  <p className="text-muted-foreground">
                    Identifiser hvilke prosesser som er avgjørende for drift (f.eks. produksjon,
                    IT-systemer, kundeservice, forsyningskjeder).
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">2. Avhengigheter og ressurser</h4>
                  <p className="text-muted-foreground">
                    Kartlegg nøkkelpersonell, leverandører, utstyr, lokaler og IT-systemer som er
                    nødvendige for kritiske prosesser.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground">3. Risikovurdering (BIA)</h4>
                  <p className="text-muted-foreground">
                    Gjennomfør en Business Impact Analysis (BIA) for å vurdere konsekvenser av
                    driftsavbrudd og akseptabel nedetid (RTO - Recovery Time Objective).
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground">4. Gjenopprettingsstrategier</h4>
                  <p className="text-muted-foreground">
                    Beskriv konkrete tiltak for å gjenopprette drift, inkludert backup-løsninger,
                    alternative arbeidsplasser og reserveløsninger.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground">5. Krisehåndbok og responsteam</h4>
                  <p className="text-muted-foreground">
                    Definer roller og ansvar, kontaktlister (døgnvakt), varslingsprosedyrer og
                    eskaleringsplan ved krise.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground">6. Kommunikasjonsplan</h4>
                  <p className="text-muted-foreground">
                    Hvordan informere ansatte, kunder, leverandører, media og myndigheter ved en
                    hendelse?
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground">7. Øvelser og testing</h4>
                  <p className="text-muted-foreground">
                    Planlegg regelmessige BCM-øvelser (bordøvelser, simulering, fullskala test) for
                    å verifisere at planen fungerer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">🔥 Eksempler på beredskapssituasjoner</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• <strong>Brann:</strong> Evakuering og midlertidig arbeidsplass</li>
                <li>• <strong>IT-utfall:</strong> Backup-systemer og gjenoppretting av data</li>
                <li>• <strong>Pandemi:</strong> Hjemmekontor og redusert bemanning</li>
                <li>• <strong>Leverandørsvikt:</strong> Alternative leverandører</li>
                <li>• <strong>Strømbrudd:</strong> Nødstrøm og manuell drift</li>
                <li>• <strong>Cyberangrep:</strong> IT-sikkerhet og gjenoppretting</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">🔄 PDCA-syklusen i BCM</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong className="text-foreground">Plan:</strong>
                  <span className="text-muted-foreground ml-2">
                    Identifiser risiko, kritiske prosesser og lag BCM-plan
                  </span>
                </div>
                <div>
                  <strong className="text-foreground">Do:</strong>
                  <span className="text-muted-foreground ml-2">
                    Implementer tiltak, tren personell og gjennomfør øvelser
                  </span>
                </div>
                <div>
                  <strong className="text-foreground">Check:</strong>
                  <span className="text-muted-foreground ml-2">
                    Evaluer øvelser, test backup og gjennomgå planen årlig
                  </span>
                </div>
                <div>
                  <strong className="text-foreground">Act:</strong>
                  <span className="text-muted-foreground ml-2">
                    Oppdater planen basert på læring og endringer i virksomheten
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-blue-900">💡 Tips for å komme i gang</h3>
              <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                <li>Start med å identifisere 3-5 kritiske prosesser i din bedrift</li>
                <li>Gjennomfør en enkel BIA (Business Impact Analysis)</li>
                <li>Lag en kontaktliste for kriseteam og nøkkelpersonell</li>
                <li>Dokumenter backup-løsninger for IT, lokaler og utstyr</li>
                <li>Planlegg en enkel bordøvelse for å teste planen</li>
                <li>Oppdater planen minst én gang i året</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
