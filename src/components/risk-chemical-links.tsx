"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Trash2, TestTube, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  unlinkChemicalFromRisk,
  getRiskLinksForChemical,
} from "@/server/actions/risk-chemical.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddChemicalToRiskDialog } from "./add-chemical-to-risk-dialog";

interface RiskChemicalLinksProps {
  riskId: string;
  links: any[];
  canEdit?: boolean;
}

export function RiskChemicalLinks({ riskId, links, canEdit = true }: RiskChemicalLinksProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleUnlink = async (linkId: string, chemicalName: string) => {
    if (!confirm(`Er du sikker på at du vil fjerne koblingen til "${chemicalName}"?`)) {
      return;
    }

    setLoading(linkId);
    const result = await unlinkChemicalFromRisk(linkId);

    if (result.success) {
      toast({
        title: "✅ Kobling fjernet",
        description: `Kjemikalie "${chemicalName}" er ikke lenger knyttet til denne risikoen`,
        className: "bg-green-50 border-green-200",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Feil",
        description: result.error || "Kunne ikke fjerne kobling",
      });
    }

    setLoading(null);
  };

  const getExposureBadge = (exposure: string) => {
    const config = {
      LOW: { color: "bg-green-100 text-green-800", label: "Lav" },
      MEDIUM: { color: "bg-yellow-100 text-yellow-800", label: "Moderat" },
      HIGH: { color: "bg-orange-100 text-orange-800", label: "Høy" },
      CRITICAL: { color: "bg-red-100 text-red-800", label: "Kritisk" },
    };

    const { color, label } = config[exposure as keyof typeof config] || config.MEDIUM;

    return (
      <Badge className={color} variant="outline">
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Kjemikalier</CardTitle>
              <CardDescription>
                Farlige stoffer knyttet til denne risikoen
              </CardDescription>
            </div>
          </div>
          {canEdit && (
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Legg til kjemikalie
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TestTube className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Ingen kjemikalier knyttet til denne risikoen</p>
            {canEdit && (
              <p className="text-sm mt-2">
                Klikk &quot;Legg til kjemikalie&quot; for å koble et farlig stoff
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{link.chemical.productName}</h4>
                    {getExposureBadge(link.exposure)}
                    {link.ppRequired && (
                      <Badge variant="outline" className="bg-blue-50">
                        <Shield className="h-3 w-3 mr-1" />
                        Verneutstyr påkrevd
                      </Badge>
                    )}
                  </div>

                  {link.chemical.supplier && (
                    <p className="text-sm text-muted-foreground">
                      Leverandør: {link.chemical.supplier}
                    </p>
                  )}

                  {link.chemical.casNumber && (
                    <p className="text-sm text-muted-foreground">
                      CAS: {link.chemical.casNumber}
                    </p>
                  )}

                  {(link.chemical.isCMR ||
                    link.chemical.isSVHC ||
                    link.chemical.containsIsocyanates) && (
                    <div className="flex gap-2 mt-2">
                      {link.chemical.isCMR && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          CMR
                        </Badge>
                      )}
                      {link.chemical.isSVHC && (
                        <Badge variant="destructive">SVHC</Badge>
                      )}
                      {link.chemical.containsIsocyanates && (
                        <Badge variant="destructive">Diisocyanater</Badge>
                      )}
                    </div>
                  )}

                  {link.note && (
                    <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      {link.note}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlink(link.id, link.chemical.productName)}
                    disabled={loading === link.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <AddChemicalToRiskDialog
            riskId={riskId}
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
          />
        )}
      </CardContent>
    </Card>
  );
}
