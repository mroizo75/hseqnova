"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createAdminUser, updateAdminUser } from "@/server/actions/admin.actions";
import { resolvePlatformRole, type PlatformRole } from "@/lib/platform-access";
import { Role } from "@prisma/client";

const adminUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  platformRole: z.enum(["NONE", "SUPERADMIN", "SUPPORT", "SALES_MANAGER", "SALES"]),
  tenantId: z.string().optional(),
  role: z.enum(["ADMIN", "HMS", "LEDER", "VERNEOMBUD", "ANSATT", "BHT", "REVISOR"]).optional(),
});

type AdminUserFormValues = z.infer<typeof adminUserSchema>;

interface AdminUserFormProps {
  tenants: Array<{ id: string; name: string; status: string }>;
  user?: {
    id: string;
    email: string;
    name: string | null;
    isSuperAdmin: boolean;
    isSupport?: boolean;
    isSales?: boolean;
    isSalesManager?: boolean;
    tenants: Array<{
      tenantId: string;
      role: Role;
    }>;
  };
}

export function AdminUserForm({ tenants, user }: AdminUserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const firstTenantMembership = user?.tenants.at(0);
  const defaultPlatformRole: PlatformRole = user
    ? resolvePlatformRole({
        isSuperAdmin: user.isSuperAdmin,
        isSupport: user.isSupport,
        isSales: user.isSales,
        isSalesManager: user.isSalesManager,
      })
    : "NONE";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      email: user?.email || "",
      name: user?.name || "",
      platformRole: defaultPlatformRole,
      tenantId: firstTenantMembership?.tenantId || undefined,
      role: firstTenantMembership?.role || undefined,
    },
  });

  const platformRole = watch("platformRole");
  const isTenantUser = platformRole === "NONE";

  const onSubmit = async (data: AdminUserFormValues) => {
    setLoading(true);
    try {
      const payload = {
        email: data.email,
        name: data.name,
        password: data.password,
        platformRole: data.platformRole,
        tenantId: data.tenantId,
        role: data.role,
      };
      const result = user
        ? await updateAdminUser(user.id, payload)
        : await createAdminUser(payload as typeof payload & { password: string });

      if (result.success) {
        toast({
          title: user ? "User updated" : "User created",
          description: user
            ? "The user's details have been saved"
            : "The new user has been added",
        });
        router.push("/admin/users");
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Could not save",
          description: result.error || "Could not save the user",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Unexpected error",
        description: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          disabled={loading || !!user}
          placeholder="user@company.co.uk"
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register("name")} disabled={loading} placeholder="Jane Smith" />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {!user && (
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            disabled={loading}
            placeholder="At least 8 characters"
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="platformRole">Platform role</Label>
        <Select
          value={platformRole}
          onValueChange={(value) => setValue("platformRole", value as PlatformRole)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose role…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">Organisation user</SelectItem>
            <SelectItem value="SUPERADMIN">Superadmin (full access)</SelectItem>
            <SelectItem value="SUPPORT">Support</SelectItem>
            <SelectItem value="SALES_MANAGER">Sales manager (all CRM)</SelectItem>
            <SelectItem value="SALES">Salesperson (own deals + support)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isTenantUser && (
        <>
          <div className="space-y-2">
            <Label htmlFor="tenantId">Organisation</Label>
            <Select
              onValueChange={(value) => setValue("tenantId", value)}
              defaultValue={firstTenantMembership?.tenantId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose organisation…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No organisation</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Organisation role</Label>
            <Select
              onValueChange={(value) => setValue("role", value as Role)}
              defaultValue={firstTenantMembership?.role}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose role…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="HMS">HSE manager</SelectItem>
                <SelectItem value="LEDER">Line manager</SelectItem>
                <SelectItem value="VERNEOMBUD">Safety representative</SelectItem>
                <SelectItem value="ANSATT">Employee</SelectItem>
                <SelectItem value="BHT">Occupational health</SelectItem>
                <SelectItem value="REVISOR">Auditor</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : user ? "Update user" : "Create user"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="bg-transparent"
          onClick={() => router.push("/admin/users")}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
