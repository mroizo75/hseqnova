"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { refreshSeoDashboard, resubmitSitemap } from "@/server/actions/seo.actions";

export function SeoActionsBar() {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  const onRefresh = () => {
    startRefresh(async () => {
      const result = await refreshSeoDashboard();
      if (!result.success) {
        toast.error("Could not refresh", { description: result.error });
        return;
      }
      router.refresh();
    });
  };

  const onSubmitSitemap = () => {
    startSubmit(async () => {
      const result = await resubmitSitemap();
      if (!result.success) {
        toast.error("Sitemap not submitted", { description: result.error });
        return;
      }
      toast.success("Sitemap submitted to Google");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className="bg-transparent text-foreground"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
        Refresh data
      </Button>
      <Button type="button" onClick={onSubmitSitemap} disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Submit sitemap
      </Button>
    </div>
  );
}
