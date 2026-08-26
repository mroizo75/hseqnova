"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cookie, Shield, Settings as SettingsIcon, BarChart, X } from "lucide-react";
import Link from "next/link";

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Sjekk om brukeren allerede har gjort et valg
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Vent litt før banner vises for bedre UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Last inn tidligere preferanser
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
        // Aktiver cookies basert på preferanser
        applyCookiePreferences(saved);
      } catch (e) {
        // Ugyldig JSON, vis banner igjen
        setShowBanner(true);
      }
    }
  }, []);

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Aktiver/deaktiver Google Analytics
    if (typeof window !== 'undefined') {
      if (prefs.analytics) {
        // Aktiver GA (hvis du bruker det)
        // @ts-ignore
        window['ga-disable-GA_MEASUREMENT_ID'] = false;
      } else {
        // Deaktiver GA
        // @ts-ignore
        window['ga-disable-GA_MEASUREMENT_ID'] = true;
      }
    }

    // Sett andre cookies basert på preferanser
    if (!prefs.functional) {
      // Fjern funksjonelle cookies
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user-preferences');
        localStorage.removeItem('notification-settings');
      }
    }

    // Marketing cookies (ingen for øyeblikket)
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    applyCookiePreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const rejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyNecessary);
    savePreferences(onlyNecessary);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
        <Card className="max-w-4xl mx-auto shadow-2xl border-2 bg-white dark:bg-gray-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Cookie className="h-6 w-6 text-green-700 dark:text-green-400" aria-hidden="true" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">We use cookies</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  HSEQ Nova uses cookies to keep you signed in and to understand how the site is used.
                  Strictly necessary cookies cannot be turned off.{" "}
                  <Link href="/cookies" className="text-green-700 dark:text-green-400 hover:underline font-bold underline">
                    Learn more
                  </Link>
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={acceptAll} 
                    className="flex-1 sm:flex-initial bg-green-800 hover:bg-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
                  >
                    Accept all
                  </Button>
                  <Button 
                    onClick={rejectAll} 
                    className="flex-1 sm:flex-initial bg-gray-800 hover:bg-gray-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
                  >
                    Necessary only
                  </Button>
                  <Button 
                    onClick={() => setShowSettings(true)} 
                    className="flex-1 sm:flex-initial bg-gray-800 hover:bg-gray-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
                    aria-label="Customise cookie settings"
                  >
                    <SettingsIcon className="h-4 w-4 mr-2 text-white" aria-hidden="true" />
                    Customise
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setShowBanner(false)}
                aria-label="Close cookie banner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Cookie settings
            </DialogTitle>
            <DialogDescription>
              Choose which cookies to allow. Strictly necessary cookies cannot be turned off.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Strengt nødvendige */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Strictly necessary</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Required for the site to work (sign-in, security, UK GDPR consent).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={true} disabled />
                  <Label className="text-xs text-muted-foreground">Always on</Label>
                </div>
              </div>
            </div>

            {/* Funksjonelle */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <SettingsIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Functional cookies</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Remember preferences such as theme and dashboard layout.
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={preferences.functional}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, functional: checked })
                  }
                />
              </div>
            </div>

            {/* Analyse */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <BarChart className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Analytics cookies</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Help us understand how the site is used. Google Analytics runs with IP anonymisation if you allow it.
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, analytics: checked })
                  }
                />
              </div>
            </div>

            {/* Markedsføring */}
            <div className="border rounded-lg p-4 opacity-60">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <Cookie className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Marketing cookies</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Used for advertising. <strong>We do not use these at present.</strong>
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={preferences.marketing}
                  disabled
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, marketing: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button 
              onClick={saveCustomPreferences} 
              className="flex-1 bg-green-800 hover:bg-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
            >
              Save settings
            </Button>
            <Button 
              onClick={acceptAll} 
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
            >
              Accept all
            </Button>
            <Button 
              onClick={rejectAll} 
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
            >
              Necessary only
            </Button>
          </div>

          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-4">
            Read our{" "}
            <Link href="/cookies" className="text-green-700 dark:text-green-400 hover:underline font-medium">
              cookie policy
            </Link>
            {" "}and{" "}
            <Link href="/personvern" className="text-green-700 dark:text-green-400 hover:underline font-medium">
              privacy notice
            </Link>
            {" "}for more information.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

