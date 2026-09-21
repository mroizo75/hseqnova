"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PricingTier } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTenant } from "@/server/actions/tenant.actions";
import { useToast } from "@/hooks/use-toast";
import {
  PRICING_PLANS,
  SUPPORTED_INDUSTRIES,
  getPricingPlan,
  ONBOARDING_STEPS,
  COMPETITIVE_ADVANTAGES,
} from "@/lib/pricing";
import {
  Building2,
  Users,
  Euro,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const tenantOnboardingSchema = z.object({
  name: z.string().min(2, "Organisation name must be at least 2 characters"),
  orgNumber: z.string().optional(),
  contactPerson: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Enter a valid email address"),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  employeeCount: z.number().min(1, "Employee count must be at least 1"),
  industry: z.string(),
  notes: z.string().optional(),
});

type TenantOnboardingFormData = z.infer<typeof tenantOnboardingSchema>;

interface TenantOnboardingFormProps {
  salesRep: string;
}

export function TenantOnboardingForm({ salesRep }: TenantOnboardingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("other");
  const [selectedTier, setSelectedTier] = useState<PricingTier>("MICRO");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TenantOnboardingFormData>({
    resolver: zodResolver(tenantOnboardingSchema),
    defaultValues: {
      employeeCount: 5,
      industry: "other",
    },
  });

  const currentTier = selectedTier;
  const currentPlan = getPricingPlan(currentTier);

  const onSubmit = async (data: TenantOnboardingFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createTenant({
        ...data,
        salesRep,
        pricingTier: currentTier,
        createInFiken: false,
      });

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Could not create organisation",
          description: result.error,
        });
      } else {
        toast({
          title: "Organisation created",
          description: `${data.name} is now registered.`,
        });
        router.push("/admin/tenants");
        router.refresh();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Could not create organisation",
        description: "The organisation could not be created.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">
            <Building2 className="mr-2 h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <Euro className="mr-2 h-4 w-4" />
            Price and plan
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="advantage">
            <Sparkles className="mr-2 h-4 w-4" />
            Competitive edge
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company details</CardTitle>
              <CardDescription>Contact and organisation information for this company workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Organisation name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" {...register("name")} placeholder="Acme Ltd" />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgNumber">Company number</Label>
                  <Input id="orgNumber" {...register("orgNumber")} placeholder="12345678" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">
                    Contact name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="contactPerson" {...register("contactPerson")} placeholder="Jane Smith" />
                  {errors.contactPerson && (
                    <p className="text-sm text-red-500">{errors.contactPerson.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactEmail"
                      type="email"
                      {...register("contactEmail")}
                      placeholder="ops@company.co.uk"
                      className="pl-10"
                    />
                  </div>
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500">{errors.contactEmail.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactPhone"
                      {...register("contactPhone")}
                      placeholder="020 7946 0000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeCount">
                    Number of employees <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="employeeCount"
                      type="number"
                      {...register("employeeCount", { valueAsNumber: true })}
                      onChange={(event) => {
                        const value = parseInt(event.target.value, 10) || 1;
                        setValue("employeeCount", value);
                      }}
                      placeholder="5"
                      className="pl-10"
                    />
                  </div>
                  {errors.employeeCount && (
                    <p className="text-sm text-red-500">{errors.employeeCount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="address" {...register("address")} placeholder="1 High Street" className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postcode</Label>
                  <Input id="postalCode" {...register("postalCode")} placeholder="SW1A 1AA" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Town or city</Label>
                  <Input id="city" {...register("city")} placeholder="London" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">
                  Industry <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedIndustry}
                  onValueChange={(value) => {
                    setSelectedIndustry(value);
                    setValue("industry", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        <div className="flex w-full items-center justify-between">
                          <span>{industry.label}</span>
                          <Badge variant="outline" className="ml-2">
                            {industry.templates} templates
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">CRM notes (internal)</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Internal notes about the customer, meetings, agreements…"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Select a plan:</strong> Default is MICRO (NOK 3,300 / year). This is a company subscription, not a group portal.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Subscription plan</CardTitle>
              <CardDescription>Choose the plan for this company workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="pricingTier">
                  Plan <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedTier} onValueChange={(value) => setSelectedTier(value as PricingTier)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MICRO">MICRO — HSEQ Nova Software (NOK 3,300 / year)</SelectItem>
                    <SelectItem value="SMALL">SMALL — HSEQ Nova Software (NOK 3,300 / year)</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM — HSEQ Nova Software (NOK 3,300 / year)</SelectItem>
                    <SelectItem value="LARGE">LARGE — contact for quote</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Standard plans share the same price and features (NOK 3,300 / year with a 12-month contract).
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Selected plan</CardTitle>
                  <Badge className="bg-primary">{currentPlan.name}</Badge>
                </div>
                <CardDescription>{currentPlan.employeeRange}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      NOK {currentPlan.yearlyPrice.toLocaleString("en-GB")}
                    </span>
                    <span className="text-muted-foreground">/ year</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Or NOK {currentPlan.monthlyPrice.toLocaleString("en-GB")} / month
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <h4 className="font-semibold">Included:</h4>
                  <ul className="space-y-1 text-sm">
                    {currentPlan.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {currentPlan.features.length > 5 && (
                      <li className="text-muted-foreground">
                        + {currentPlan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                <div className="pt-4">
                  <h4 className="mb-2 font-semibold">Popular features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentPlan.popularFeatures.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All plans</CardTitle>
                <CardDescription>Same product across company sizes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {PRICING_PLANS.map((plan) => (
                  <div
                    key={plan.tier}
                    className={`rounded-lg border p-4 ${
                      plan.tier === currentTier ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">{plan.employeeRange}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">NOK {plan.yearlyPrice.toLocaleString("en-GB")}</p>
                        <p className="text-xs text-muted-foreground">/ year</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding process</CardTitle>
              <CardDescription>Guidance for getting started with HSEQ Nova.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ONBOARDING_STEPS.map((step, index) => (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary/10 font-bold text-primary">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{step.title}</h4>
                        <Badge variant="outline">{step.estimatedTime}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="mt-6">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Estimated total time:</strong> 5–6 hours across the first week. Take it step by step.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advantage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Why HSEQ Nova outperforms competitors</CardTitle>
              <CardDescription>Comparison with other HSEQ systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {COMPETITIVE_ADVANTAGES.map((advantage) => (
                  <div key={advantage.feature} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="font-semibold">{advantage.feature}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="mb-1 text-muted-foreground">HSEQ Nova:</p>
                        <p className="font-medium">{advantage.hmsNova}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-muted-foreground">Other HSEQ systems:</p>
                        <p>{advantage.gronnJobb}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="mr-1 h-3 w-3" />
                        {advantage.advantage}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="mt-6 border-primary">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Summary:</strong> HSEQ Nova offers capabilities competitors typically lack, with a clearer
                  workspace and a lower price for smaller companies.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between border-t pt-6">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting} className="min-w-32">
          {isSubmitting ? "Creating…" : "Create organisation"}
        </Button>
      </div>
    </form>
  );
}
