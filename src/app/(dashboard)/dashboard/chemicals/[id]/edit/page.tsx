import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChemicalForm } from "@/features/chemicals/components/chemical-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { loadChemicalById } from "@/server/queries/chemicals.queries";

export default async function EditChemicalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const chemical = await loadChemicalById(id, session.user.tenantId);

  if (!chemical) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/chemicals/${chemical.id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to chemical
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit chemical</h1>
        <p className="text-muted-foreground">{chemical.productName}</p>
      </div>

      <ChemicalForm chemical={chemical} mode="edit" />
    </div>
  );
}
