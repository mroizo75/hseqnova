"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { markHandbookReviewed } from "@/server/actions/hms-handbok.actions";

interface HandbokReviewButtonProps {
  tenantId: string;
}

export function HandbokReviewButton({ tenantId }: HandbokReviewButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleReview() {
    setLoading(true);
    const result = await markHandbookReviewed({ tenantId });
    setLoading(false);
    if (result.success) {
      toast({ title: "Statement signed", description: "Recorded as signed by the most senior person / review date updated." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReview} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Record MD signature
    </Button>
  );
}
