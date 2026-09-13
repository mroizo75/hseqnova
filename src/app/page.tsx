import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { adminHomePath, isPlatformStaff } from "@/lib/platform-access";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { AskHseqNova } from "@/features/marketing-chat/components/ask-hseq-nova";
import { displayFont, marketingFont } from "@/fonts";
import HomePage, { metadata } from "./(public)/page";

export { metadata };

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className={`${displayFont.variable} ${marketingFont.variable} font-marketing`}>
        <PublicNav />
        <main className="min-h-[calc(100vh-4rem)]">
          <HomePage />
        </main>
        <PublicFooter />
        <AskHseqNova />
      </div>
    );
  }

  if (isPlatformStaff(session.user)) {
    redirect(adminHomePath(session.user));
  }

  if (session.user.role === "ANSATT") {
    redirect("/ansatt");
  }

  redirect("/dashboard");
}
