import {
  CashflowBreakdown,
  CashflowCanvas,
  CashflowControls,
  CashflowForecast,
  CashflowOverview,
  CashflowStreams,
  CashflowTrends,
} from "@/components/pages/console/cashflow";

export default function CashflowPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Cashflow</h1>
        <CashflowControls />
      </div>
      <CashflowOverview />
      {/* Bento grid: every row is filled at each breakpoint.
          1 col: stacked. 2 cols: canvas, then streams + forecast, then
          trends and breakdown full width. 3 cols: canvas 2x2 beside
          streams and forecast, then trends (2) and breakdown (1). */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CashflowCanvas className="h-full sm:col-span-2 xl:row-span-2" />
        <CashflowStreams className="h-full" />
        <CashflowForecast className="h-full" />
        <CashflowTrends className="h-full sm:col-span-2" />
        <CashflowBreakdown className="h-full sm:col-span-2 xl:col-span-1" />
      </div>
    </div>
  );
}
