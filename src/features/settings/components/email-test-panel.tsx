"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  ClipboardCheck,
  AlertCircle,
  ListTodo,
  Mail,
  CheckCircle2,
  Loader2,
  Bell,
  Target,
  FileBarChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmailTestPanelProps {
  currentUser: {
    id: string;
    email: string;
    name: string | null;
    notifyByEmail: boolean;
  };
  tenantUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    notifyByEmail: boolean;
    notifyBySms: boolean;
    phone: string | null;
  }>;
  tenantId: string;
  tenantName: string;
}

type NotificationType =
  | "meeting"
  | "inspection"
  | "audit"
  | "measure"
  | "incident"
  | "training"
  | "document"
  | "management-review";

const notificationTypes: Array<{
  value: NotificationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "meeting",
    label: "Møtevarsling",
    description: "Påminnelse om kommende møte (vernerunde, ledelsesgjennomgang, etc.)",
    icon: Calendar,
  },
  {
    value: "inspection",
    label: "Inspeksjonsvarsling",
    description: "Påminnelse om planlagt inspeksjon/vernerunde",
    icon: ClipboardCheck,
  },
  {
    value: "audit",
    label: "Revisjonsvarsling",
    description: "Påminnelse om kommende revisjon eller audit",
    icon: Target,
  },
  {
    value: "measure",
    label: "Tiltaksvarsling",
    description: "Påminnelse om tiltak som nærmer seg forfallsdato",
    icon: ListTodo,
  },
  {
    value: "incident",
    label: "Hendelsesrapport",
    description: "Varsling om nytt avvik eller hendelse som krever oppfølging",
    icon: AlertCircle,
  },
  {
    value: "training",
    label: "Opplæringsvarsling",
    description: "Påminnelse om kurs som utløper snart eller er obligatorisk",
    icon: Target,
  },
  {
    value: "document",
    label: "Dokumentvarsling",
    description: "Varsling om dokument som må gjennomgås/godkjennes",
    icon: FileBarChart,
  },
  {
    value: "management-review",
    label: "Ledelsesgjennomgang",
    description: "Påminnelse om planlagt ledelsesgjennomgang",
    icon: FileBarChart,
  },
];

export function EmailTestPanel({
  currentUser,
  tenantUsers,
  tenantId,
  tenantName,
}: EmailTestPanelProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<NotificationType>("meeting");
  const [selectedUser, setSelectedUser] = useState<string>(currentUser.id);
  const [loading, setLoading] = useState(false);
  const [lastSent, setLastSent] = useState<{ type: string; email: string; time: Date } | null>(
    null
  );

  const selectedNotification = notificationTypes.find((n) => n.value === selectedType);
  const selectedUserData = tenantUsers.find((u) => u.id === selectedUser);

  const handleSendTest = async () => {
    if (!selectedUserData) {
      toast({
        title: "Feil",
        description: "Ingen bruker valgt",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUserData.notifyByEmail) {
      toast({
        title: "Advarsel",
        description: `${selectedUserData.name || selectedUserData.email} har deaktivert e-postvarslinger`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          userId: selectedUser,
          tenantId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Test-e-post sendt!",
          description: `${selectedNotification?.label} sendt til ${selectedUserData.email}`,
          className: "bg-green-50 border-green-200",
        });
        setLastSent({
          type: selectedNotification?.label || "",
          email: selectedUserData.email,
          time: new Date(),
        });
      } else {
        toast({
          title: "Feil ved sending",
          description: result.error || "Kunne ikke sende test-e-post",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende test-e-post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const Icon = selectedNotification?.icon || Bell;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Send test-e-post</CardTitle>
              <CardDescription>
                Velg type varsling og mottaker for å teste e-postsystemet
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type velger */}
          <div className="space-y-2">
            <Label>Type varsling</Label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as NotificationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedNotification && (
              <p className="text-sm text-muted-foreground">{selectedNotification.description}</p>
            )}
          </div>

          {/* Mottaker */}
          <div className="space-y-2">
            <Label>Mottaker</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tenantUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.name || user.email}</span>
                      {user.notifyByEmail && (
                        <Badge variant="outline" className="text-xs">
                          ✓ E-post aktivert
                        </Badge>
                      )}
                      {!user.notifyByEmail && (
                        <Badge variant="destructive" className="text-xs">
                          E-post deaktivert
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUserData && (
              <p className="text-sm text-muted-foreground">
                E-post vil bli sendt til: <code className="bg-muted px-1 py-0.5 rounded">{selectedUserData.email}</code>
              </p>
            )}
          </div>

          {/* Forhåndsvisning */}
          {selectedNotification && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  Forhåndsvisning av e-post
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Emne:</span>{" "}
                  <span className="text-muted-foreground">
                    {getEmailSubject(selectedType, tenantName)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Innhold:</span>{" "}
                  <span className="text-muted-foreground">
                    {getEmailPreview(selectedType, tenantName)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Send knapp */}
          <Button onClick={handleSendTest} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sender...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send test-e-post
              </>
            )}
          </Button>

          {/* Siste sending */}
          {lastSent && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900">Sist sendt e-post</p>
                <p className="text-green-700">
                  {lastSent.type} til {lastSent.email}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  {lastSent.time.toLocaleString("nb-NO")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brukeroversikt */}
      <Card>
        <CardHeader>
          <CardTitle>Brukere med e-postvarslinger</CardTitle>
          <CardDescription>
            Oversikt over hvilke brukere som har aktivert e-postvarslinger
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tenantUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.name || "Ukjent"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  {user.notifyByEmail && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Mail className="h-3 w-3 mr-1" />
                      E-post
                    </Badge>
                  )}
                  {user.notifyBySms && user.phone && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      SMS
                    </Badge>
                  )}
                  {!user.notifyByEmail && !user.notifyBySms && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Ingen varsler
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getEmailSubject(type: NotificationType, tenantName: string): string {
  switch (type) {
    case "meeting":
      return `Påminnelse: Møte i morgen - ${tenantName}`;
    case "inspection":
      return `Påminnelse: Vernerunde planlagt - ${tenantName}`;
    case "audit":
      return `Påminnelse: Revisjon planlagt - ${tenantName}`;
    case "measure":
      return `Påminnelse: Tiltak forfaller snart - ${tenantName}`;
    case "incident":
      return `Nytt avvik rapportert - ${tenantName}`;
    case "training":
      return `Påminnelse: Kurs utløper snart - ${tenantName}`;
    case "document":
      return `Dokument venter på godkjenning - ${tenantName}`;
    case "management-review":
      return `Påminnelse: Ledelsesgjennomgang planlagt - ${tenantName}`;
    default:
      return `Varsling fra ${tenantName}`;
  }
}

function getEmailPreview(type: NotificationType, tenantName: string): string {
  switch (type) {
    case "meeting":
      return "Du har et møte i morgen kl. 10:00. Husk å forberede deg ved å gå gjennom sakslisten.";
    case "inspection":
      return "Det er planlagt en vernerunde/inspeksjon i morgen. Vennligst sørg for at alt er klart.";
    case "audit":
      return "En revisjon er planlagt neste uke. Sjekk at all dokumentasjon er oppdatert.";
    case "measure":
      return "Du har 3 tiltak som forfaller i løpet av de neste 7 dagene. Logg inn for å se detaljer.";
    case "incident":
      return "Et nytt avvik er rapportert og krever din oppfølging. Logg inn for å se mer.";
    case "training":
      return "Ditt førstehjelpskurs utløper om 30 dager. Vennligst sørg for å fornye sertifikatet.";
    case "document":
      return "Ett eller flere dokumenter venter på godkjenning. Logg inn for å gjennomgå.";
    case "management-review":
      return "Det er snart tid for ledelsesgjennomgang. Vennligst forbered rapport og data.";
    default:
      return "Du har en ny varsling fra HMS Nova.";
  }
}
