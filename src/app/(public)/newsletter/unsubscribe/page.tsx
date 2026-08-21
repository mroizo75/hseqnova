"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, Mail, AlertCircle } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) {
      setStatus("error");
      setMessage("Ugyldig avmeldingslenke. Kontakt oss hvis du fortsatt ønsker å melde deg av.");
      return;
    }

    handleUnsubscribe();
  }, [id]);

  const handleUnsubscribe = async () => {
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Kunne ikke melde av nyhetsbrev");
      }

      setStatus("success");
      setMessage("Du er nå meldt av nyhetsbrevet fra HMS Nova.");
    } catch (error) {
      console.error("Unsubscribe error:", error);
      setStatus("error");
      setMessage("Noe gikk galt. Kontakt oss på post@hmsnova.no hvis du fortsatt ønsker å melde deg av.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
                <CardTitle>Melder av...</CardTitle>
                <CardDescription>
                  Vennligst vent mens vi behandler din forespørsel
                </CardDescription>
              </>
            )}
            {status === "success" && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle>Du er nå avmeldt!</CardTitle>
                <CardDescription>
                  {message}
                </CardDescription>
              </>
            )}
            {status === "error" && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <CardTitle>Noe gikk galt</CardTitle>
                <CardDescription>
                  {message}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === "success" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Du vil ikke lenger motta nyhetsbrev fra oss. Vi håper å se deg igjen!
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Besøk bloggen vår
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button className="w-full">
                      Tilbake til forsiden
                    </Button>
                  </Link>
                </div>
              </>
            )}
            {status === "error" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Kontakt oss på{" "}
                  <a href="mailto:post@hmsnova.no" className="underline">
                    post@hmsnova.no
                  </a>{" "}
                  så hjelper vi deg.
                </p>
                <Link href="/">
                  <Button className="w-full">
                    Tilbake til forsiden
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}

