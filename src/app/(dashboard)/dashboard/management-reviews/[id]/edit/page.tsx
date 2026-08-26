"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { WellbeingSummaryCard } from "@/components/wellbeing/wellbeing-summary-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TenantUser {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function EditManagementReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    period: "",
    reviewDate: "",
    conductedBy: "",
    status: "PLANNED",
    hmsGoalsReview: "",
    incidentStatistics: "",
    riskReview: "",
    auditResults: "",
    trainingStatus: "",
    resourcesReview: "",
    externalChanges: "",
    wellbeingSummary: "",
    conclusions: "",
    notes: "",
    nextReviewDate: "",
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

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(`/api/management-reviews/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load review");
        }

        const review = data.data;
        setFormData({
          title: review.title || "",
          period: review.period || "",
          reviewDate: review.reviewDate
            ? new Date(review.reviewDate).toISOString().slice(0, 16)
            : "",
          conductedBy: review.conductedBy || "",
          status: review.status || "PLANNED",
          hmsGoalsReview: review.hmsGoalsReview || "",
          incidentStatistics: review.incidentStatistics || "",
          riskReview: review.riskReview || "",
          auditResults: review.auditResults || "",
          trainingStatus: review.trainingStatus || "",
          resourcesReview: review.resourcesReview || "",
          externalChanges: review.externalChanges || "",
          wellbeingSummary: review.wellbeingSummary || "",
          conclusions: review.conclusions || "",
          notes: review.notes || "",
          nextReviewDate: review.nextReviewDate
            ? new Date(review.nextReviewDate).toISOString().slice(0, 16)
            : "",
        });
      } catch (error: any) {
        toast({
          title: "Feil",
          description: error.message,
          variant: "destructive",
        });
        router.push("/dashboard/management-reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [params.id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = {
        title: formData.title,
        period: formData.period,
        reviewDate: new Date(formData.reviewDate).toISOString(),
        conductedBy: formData.conductedBy,
        status: formData.status,
        hmsGoalsReview: formData.hmsGoalsReview,
        incidentStatistics: formData.incidentStatistics,
        riskReview: formData.riskReview,
        auditResults: formData.auditResults,
        trainingStatus: formData.trainingStatus,
        resourcesReview: formData.resourcesReview,
        externalChanges: formData.externalChanges,
        wellbeingSummary: formData.wellbeingSummary,
        conclusions: formData.conclusions,
        notes: formData.notes,
      };

      if (formData.nextReviewDate) {
        payload.nextReviewDate = new Date(formData.nextReviewDate).toISOString();
      }

      const response = await fetch(`/api/management-reviews/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update review");
      }

      toast({
        title: "Gjennomgang oppdatert",
        description: "Endringene er lagret",
      });

      router.push(`/dashboard/management-reviews/${params.id}`);
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/management-reviews/${params.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete review");
      }

      toast({
        title: "Gjennomgang slettet",
        description: "Gjennomgangen er slettet",
      });

      router.push("/dashboard/management-reviews");
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/management-reviews/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit review</h1>
            <p className="text-muted-foreground">Oppdater detaljer for gjennomgangen</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Slett
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the review. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Slett
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextReviewDate">Next review</Label>
                <Input
                  id="nextReviewDate"
                  type="datetime-local"
                  value={formData.nextReviewDate}
                  onChange={(e) =>
                    setFormData({ ...formData, nextReviewDate: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HMS-gjennomgang */}
        <Card>
          <CardHeader>
            <CardTitle>HMS-gjennomgang</CardTitle>
            <CardDescription>
              Status and results from different HSEQ areas
            </CardDescription>
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
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Psychosocial working environment */}
        <Card>
          <CardHeader>
            <CardTitle>Psychosocial working environment</CardTitle>
            <CardDescription>
              Automatic summary based on psychosocial assessments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hent året fra reviewDate eller period */}
            {formData.reviewDate && (
              <WellbeingSummaryCard
                year={new Date(formData.reviewDate).getFullYear()}
                onDataLoaded={(summary) => {
                  setFormData({ ...formData, wellbeingSummary: summary });
                }}
              />
            )}
            
            <div className="space-y-2">
              <Label htmlFor="wellbeingSummary">Summary (auto-generated)</Label>
              <Textarea
                id="wellbeingSummary"
                value={formData.wellbeingSummary}
                onChange={(e) =>
                  setFormData({ ...formData, wellbeingSummary: e.target.value })
                }
                rows={10}
                placeholder="Click ‘Load data’ above to generate a summary"
              />
              <p className="text-xs text-muted-foreground">
                The summary can be edited manually if needed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Konklusjoner */}
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
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={`/dashboard/management-reviews/${params.id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

