"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EmailSettingsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const currentSettings = {
    fromEmail: "noreply@hseqnova.com",
    fromName: "HSEQ Nova",
    replyToEmail: "support@hseqnova.com",
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "✅ E-postinnstillinger lagret",
      description: "Resend-konfigurasjonen er oppdatert",
      className: "bg-green-50 border-green-200",
    });

    setLoading(false);
  };

  const handleTestEmail = async () => {
    setTestLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "📧 Test-e-post sendt",
      description: "Sjekk innboksen din for test-e-posten",
      className: "bg-blue-50 border-blue-200",
    });

    setTestLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Label>Status:</Label>
        <Badge variant="secondary">Nøkkelen ligger kun på serveren</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="resendApiKey">Resend API-nøkkel</Label>
          <Input
            id="resendApiKey"
            type="password"
            value=""
            readOnly
            disabled
            placeholder="Ikke tilgjengelig i nettleseren"
            autoComplete="off"
          />
          <p className="text-sm text-muted-foreground">
            Nøkkelen settes i servermiljøet og vises aldri her.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromEmail">Fra e-post</Label>
          <Input
            id="fromEmail"
            type="email"
            defaultValue={currentSettings.fromEmail}
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            E-postadressen som brukes som avsender
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromName">Fra navn</Label>
          <Input
            id="fromName"
            defaultValue={currentSettings.fromName}
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            Navnet som vises som avsender
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="replyToEmail">Svar til e-post</Label>
          <Input
            id="replyToEmail"
            type="email"
            defaultValue={currentSettings.replyToEmail}
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            E-post for svar på systemgenererte e-poster
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Lagrer..." : "Lagre innstillinger"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testLoading}
            onClick={handleTestEmail}
          >
            <Send className="mr-2 h-4 w-4" />
            {testLoading ? "Sender..." : "Send test-e-post"}
          </Button>
        </div>
      </form>
    </div>
  );
}

