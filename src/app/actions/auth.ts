"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { adminHomePath, isPlatformStaff } from "@/lib/platform-access";

export async function loginAction(
  _prevState: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error || !authData.user) {
    return { error: "Invalid email or password" };
  }

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from("User")
    .select("isSuperAdmin, isSupport, isSales, isSalesManager")
    .or(`id.eq.${authData.user.id},supabaseUserId.eq.${authData.user.id}`)
    .maybeSingle();

  if (isPlatformStaff(profile ?? {})) {
    redirect(adminHomePath(profile ?? {}));
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
