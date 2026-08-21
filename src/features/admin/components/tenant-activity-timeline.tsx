"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createTenantActivity } from "@/server/actions/tenant.actions";
import { Loader2, Clock, Phone, Mail, Users, MessageCircle } from "lucide-react";

type TenantActivityType = "CONTACT" | "FOLLOW_UP" | "OFFER_SENT" | "MEETING" | "OTHER";
type TenantActivityChannel = "PHONE" | "EMAIL" | "MEETING" | "OTHER";

interface TenantActivityTimelineProps {
  tenantId: string;
  activities: {
    id: string;
    type: TenantActivityType;
    channel: TenantActivityChannel;
    note: string;
    createdAt: string | Date;
  }[];
}

export function TenantActivityTimeline({ tenantId, activities }: TenantActivityTimelineProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState<TenantActivityType>("CONTACT");
  const [channel, setChannel] = useState<TenantActivityChannel>("PHONE");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!note.trim()) {
      toast({
        variant: "destructive",
        title: "Tomt notat",
        description: "Skriv et kort notat før du lagrer.",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await createTenantActivity({
      tenantId,
      type,
      channel,
      note: note.trim(),
    });
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Aktivitet lagret",
        description: "CRM-aktiviteten er lagret for kunden.",
      });
      setNote("");
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Kunne ikke lagre aktivitet",
        description: result.error || "Noe gikk galt. Prøv igjen.",
      });
    }
  };

  const formatTypeLabel = (value: TenantActivityType) => {
    switch (value) {
      case "CONTACT":
        return "Førstegangskontakt";
      case "FOLLOW_UP":
        return "Oppfølging";
      case "OFFER_SENT":
        return "Tilbud sendt";
      case "MEETING":
        return "Møte / demo";
      case "OTHER":
      default:
        return "Annet";
    }
  };

  const formatChannelLabel = (value: TenantActivityChannel) => {
    switch (value) {
      case "PHONE":
        return "Telefon";
      case "EMAIL":
        return "E-post";
      case "MEETING":
        return "Møte";
      case "OTHER":
      default:
        return "Annet";
    }
  };

  const getChannelIcon = (value: TenantActivityChannel) => {
    switch (value) {
      case "PHONE":
        return <Phone className="h-3 w-3 mr-1" />;
      case "EMAIL":
        return <Mail className="h-3 w-3 mr-1" />;
      case "MEETING":
        return <Users className="h-3 w-3 mr-1" />;
      case "OTHER":
      default:
        return <MessageCircle className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitetslogg (salg / oppfølging)</CardTitle>
        <CardDescription>
          Registrer kontakt, tilbud, møter og annen oppfølging for denne kunden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="activity-type">Type aktivitet</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as TenantActivityType)}
              >
                <SelectTrigger id="activity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTACT">Førstegangskontakt</SelectItem>
                  <SelectItem value="FOLLOW_UP">Oppfølging</SelectItem>
                  <SelectItem value="OFFER_SENT">Tilbud sendt</SelectItem>
                  <SelectItem value="MEETING">Møte / demo</SelectItem>
                  <SelectItem value="OTHER">Annet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="activity-channel">Kanal</Label>
              <Select
                value={channel}
                onValueChange={(value) => setChannel(value as TenantActivityChannel)}
              >
                <SelectTrigger id="activity-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHONE">Telefon</SelectItem>
                  <SelectItem value="EMAIL">E-post</SelectItem>
                  <SelectItem value="MEETING">Møte</SelectItem>
                  <SelectItem value="OTHER">Annet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-note">Notat</Label>
            <Textarea
              id="activity-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="F.eks. 2026-02-09 – Ringte kontaktperson, avtalt demo neste uke, tilbud sendes innen fredag."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lagre aktivitet
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Historikk</h3>
            <p className="text-xs text-muted-foreground">
              Viser de {activities.length} siste aktivitetene
            </p>
          </div>

          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen registrerte aktiviteter ennå. Legg inn første aktivitet over.
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const createdAt =
                  activity.createdAt instanceof Date
                    ? activity.createdAt
                    : new Date(activity.createdAt);

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {createdAt.toLocaleDateString("nb-NO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          kl.{" "}
                          {createdAt.toLocaleTimeString("nb-NO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatTypeLabel(activity.type)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs flex items-center">
                          {getChannelIcon(activity.channel)}
                          {formatChannelLabel(activity.channel)}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{activity.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

