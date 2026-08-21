"use client";

import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface HelpContent {
  title: string;
  description: string;
  sections: Array<{
    heading: string;
    emoji?: string;
    content?: string | React.ReactNode;
    items?: Array<{
      title: string;
      description: string;
    }>;
  }>;
  isoStandards?: string[];
  tips?: string[];
}

interface PageHelpDialogProps {
  content: HelpContent;
}

export function PageHelpDialog({ content }: PageHelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          <span className="sr-only">Hjelp</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {content.sections.map((section, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  {section.emoji && <span>{section.emoji}</span>}
                  {section.heading}
                </h3>
                {section.content && (
                  typeof section.content === "string" ? (
                    <p className="text-sm text-muted-foreground">{section.content}</p>
                  ) : (
                    section.content
                  )
                )}
                {section.items && (
                  <div className="space-y-3 text-sm mt-3">
                    {section.items.map((item, itemIdx) => (
                      <div key={itemIdx}>
                        <h4 className="font-medium text-foreground">{item.title}</h4>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {content.isoStandards && content.isoStandards.length > 0 && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-purple-900">
                  📋 Relevante ISO-standarder
                </h3>
                <ul className="text-sm text-purple-800 space-y-1.5">
                  {content.isoStandards.map((standard, idx) => (
                    <li key={idx}>• {standard}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {content.tips && content.tips.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-blue-900">💡 Tips</h3>
                <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                  {content.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
