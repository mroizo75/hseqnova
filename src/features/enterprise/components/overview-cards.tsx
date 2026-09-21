import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverviewCards(props: {
  companies: number;
  goodStanding: number;
  attentionRequired: number;
  criticalAttention: number;
  openAlerts: number;
  portfolioCount: number;
}) {
  const cards = [
    { label: "Companies", value: props.companies },
    { label: "Good standing", value: props.goodStanding },
    { label: "Attention required", value: props.attentionRequired },
    { label: "Critical attention", value: props.criticalAttention },
    { label: "Open alerts", value: props.openAlerts },
    { label: "Portfolios", value: props.portfolioCount },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
