"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addBhtClient } from "@/server/actions/bht.actions";
import { Loader2 } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  orgNumber: string | null;
  industry: string | null;
  employeeCount: number | null;
  contactEmail: string | null;
  contactPerson: string | null;
}

interface AddBhtClientFormProps {
  tenants: Tenant[];
}

export function AddBhtClientForm({ tenants }: AddBhtClientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [packageType, setPackageType] = useState<"BASIC" | "EXTENDED">("BASIC");
  const [contractStartDate, setContractStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [contractEndDate, setContractEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedTenantId) {
      toast({
        variant: "destructive",
        title: "Velg kunde",
        description: "Du må velge en kunde",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await addBhtClient({
        tenantId: selectedTenantId,
        packageType,
        contractStartDate: new Date(contractStartDate),
        contractEndDate: contractEndDate ? new Date(contractEndDate) : undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        toast({
          title: "✅ BHT-kunde opprettet",
          description: `${selectedTenant?.name} er nå registrert som BHT-kunde`,
        });
        router.push(`/admin/bht/${result.clientId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Feil",
          description: result.error,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Systemfeil",
        description: "Kunne ikke opprette BHT-kunde",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="tenant">Kunde *</Label>
        <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
          <SelectTrigger>
            <SelectValue placeholder="Velg kunde..." />
          </SelectTrigger>
          <SelectContent>
            {tenants.length === 0 ? (
              <SelectItem value="none" disabled>
                Ingen tilgjengelige kunder
              </SelectItem>
            ) : (
              tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                  {tenant.orgNumber && ` (${tenant.orgNumber})`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {selectedTenant && (
          <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
            <p><strong>Bransje:</strong> {selectedTenant.industry || "Ikke angitt"}</p>
            <p><strong>Ansatte:</strong> {selectedTenant.employeeCount || "Ikke angitt"}</p>
            <p><strong>Kontakt:</strong> {selectedTenant.contactPerson || "Ikke angitt"}</p>
            <p><strong>E-post:</strong> {selectedTenant.contactEmail || "Ikke angitt"}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="packageType">Pakketype *</Label>
        <Select
          value={packageType}
          onValueChange={(v) => setPackageType(v as "BASIC" | "EXTENDED")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BASIC">
              Grunnpakke BHT
            </SelectItem>
            <SelectItem value="EXTENDED">
              Utvidet BHT-pakke
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {packageType === "BASIC"
            ? "Inneholder: Kartlegging, rådgivning, AMO/vernerunde, eksponering, årsrapport"
            : "Inneholder alt i grunnpakke + individoppfølging, helsekontroller, mm."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Avtalestart *</Label>
          <Input
            id="startDate"
            type="date"
            value={contractStartDate}
            onChange={(e) => setContractStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Avtaleslutt (valgfritt)</Label>
          <Input
            id="endDate"
            type="date"
            value={contractEndDate}
            onChange={(e) => setContractEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notater</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Eventuelle notater om avtalen..."
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Avbryt
        </Button>
        <Button type="submit" disabled={loading || !selectedTenantId}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Opprett BHT-kunde
        </Button>
      </div>
    </form>
  );
}

