import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Calendar, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BhtAmoActions } from "@/features/admin/components/bht-amo-actions";

interface PageProps {
  params: Promise<{ id: string; year: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;
  return {
    title: `AMO-møte ${year} | BHT | HMS Nova`,
  };
}

export default async function BhtAmoPage({ params }: PageProps) {
  const { id, year } = await params;
  const yearNum = parseInt(year);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.isSuperAdmin && !user?.isSupport) {
    redirect("/dashboard");
  }

  const bhtClient = await prisma.bhtClient.findUnique({
    where: { id },
    include: {
      tenant: {
        select: { name: true, industry: true },
      },
      amoMeetings: {
        where: { year: yearNum },
      },
    },
  });

  if (!bhtClient || !bhtClient.amoMeetings[0]) {
    notFound();
  }

  const amo = bhtClient.amoMeetings[0];

  // Parse data
  const suggestedAgenda = amo.aiSuggestedAgenda
    ? JSON.parse(amo.aiSuggestedAgenda)
    : [];
  const preparedIssues = amo.preparedIssues
    ? JSON.parse(amo.preparedIssues)
    : [];
  const decisions = amo.decisions
    ? JSON.parse(amo.decisions)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/bht/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">AMO-møte {yearNum}</h1>
            <Badge className={amo.status === "COMPLETED" ? "bg-green-500" : "bg-blue-500"}>
              {amo.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {bhtClient.tenant.name} • Arbeidsmiljøutvalg/organ
          </p>
        </div>
      </div>

      {/* Hjemmel */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>📚 Hjemmel:</strong> AML kap. 7 | BHT-forskriften § 13 c
          </p>
        </CardContent>
      </Card>

      {/* Møtedato */}
      {amo.meetingDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Møtedato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {new Date(amo.meetingDate).toLocaleDateString("nb-NO", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-muted-foreground">
              Type: {amo.meetingType === "DIGITAL" ? "Digitalt møte" : amo.meetingType === "IN_PERSON" ? "Fysisk møte" : "Hybrid"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI-foreslått agenda */}
      {suggestedAgenda.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI-foreslått agenda</CardTitle>
            <CardDescription>
              Automatisk genererte forslag til agendapunkter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestedAgenda.map((item: any, i: number) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{item.topic}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant={item.priority === "HIGH" ? "destructive" : "secondary"}>
                      {item.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forberedt data */}
      {preparedIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avvik fra HMS Nova</CardTitle>
            <CardDescription>
              Avvik som kan diskuteres i møtet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {preparedIssues.slice(0, 5).map((issue: any, i: number) => (
                <div key={i} className="p-2 border rounded">
                  <p className="font-medium">{issue.title}</p>
                </div>
              ))}
              {preparedIssues.length > 5 && (
                <p className="text-sm text-muted-foreground">
                  ... og {preparedIssues.length - 5} flere
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endelig agenda */}
      {amo.agenda && (
        <Card>
          <CardHeader>
            <CardTitle>Endelig agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{amo.agenda}</div>
          </CardContent>
        </Card>
      )}

      {/* Referat */}
      {amo.minutes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Møtereferat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap p-4 bg-muted rounded-lg">
              {amo.minutes}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Beslutninger */}
      {decisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Beslutninger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {decisions.map((decision: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 border rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{typeof decision === "string" ? decision : decision.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Handlinger */}
      <Card>
        <CardHeader>
          <CardTitle>Handlinger</CardTitle>
        </CardHeader>
        <CardContent>
          <BhtAmoActions
            meetingId={amo.id}
            bhtClientId={id}
            currentStatus={amo.status}
            currentAgenda={amo.agenda || ""}
            currentMinutes={amo.minutes || ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}

