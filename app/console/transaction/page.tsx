import {
  TransactionAllocation,
  TransactionDetails,
  TransactionReceipt,
  TransactionsFilters,
  TransactionsLedger,
  TransactionsOverview,
  TransactionTimeline,
} from "@/components/pages/console/transactions";

export default function TransactionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <TransactionsFilters />
      </div>
      <TransactionsOverview />
      {/* Bento grid: every row is filled at each breakpoint.
          1 col: stacked. 2 cols: ledger full width, then pairs.
          3 cols: ledger 2x2 beside details and receipt, then
          allocation (1) and timeline (2). */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TransactionsLedger className="h-full sm:col-span-2 xl:row-span-2" />
        <TransactionDetails className="h-full" />
        <TransactionReceipt className="h-full" />
        <TransactionAllocation className="h-full" />
        <TransactionTimeline className="h-full xl:col-span-2" />
      </div>
    </div>
  );
}
