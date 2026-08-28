"use client";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Camera,
  Mic,
  MicOff,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import Image from "next/image";
import { enqueueSafe, formDataToOfflinePayload, isNetworkError, isAvailable } from "@/lib/offline-queue";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface FormData {
  description: string;
  location: string;
  occurredAt: string;
  riskLevel: RiskLevel | null;
  imageFiles: File[];
  imagePreviews: string[];
}

function getCurrentLocalDateTimeValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function QuickNearMissForm({
  tenantId,
  reportedBy,
}: {
  tenantId: string;
  reportedBy: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  // Web Speech API types not in standard TS lib
  const recognitionRef = useRef<any>(null);

  const [formData, setFormData] = useState<FormData>({
    description: "",
    location: "",
    occurredAt: getCurrentLocalDateTimeValue(),
    riskLevel: null,
    imageFiles: [],
    imagePreviews: [],
  });

  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleSpeechRecognition = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setFormData((prev) => ({ ...prev, description: transcript }));
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const requestGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Location unavailable",
        description: "Your device does not support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        }));
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        let message = "Could not retrieve location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enter manually.";
        }
        toast({ title: "GPS error", description: message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [toast]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newFiles = [...formData.imageFiles, ...files].slice(0, 3);
    const previews = newFiles.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      imageFiles: newFiles,
      imagePreviews: previews,
    }));
  }

  function removeImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    const payload = new globalThis.FormData();
    payload.set("type", "NESTEN");
    payload.set("title", formData.description.slice(0, 80) || "Near miss report");
    payload.set("description", formData.description);
    payload.set("location", formData.location);
    payload.set("occurredAt", formData.occurredAt);
    payload.set("tenantId", tenantId);
    payload.set("reportedBy", reportedBy);
    payload.set("date", new Date().toISOString());

    if (formData.riskLevel) {
      const severityMap: Record<RiskLevel, string> = { LOW: "1", MEDIUM: "3", HIGH: "5" };
      payload.set("severity", severityMap[formData.riskLevel]);
    }

    formData.imageFiles.forEach((file) => {
      payload.append("images", file);
    });

    try {
      const response = await fetch("/api/incidents/report", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      const result = await response.json();
      setReferenceNumber(result.avviksnummer ?? result.data?.avviksnummer ?? "NM-" + Date.now().toString(36).toUpperCase());
      setStep(4);
      toast({ title: "Reported", description: "Near miss recorded successfully." });
    } catch (error) {
      if (isNetworkError(error) && isAvailable()) {
        const { payload: offlinePayload, files } = formDataToOfflinePayload(payload);
        const result = await enqueueSafe({
          id: `nearmiss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: "incident",
          createdAt: new Date().toISOString(),
          endpoint: "/api/incidents/report",
          payload: offlinePayload,
          files,
        });
        if (result.stored) {
          setReferenceNumber("OFFLINE-" + Date.now().toString(36).toUpperCase());
          setStep(4);
          toast({
            title: "Saved offline",
            description: "Your report will be submitted automatically when you reconnect.",
            className: "bg-amber-50 border-amber-200",
          });
          return;
        }
      }
      toast({
        title: "Error",
        description: "Could not submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const canAdvanceFromStep1 = formData.description.trim().length >= 5;
  const canAdvanceFromStep2 = formData.location.trim().length > 0 && formData.riskLevel !== null;

  if (step === 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Near miss recorded</h2>
        <p className="text-muted-foreground mb-4">
          Thank you for keeping everyone safe.
        </p>
        {referenceNumber && (
          <p className="text-sm font-mono bg-muted px-4 py-2 rounded-lg mb-6">
            Reference: {referenceNumber}
          </p>
        )}
        <Button
          size="lg"
          className="w-full max-w-xs h-14 text-lg"
          onClick={() => router.push("/ansatt")}
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6 px-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          </div>
        ))}
        <span className="text-sm text-muted-foreground ml-2">
          {step}/3
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold mb-1">What happened?</h2>
              <p className="text-sm text-muted-foreground">
                Describe the near miss briefly. What could have gone wrong?
              </p>
            </div>

            <div className="space-y-2">
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Briefly describe what happened..."
                rows={5}
                className="text-base resize-none min-h-[140px]"
                autoFocus
              />

              {speechSupported && (
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  className="w-full h-12 text-base"
                  onClick={toggleSpeechRecognition}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-5 w-5 mr-2" />
                      Stop recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Speak to describe
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Photo upload */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Photo evidence (optional)</Label>
              <div className="relative">
                <Input
                  id="quick-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleImageChange}
                  disabled={formData.imageFiles.length >= 3}
                  className="sr-only"
                />
                <Label
                  htmlFor="quick-photo"
                  className={`flex items-center justify-center gap-2 h-16 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    formData.imageFiles.length >= 3 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {formData.imageFiles.length >= 3
                      ? "Maximum 3 photos"
                      : "Take or choose a photo"}
                  </span>
                </Label>
              </div>

              {formData.imagePreviews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {formData.imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border"
                    >
                      <Image
                        src={preview}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold mb-1">Where and when?</h2>
              <p className="text-sm text-muted-foreground">
                Help us pinpoint the location and time.
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Location</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="e.g. Workshop floor, Bay 3"
                  className="h-12 text-base flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-12 flex-shrink-0"
                  onClick={requestGpsLocation}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <MapPin className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Date/time */}
            <div className="space-y-2">
              <Label className="text-base font-medium">When did it happen?</Label>
              <Input
                type="datetime-local"
                value={formData.occurredAt}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, occurredAt: e.target.value }))
                }
                max={getCurrentLocalDateTimeValue()}
                className="h-12 text-base"
              />
            </div>

            {/* Risk level */}
            <div className="space-y-3">
              <Label className="text-base font-medium">How serious could it have been?</Label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "LOW" as const, label: "Low", color: "border-green-500 bg-green-50 text-green-700", activeColor: "border-green-500 bg-green-500 text-white" },
                  { value: "MEDIUM" as const, label: "Medium", color: "border-amber-500 bg-amber-50 text-amber-700", activeColor: "border-amber-500 bg-amber-500 text-white" },
                  { value: "HIGH" as const, label: "High", color: "border-red-500 bg-red-50 text-red-700", activeColor: "border-red-500 bg-red-500 text-white" },
                ]).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, riskLevel: option.value }))
                    }
                    className={`flex items-center justify-center h-14 rounded-lg border-2 font-semibold text-base transition-all ${
                      formData.riskLevel === option.value
                        ? option.activeColor
                        : option.color
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold mb-1">Review your report</h2>
              <p className="text-sm text-muted-foreground">
                Check the details before submitting.
              </p>
            </div>

            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Description
                </p>
                <p className="text-sm mt-1">{formData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Location
                  </p>
                  <p className="text-sm mt-1">{formData.location}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Risk level
                  </p>
                  <p className="text-sm mt-1 capitalize">
                    {formData.riskLevel?.toLowerCase() ?? "Not set"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Date &amp; time
                </p>
                <p className="text-sm mt-1">
                  {new Date(formData.occurredAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {formData.imagePreviews.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Photos ({formData.imagePreviews.length})
                  </p>
                  <div className="flex gap-2">
                    {formData.imagePreviews.map((preview, i) => (
                      <div
                        key={i}
                        className="relative h-14 w-14 rounded-lg overflow-hidden border"
                      >
                        <Image src={preview} alt={`Photo ${i + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Near misses are recorded in the accident book per SSCPR 1979. They are not
              RIDDOR-reportable but help prevent future incidents.
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-6 mt-auto">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            className="h-14 flex-1 text-base"
            onClick={() => setStep((s) => s - 1)}
            disabled={isSubmitting}
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
        )}

        {step < 3 && (
          <Button
            type="button"
            className="h-14 flex-1 text-base"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 ? !canAdvanceFromStep1 : !canAdvanceFromStep2}
          >
            Next
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        )}

        {step === 3 && (
          <Button
            type="button"
            className="h-14 flex-1 text-base bg-red-600 hover:bg-red-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit report"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
