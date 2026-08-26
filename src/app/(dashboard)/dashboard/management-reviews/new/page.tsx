"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TenantUser {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function NewManagementReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    period: "",
    reviewDate: "",
    conductedBy: "",
    hmsGoalsReview: "",
    incidentStatistics: "",
    riskReview: "",
    auditResults: "",
    trainingStatus: "",
    resourcesReview: "",
    externalChanges: "",
    conclusions: "",
    notes: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.user?.tenantId) return;

      try {
        const response = await fetch(`/api/tenants/${session.user.tenantId}/users`);
        const data = await response.json();

        if (response.ok && data.users) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [session?.user?.tenantId]);

  const handlePrefillData = async () => {
    setLoadingPrefill(true);

    try {
      const response = await fetch("/api/management-reviews/prefill-data?months=3");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not fetch data");
      }

      // Oppdater form med forhåndsutfylt data
      setFormData((prev) => ({
        ...prev,
        hmsGoalsReview: data.data.hmsGoalsReview || prev.hmsGoalsReview,
        incidentStatistics: data.data.incidentStatistics || prev.incidentStatistics,
        riskReview: data.data.riskReview || prev.riskReview,
        auditResults: data.data.auditResults || prev.auditResults,
        trainingStatus: data.data.trainingStatus || prev.trainingStatus,
      }));

      toast({
        title: "Data hentet",
        description: "Fields are pre-filled with data from the system. You can edit and adjust as needed.",
      });
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPrefill(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/management-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reviewDate: new Date(formData.reviewDate).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create review");
      }

      toast({
        title: "Gjennomgang opprettet",
        description: "Management review created",
      });

      router.push(`/dashboard/management-reviews/${data.data.id}`);
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/management-reviews">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New management review</h1>
          <p className="text-muted-foreground">
            Create a new periodic review of the HSEQ system
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grunnleggende informasjon */}
        <Card>
          <CardHeader>
            <CardTitle>Grunnleggende informasjon</CardTitle>
            <CardDescription>
              Fill in basic details about the review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Tittel <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Management review Q4 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">
                  Periode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="period"
                  value={formData.period}
                  onChange={(e) =>
                    setFormData({ ...formData, period: e.target.value })
                  }
                  placeholder="F.eks. Q4 2024, H2 2024, eller 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewDate">
                  Gjennomgangsdato <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reviewDate"
                  type="datetime-local"
                  value={formData.reviewDate}
                  onChange={(e) =>
                    setFormData({ ...formData, reviewDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conductedBy">
                  Conducted by <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.conductedBy}
                  onValueChange={(value) =>
                    setFormData({ ...formData, conductedBy: value })
                  }
                  disabled={loadingUsers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.user.id} value={u.user.id}>
                        {u.user.name || u.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input data - HMS gjennomgang */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gjennomgang av HMS-systemet</CardTitle>
                <CardDescription>
                  Fill in status and results from different HSEQ areas
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrefillData}
                disabled={loadingPrefill}
              >
                {loadingPrefill ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Henter data...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Pre-fill from the system
                  </>
                )}
              </Button>
            </div>
            {!loadingPrefill && (
              <Alert className="mt-4">
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Click the button above to automatically fetch data from the last 3 months. 
                  You can edit the text afterwards.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hmsGoalsReview">HSEQ goals and results</Label>
              <Textarea
                id="hmsGoalsReview"
                value={formData.hmsGoalsReview}
                onChange={(e) =>
                  setFormData({ ...formData, hmsGoalsReview: e.target.value })
                }
                placeholder="Review of HSEQ goals, achievement and incidents..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidentStatistics">Incidents and events</Label>
              <Textarea
                id="incidentStatistics"
                value={formData.incidentStatistics}
                onChange={(e) =>
                  setFormData({ ...formData, incidentStatistics: e.target.value })
                }
                placeholder="Statistics on incidents, events and trends..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskReview">Risk assessments</Label>
              <Textarea
                id="riskReview"
                value={formData.riskReview}
                onChange={(e) =>
                  setFormData({ ...formData, riskReview: e.target.value })
                }
                placeholder="Status of risk assessments and risk levels..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auditResults">Audits and inspections</Label>
              <Textarea
                id="auditResults"
                value={formData.auditResults}
                onChange={(e) =>
                  setFormData({ ...formData, auditResults: e.target.value })
                }
                placeholder="Results from audits and workplace inspections..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainingStatus">Training and competence</Label>
              <Textarea
                id="trainingStatus"
                value={formData.trainingStatus}
                onChange={(e) =>
                  setFormData({ ...formData, trainingStatus: e.target.value })
                }
                placeholder="Training status, competence gaps..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resourcesReview">Resources and budget</Label>
              <Textarea
                id="resourcesReview"
                value={formData.resourcesReview}
                onChange={(e) =>
                  setFormData({ ...formData, resourcesReview: e.target.value })
                }
                placeholder="Vurdering av ressurser, budsjett og behov..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalChanges">External changes</Label>
              <Textarea
                id="externalChanges"
                value={formData.externalChanges}
                onChange={(e) =>
                  setFormData({ ...formData, externalChanges: e.target.value })
                }
                placeholder="Endringer i lover, forskrifter, standarder..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Output data - Konklusjoner */}
        <Card>
          <CardHeader>
            <CardTitle>Conclusions and follow-up</CardTitle>
            <CardDescription>
              Summarise conclusions and required actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conclusions">Conclusions</Label>
              <Textarea
                id="conclusions"
                value={formData.conclusions}
                onChange={(e) =>
                  setFormData({ ...formData, conclusions: e.target.value })
                }
                placeholder="Overordnede konklusjoner fra gjennomgangen..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Other notes..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/management-reviews">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Creating..." : "Create review"}
          </Button>
        </div>
      </form>
    </div>
  );
}

