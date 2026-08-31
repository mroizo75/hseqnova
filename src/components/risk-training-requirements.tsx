"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { removeTrainingRequirement } from "@/server/actions/risk-training.actions";
import { AddTrainingRequirementDialog } from "./add-training-requirement-dialog";

interface RiskTrainingRequirementsProps {
  riskId: string;
  requirements: any[];
  canEdit?: boolean;
}

export function RiskTrainingRequirements({ 
  riskId, 
  requirements, 
  canEdit = true 
}: RiskTrainingRequirementsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleRemove = async (requirementId: string, courseTitle: string) => {
    if (!confirm(`Remove the requirement for “${courseTitle}”?`)) {
      return;
    }

    setLoading(requirementId);
    const result = await removeTrainingRequirement(requirementId);

    if (result.success) {
      toast({
        title: "Training requirement removed",
        description: `“${courseTitle}” is no longer required for this risk`,
        className: "bg-green-50 border-green-200",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not remove",
        description: result.error || "The training requirement could not be removed",
      });
    }

    setLoading(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Training required for this risk</CardTitle>
              <CardDescription>
                Training needed so people can control this risk (MHSWR 1999 reg.13)
              </CardDescription>
            </div>
          </div>
          {canEdit && (
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add course
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {requirements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No training is required for this risk yet</p>
            {canEdit && (
              <p className="text-sm mt-2">
                Add a course if this risk needs specific training
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">
                      {req.course?.title || req.courseKey}
                    </h4>
                    {req.isMandatory && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                  </div>

                  {req.course?.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {req.course.description}
                    </p>
                  )}

                  {req.course?.duration && (
                    <p className="text-sm text-muted-foreground">
                      Duration: {req.course.duration} hours
                    </p>
                  )}

                  {req.reason && (
                    <div className="mt-2 text-sm bg-blue-50 text-blue-800 p-2 rounded">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      <strong>Reason:</strong> {req.reason}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(req.id, req.course?.title || req.courseKey)}
                    disabled={loading === req.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <AddTrainingRequirementDialog
            riskId={riskId}
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
          />
        )}
      </CardContent>
    </Card>
  );
}
