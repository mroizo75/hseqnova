"use client";

import { useState, useTransition } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { FeedbackSource, FeedbackSentiment } from "@prisma/client";
import { createCustomerFeedback } from "@/server/actions/feedback.actions";

interface FeedbackFormProps {
  users: Array<{ id: string; name?: string | null; email: string }>;
  goals: Array<{ id: string; title: string }>;
}

const NO_OWNER = "__none__";
const NO_GOAL = "__none_goal__";
const NO_RATING = "__no_rating__";

const sourceOptions: Array<{ value: FeedbackSource; label: string }> = [
  { value: "EMAIL", label: "E-post" },
  { value: "PHONE", label: "Telefon" },
  { value: "MEETING", label: "Møte" },
  { value: "SURVEY", label: "Spørreundersøkelse" },
  { value: "SOCIAL", label: "Sosiale medier" },
  { value: "OTHER", label: "Annet" },
];

const sentimentOptions: Array<{ value: FeedbackSentiment; label: string }> = [
  { value: "POSITIVE", label: "Positiv" },
  { value: "NEUTRAL", label: "Nøytral" },
  { value: "NEGATIVE", label: "Negativ" },
];

export function FeedbackForm({ users, goals }: FeedbackFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [sentiment, setSentiment] = useState<FeedbackSentiment>("POSITIVE");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createCustomerFeedback(formData);
      if (result.success) {
        toast({
          title: "✅ Tilbakemelding registrert",
          description: "Positive kundeinnspill er lagret og kan følges opp.",
          className: "bg-green-50 border-green-200",
        });
        router.push("/dashboard/feedback");
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Kunne ikke lagre",
          description: result.error || "Prøv igjen senere",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kundetilbakemelding</CardTitle>
          <CardDescription>Registrer positive tilbakemeldinger fra kunder (ISO 9001: 9.1.2)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Kontaktperson</Label>
              <Input id="customerName" name="customerName" placeholder="Navn på kunde" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerCompany">Kunde / organisasjon</Label>
              <Input id="customerCompany" name="customerCompany" placeholder="Firma eller prosjekt" disabled={isPending} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">E-post</Label>
              <Input id="contactEmail" name="contactEmail" type="email" placeholder="kunde@firma.no" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefon</Label>
              <Input id="contactPhone" name="contactPhone" placeholder="+47 ..." disabled={isPending} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Kanal / kilde</Label>
              <Select name="source" defaultValue="EMAIL" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg kanal" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stemning</Label>
              <Select
                name="sentiment"
                value={sentiment}
                onValueChange={(value) => setSentiment(value as FeedbackSentiment)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg stemning" />
                </SelectTrigger>
                <SelectContent>
                  {sentimentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Vurdering (1-5)</Label>
              <Select name="rating" defaultValue={NO_RATING} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg (valgfritt)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_RATING}>Ingen vurdering</SelectItem>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Oppsummering *</Label>
            <Input
              id="summary"
              name="summary"
              required
              disabled={isPending}
              placeholder="F.eks. 'Kunde roser responstid og oppfølging'"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Detaljer</Label>
            <Textarea
              id="details"
              name="details"
              rows={4}
              disabled={isPending}
              placeholder="Beskriv tilbakemeldingen i egne ord"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlights">Hva skal deles internt?</Label>
            <Textarea
              id="highlights"
              name="highlights"
              rows={3}
              disabled={isPending}
              placeholder="Nøkkelpunkt som bør løftes i ledelsens gjennomgang, nyhetsbrev osv."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ansvarlig for videre oppfølging</Label>
              <Select name="followUpOwnerId" defaultValue={NO_OWNER} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg person (valgfritt)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_OWNER}>Ingen</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Knytt til mål (valgfritt)</Label>
              <Select name="linkedGoalId" defaultValue={NO_GOAL} disabled={isPending || goals.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={goals.length ? "Velg mål" : "Ingen mål tilgjengelig"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GOAL}>Ingen</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Lagrer..." : "Lagre tilbakemelding"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

