import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { isSalesStaff } from "@/lib/platform-access";
import { loadUpcomingDemos } from "@/server/queries/demo-booking.queries";
import { formatDemoRange } from "@/lib/demo-booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CrmDemosPage() {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }
  const bookings = await loadUpcomingDemos();
  const now = Date.now();
  const upcoming = bookings.filter(
    (booking) => booking.status === "CONFIRMED" && new Date(booking.startAt).getTime() >= now,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Demos</h1>
        <p className="text-muted-foreground">Bookings from the public calendar</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {upcoming.length} upcoming · {bookings.length} total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CRM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No demos booked yet
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDemoRange(new Date(booking.startAt), new Date(booking.endAt))}
                    </TableCell>
                    <TableCell>{booking.name}</TableCell>
                    <TableCell>{booking.company}</TableCell>
                    <TableCell className="text-sm">
                      <a className="underline" href={`mailto:${booking.email}`}>
                        {booking.email}
                      </a>
                      {booking.phone ? (
                        <p className="text-muted-foreground">
                          <a href={`tel:${booking.phone}`}>{booking.phone}</a>
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.status === "CONFIRMED" ? "default" : "secondary"}>
                        {booking.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.crmDealId ? (
                        <Link href={`/admin/crm/deals/${booking.crmDealId}`} className="underline">
                          Deal
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
