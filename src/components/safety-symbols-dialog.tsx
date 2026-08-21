"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, AlertTriangle, Shield } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Dialog som forklarer alle faremerker og PPE-ikoner
 * Brukes for å gi ansatte oversikt over symboler
 */
export function SafetySymbolsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Forklaring på symboler
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Sikkerhetssymboler og verneutstyr
          </DialogTitle>
          <DialogDescription>
            Forklaring på GHS-faremerker og ISO 7010 verneutstyr
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="hazard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hazard" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Faremerker (GHS)
            </TabsTrigger>
            <TabsTrigger value="ppe" className="gap-2">
              <Shield className="h-4 w-4" />
              Verneutstyr (PPE)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hazard" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              GHS (Globally Harmonized System) er et internasjonalt system for klassifisering og merking av farlige kjemikalier.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/faremerker/brannfarlig.webp" alt="Brannfarlig" fill className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Brannfarlig</p>
                  <p className="text-xs text-muted-foreground">Kan antennes lett ved varme, gnister eller flammer</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/faremerker/explosive.webp" alt="Eksplosjonsfarlig" fill className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Eksplosjonsfarlig</p>
                  <p className="text-xs text-muted-foreground">Kan eksplodere ved varme, slag eller friksjon</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/faremerker/etsende.webp" alt="Etsende" fill className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Etsende</p>
                  <p className="text-xs text-muted-foreground">Kan forårsake alvorlige etseskader på hud og øyne</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/faremerker/gass_under_trykk.webp" alt="Gasser under trykk" fill className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Gasser under trykk</p>
                  <p className="text-xs text-muted-foreground">Kan eksplodere ved oppvarming, frostskader mulig</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/faremerker/giftig.webp" alt="Giftig" fill className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Giftig</p>
                  <p className="text-xs text-muted-foreground">Livsfarlig hvis svelget, innåndet eller ved hudkontakt</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/faremerker/helserisiko.webp" alt="Helsefare" fill className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Helsefare</p>
                  <p className="text-xs text-muted-foreground">Kan irritere hud, øyne eller luftveier. Allergi mulig</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/faremerker/kronisk_helsefarlig.webp" alt="Kronisk helsefare" fill className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Kronisk helsefare</p>
                  <p className="text-xs text-muted-foreground">Kan skade organer, kreftfremkallende eller skade forplantning</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/faremerker/miljofare.webp" alt="Miljøfare" fill className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Miljøfare</p>
                  <p className="text-xs text-muted-foreground">Skadelig for vannlevende organismer og miljøet</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/faremerker/oksiderende.webp" alt="Oksiderende" fill className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Oksiderende</p>
                  <p className="text-xs text-muted-foreground">Kan forsterke brann i brennbart materiale</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ppe" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              ISO 7010 standardiserte sikkerhetsskilt for personlig verneutstyr (PPE).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image src="/ppe/ppe-vernebriller.webp" alt="Vernebriller" width={40} height={40} className="object-contain" unoptimized />
                </div>
                <div>
                  <p className="font-semibold text-sm">Vernebriller</p>
                  <p className="text-xs text-muted-foreground">Beskyttelse av øyne mot sprut, støv og farlige stoffer</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image src="/ppe/ppe-vernehansker.webp" alt="Vernehansker" width={40} height={40} className="object-contain" unoptimized />
                </div>
                <div>
                  <p className="font-semibold text-sm">Vernehansker</p>
                  <p className="text-xs text-muted-foreground">Beskyttelse av hender mot kjemikalier og skader</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image src="/ppe/ppe-aandedrettsvern.webp" alt="Åndedrettsvern" width={40} height={40} className="object-contain" unoptimized />
                </div>
                <div>
                  <p className="font-semibold text-sm">Åndedrettsvern</p>
                  <p className="text-xs text-muted-foreground">Beskyttelse mot innånding av farlige gasser, damper eller partikler</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image src="/ppe/ppe-vernehjelm.webp" alt="Vernehjelm" width={40} height={40} className="object-contain" unoptimized />
                </div>
                <div>
                  <p className="font-semibold text-sm">Vernehjelm</p>
                  <p className="text-xs text-muted-foreground">Beskyttelse av hodet mot fallende gjenstander</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image src="/ppe/ppe-fotovern.webp" alt="Fotovern" width={40} height={40} className="object-contain" unoptimized />
                </div>
                <div>
                  <p className="font-semibold text-sm">Vernesko</p>
                  <p className="text-xs text-muted-foreground">Beskyttelse av føtter mot tunge gjenstander og kjemikalier</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image src="/ppe/ppe-hoerselsvern.webp" alt="Hørselsvern" width={40} height={40} className="object-contain" unoptimized />
                </div>
                <div>
                  <p className="font-semibold text-sm">Hørselsvern</p>
                  <p className="text-xs text-muted-foreground">Beskyttelse mot skadelig støy</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image src="/ppe/ppe-verneklr.webp" alt="Verneklær" width={40} height={40} className="object-contain" unoptimized />
                </div>
                <div>
                  <p className="font-semibold text-sm">Verneklær</p>
                  <p className="text-xs text-muted-foreground">Beskyttelse av kroppen mot kjemikalier og forurensning</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image src="/ppe/ppe-ansiktsvern.webp" alt="Ansiktsvern" width={40} height={40} className="object-contain" unoptimized />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ansiktsvern</p>
                  <p className="text-xs text-muted-foreground">Full beskyttelse av ansikt mot sprut og farlige stoffer</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>⚠️ Viktig:</strong> Les alltid sikkerhetsdatabladet (SDS) før bruk! Ved usikkerhet, kontakt HMS-ansvarlig.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
