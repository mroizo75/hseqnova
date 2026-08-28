"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "This Microsoft account is not linked to a company with SSO enabled. Contact your administrator.",
  OAuthAccountNotLinked:
    "An HSEQ Nova user already exists with this email. Sign in with email and password, or contact hello@hseqnova.co.uk.",
  OAuthSignin: "Could not start Microsoft sign-in. Contact hello@hseqnova.co.uk.",
  OAuthCallback:
    "Microsoft declined the sign-in. Ask your IT administrator to approve the HSEQ Nova app.",
  Configuration: "Microsoft sign-in is not configured. Contact hello@hseqnova.co.uk.",
};

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Sjekk for status-meldinger fra URL (verifisering og feil fra NextAuth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isVerified = params.get("verified") === "true";
    const paid = params.get("checkout") === "success";
    const errorCode = params.get("error");

    if (isVerified) {
      setVerified(true);
    }
    if (paid) {
      setCheckoutSuccess(true);
    }

    if (errorCode) {
      setError(
        AUTH_ERROR_MESSAGES[errorCode] ??
          "Sign-in failed. Try again, or contact hello@hseqnova.co.uk."
      );
    }

    if (isVerified || errorCode || paid) {
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        if (!session?.user) {
          setError("Sign-in succeeded but no session was created. Try again.");
          return;
        }
        if (session.user.isSuperAdmin || session.user.isSupport) {
          router.push("/admin");
        } else if (session.user.role === "ANSATT") {
          router.push("/ansatt");
        } else if (session.user.isTavleOnly) {
          router.push("/dashboard/hms-tavle");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          {/* <CardTitle className="text-2xl font-bold">HSEQ Nova log in</CardTitle> */}
          <Image src="/logo-black.png" alt="HSEQ Nova" width={200} height={48} className="mx-auto h-16 w-auto" />
          <CardDescription className="text-center text-xl md:text-lg">
            Sign in with your work email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {verified && (
              <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800">
                Your email is verified. You can sign in now.
              </div>
            )}
            {checkoutSuccess && (
              <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800">
                Payment received. Sign in with the email and password you used to register.
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.login")}
            </Button>

            {/* SSO Options */}
            {process.env.NEXT_PUBLIC_ENABLE_SSO === "true" && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 23 23"
                  >
                    <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  Sign in with Microsoft
                </Button>
              </>
            )}

            <div className="text-center mt-4">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

