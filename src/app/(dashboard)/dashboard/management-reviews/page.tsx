import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { getAdminDb } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { Plus, Calendar, CheckCircle, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";

function getStatusBadge(status: string) {
  const variants: Record<string, { label: string; color: string }> = {
    PLANNED: { label: "Planned", color: "bg-blue-100 text-blue-900" },
    IN_PROGRESS: { label: "In progress", color: "bg-yellow-100 text-yellow-900" },
    COMPLETED: { label: "Completed", color: "bg-green-100 text-green-900" },
    APPROVED: { label: "Approved", color: "bg-green-600 text-white" },
  };
  const info = variants[status] || variants.PLANNED;
  return <Badge className={info.color}>{info.label}</Badge>;
}

export default async function ManagementReviewsPage() {
  const auth = await getAuthContext();
  if (!auth.permissions.canReadManagementReviews) {
    redirect("/dashboard");
  }

  const db = getAdminDb();
  const { data: reviews } = await db
    .from("ManagementReview")
    .select("*")
    .eq("tenantId", auth.tenantId)
    .order("reviewDate", { ascending: false });

  const allReviews = reviews ?? [];

  const stats = {
    total: allReviews.length,
    planned: allReviews.filter((r) => r.status === "PLANNED").length,
    inProgress: allReviews.filter((r) => r.status === "IN_PROGRESS").length,
    completed: allReviews.filter((r) => r.status === "COMPLETED" || r.status === "APPROVED").length,
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex min-w-0 items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold">Management review</h1>
            <p className="text-muted-foreground mt-1">
              Annual/periodic review of the HSEQ system
            </p>
          </div>
          <PageHelpDialog content={helpContent["management-reviews"]} />
        </div>
        {auth.permissions.canCreateManagementReviews && (
          <Link href="/dashboard/management-reviews/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New review
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Planned</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.planned}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In progress</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All reviews</CardTitle>
          <CardDescription>
            Overview of completed and planned management reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allReviews.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reviews recorded yet</p>
              {auth.permissions.canCreateManagementReviews && (
                <Link href="/dashboard/management-reviews/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create first review
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.title}</TableCell>
                        <TableCell>{review.period}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(review.reviewDate), "d MMM yyyy", { locale: enGB })}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                        <TableCell>
                          {review.approvedAt ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">
                                {format(new Date(review.approvedAt), "d MMM yyyy", { locale: enGB })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/management-reviews/${review.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {allReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium line-clamp-1">{review.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{review.period}</p>
                          </div>
                          {getStatusBadge(review.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(review.reviewDate), "d MMM yyyy", { locale: enGB })}
                          </div>
                          {review.approvedAt && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </div>
                          )}
                        </div>
                        <Link href={`/dashboard/management-reviews/${review.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
