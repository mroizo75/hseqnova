"use client";

import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CRM_DEAL_STAGES } from "@/features/crm/lib/types";
import { CRM_STAGE_LABELS, formatGbp, isOpenDealStage } from "@/features/crm/lib/labels";
import type { CrmDealListItem } from "@/server/queries/crm.queries";
import { updateCrmDealStage } from "@/server/actions/crm.actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

function DealCard({ deal }: { deal: CrmDealListItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm",
        isDragging && "opacity-70",
      )}
    >
      <button
        type="button"
        className="mb-2 h-1.5 w-full cursor-grab rounded bg-muted"
        aria-label="Move deal"
        {...listeners}
        {...attributes}
      />
      <Link href={`/admin/crm/deals/${deal.id}`} className="block space-y-1">
        <p className="text-sm font-semibold leading-snug">{deal.organisation.name}</p>
        <p className="text-xs text-muted-foreground">{deal.title}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-medium">{formatGbp(deal.valueGbp)}</span>
          {deal.owner?.name && (
            <span className="truncate text-[11px] text-muted-foreground">{deal.owner.name}</span>
          )}
        </div>
        {!deal.ownerId && (
          <Badge variant="secondary" className="text-[10px]">
            Unassigned
          </Badge>
        )}
      </Link>
    </div>
  );
}

function StageColumn({
  stage,
  deals,
}: {
  stage: (typeof CRM_DEAL_STAGES)[number];
  deals: CrmDealListItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const value = deals.reduce((sum, deal) => sum + deal.valueGbp, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[28rem] min-w-[16rem] flex-1 flex-col rounded-xl border bg-muted/40 p-3",
        isOver && "ring-2 ring-primary",
      )}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{CRM_STAGE_LABELS[stage]}</h2>
        <span className="text-xs text-muted-foreground">
          {deals.length} · {formatGbp(value)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

export function CrmPipelineBoard({ deals }: { deals: CrmDealListItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = async (event: DragEndEvent) => {
    const dealId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId || (!isOpenDealStage(overId) && overId !== "WON" && overId !== "LOST")) {
      return;
    }
    const deal = deals.find((item) => item.id === dealId);
    if (!deal || deal.stage === overId) {
      return;
    }
    if (overId === "LOST") {
      const reason = window.prompt("Why was this deal lost?");
      if (!reason?.trim()) {
        return;
      }
      const result = await updateCrmDealStage({ dealId, stage: "LOST", lostReason: reason.trim() });
      if (!result.success) {
        toast({ variant: "destructive", title: "Could not move deal", description: result.error });
        return;
      }
      router.refresh();
      return;
    }
    const result = await updateCrmDealStage({
      dealId,
      stage: overId as (typeof CRM_DEAL_STAGES)[number],
    });
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not move deal", description: result.error });
      return;
    }
    router.refresh();
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {CRM_DEAL_STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            deals={deals.filter((deal) => deal.stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}
