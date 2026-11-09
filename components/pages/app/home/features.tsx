import {
  FileText,
  CreditCard,
  Receipt,
  TrendingUp,
  RefreshCw,
  BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Invoice Management",
    description:
      "Create invoices, track due dates, and follow up on outstanding balances.",
  },
  {
    icon: CreditCard,
    title: "Payment Tracking",
    description:
      "Monitor incoming and outgoing payments with clear status updates.",
  },
  {
    icon: Receipt,
    title: "Expense Management",
    description:
      "Organise expenses, categorise transactions, and review spending.",
  },
  {
    icon: TrendingUp,
    title: "Cashflow Insights",
    description:
      "Understand money coming in, going out, and expected ahead.",
  },
  {
    icon: RefreshCw,
    title: "Account Reconciliation",
    description:
      "Match payments to invoices and identify discrepancies.",
  },
  {
    icon: BarChart2,
    title: "Financial Reporting",
    description:
      "Turn financial records into clear summaries, charts, and answers.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 text-center sm:mb-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Everything you need to run your finances
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          One agent. All the financial operations your business needs.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
