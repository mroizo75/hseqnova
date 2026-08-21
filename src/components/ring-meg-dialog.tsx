"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, CheckCircle2 } from "lucide-react";

interface RingMegDialogProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function RingMegDialog({ trigger, children }: RingMegDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ring-meg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Noe gikk galt");
        return;
      }
      setSent(true);
      setName("");
      setPhone("");
      setTimeout(() => setOpen(false), 1500);
    } catch {
      setError("Kunne ikke sende. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSent(false);
      setError(null);
    }
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" variant="outline" className="text-lg px-8">
            <Phone className="mr-2 h-5 w-5" aria-hidden="true" />
            Ring meg
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ring meg</DialogTitle>
          <DialogDescription>
            Fyll inn navn og telefonnummer. Salgsavdelingen vår tar kontakt så snart vi kan.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" aria-hidden="true" />
            <p className="font-medium">Takk for henvendelsen!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vi ringer deg så snart vi kan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ring-meg-name">Navn</Label>
              <Input
                id="ring-meg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ditt navn"
                required
                minLength={2}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ring-meg-phone">Telefonnummer</Label>
              <Input
                id="ring-meg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+47 xxx xx xxx"
                required
                minLength={8}
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Sender...
                </>
              ) : (
                "Send – vi ringer deg"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
