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
      setMessage("Invalid unsubscribe link. Contact us if you still wish to unsubscribe.");
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
        throw new Error("Could not unsubscribe from newsletter");
      }

      setStatus("success");
      setMessage("You have been unsubscribed from the HSEQ Nova newsletter.");
    } catch (error) {
      console.error("Unsubscribe error:", error);
      setStatus("error");
      setMessage("Something went wrong. Contact us at support@hseqnova.co.uk if you still wish to unsubscribe.");
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
                <CardTitle>Unsubscribing...</CardTitle>
                <CardDescription>
                  Please wait while we process your request
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
                <CardTitle>You have been unsubscribed!</CardTitle>
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
                <CardTitle>Something went wrong</CardTitle>
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
                  You will no longer receive newsletters from us. We hope to see you again!
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Visit our blog
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button className="w-full">
                      Back to homepage
                    </Button>
                  </Link>
                </div>
              </>
            )}
            {status === "error" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Contact us at{" "}
                  <a href="mailto:support@hseqnova.co.uk" className="underline">
                    support@hseqnova.co.uk
                  </a>{" "}
                  and we will help you.
                </p>
                <Link href="/">
                  <Button className="w-full">
                    Back to homepage
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

