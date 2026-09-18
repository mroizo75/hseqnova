import { IsoCockpitPanel } from "@/features/iso/components/iso-cockpit-panel";
import { HseqCockpitClient } from "./hseq-cockpit-client";

export default async function HseqCockpitPage() {
  return (
    <div className="space-y-6">
      <IsoCockpitPanel />
      <HseqCockpitClient />
    </div>
  );
}
