import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AssuranceBadge({ band }: { band: string | null }) {
  if (!band) return <Badge variant="secondary">No snapshot</Badge>;
  return (
    <Badge
      className={cn(
        band === "GREEN" && "bg-emerald-100 text-emerald-800",
        band === "AMBER" && "bg-amber-100 text-amber-900",
        band === "RED" && "bg-red-100 text-red-800",
      )}
    >
      {band === "GREEN" ? "Good standing" : band === "AMBER" ? "Attention" : "Critical"}
    </Badge>
  );
}
