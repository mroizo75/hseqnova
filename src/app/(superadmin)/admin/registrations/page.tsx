import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPendingRegistrations } from "@/server/actions/admin-registration.actions";
import { 
  Building2, 
  Calendar, 
  Mail, 
  Phone, 
  Users, 
  MapPin,
  Clock,
  Eye,
  ArrowRight
} from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "New registrations | HSEQ Nova Admin",
  description: "Manage new company registrations",
};

async function RegistrationsList() {
  const result = await getPendingRegistrations();

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Could not load registrations</p>
        </CardContent>
      </Card>
    );
  }

  const registrations = result.data;

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No new registrations</p>
          <p className="text-sm text-muted-foreground">
            When companies register, they will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {registrations.map((registration) => {
        const hasUsers = registration.users && registration.users.length > 0;
        const isNew = registration.onboardingStatus === "NOT_STARTED";

        return (
          <Card key={registration.id} className={isNew ? "border-primary/50" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{registration.name}</CardTitle>
                    {isNew && (
                      <Badge variant="default" className="bg-primary">
                        NEW
                      </Badge>
                    )}
                    {hasUsers && (
                      <Badge variant="secondary">Account created</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    Reg. no.: {registration.orgNumber || "Not provided"}
                  </CardDescription>
                </div>
                <Link href={`/admin/registrations/${registration.id}`}>
                  <Button>
                    <Eye className="h-4 w-4 mr-2" />
                    View details
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{registration.contactPerson}</p>
                      <p className="text-muted-foreground text-xs">Contact person</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{registration.contactEmail}</p>
                      <p className="text-muted-foreground text-xs">Email</p>
                    </div>
                  </div>

                  {registration.contactPhone && (
                    <div className="flex items-start gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{registration.contactPhone}</p>
                        <p className="text-muted-foreground text-xs">Phone</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {(registration.address || registration.city) && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {registration.address && <span>{registration.address}<br /></span>}
                          {registration.postalCode && registration.city && (
                            <span>{registration.postalCode} {registration.city}</span>
                          )}
                        </p>
                        <p className="text-muted-foreground text-xs">Address</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {registration.employeeCount || "Unknown"} employees
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Industry: {registration.industry || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {new Date(registration.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-muted-foreground text-xs">Registered</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing info */}
              {registration.subscription && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {registration.pricingTier === "MICRO" && "Micro (1-20 employees)"}
                        {registration.pricingTier === "SMALL" && "Small (21-50 employees)"}
                        {registration.pricingTier === "MEDIUM" && "Medium (51+ employees)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {registration.subscription.price.toLocaleString("en-GB")} £/year
                      </p>
                    </div>
                    {registration.trialEndsAt && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Trial until{" "}
                        {new Date(registration.trialEndsAt).toLocaleDateString("en-GB")}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {registration.notes && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium mb-2">Notes:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {registration.notes}
                  </p>
                </div>
              )}

              {/* Quick action */}
              {!hasUsers && (
                <div className="mt-6 pt-6 border-t">
                  <Link href={`/admin/registrations/${registration.id}`}>
                    <Button variant="outline" className="w-full">
                      Create admin account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function RegistrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">New registrations</h1>
        <p className="text-muted-foreground">
          Process and activate new company registrations
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Loading registrations...</p>
            </CardContent>
          </Card>
        }
      >
        <RegistrationsList />
      </Suspense>
    </div>
  );
}
