import {
  AccountCreation,
  AccountDetails,
  AccountEditing,
  AccountsActions,
  AccountsBalances,
  AccountsListing,
  AccountsOverview,
} from "@/components/pages/console/accounts";

export default function AccountsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <AccountsActions />
      </div>
      <AccountsOverview />
      {/* Bento grid: every row is filled at each breakpoint.
          1 col: stacked. 2 cols: listing full width, then pairs.
          3 cols: listing 2x2 beside balances and details, then
          creation (1) and editing (2). */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AccountsListing className="h-full sm:col-span-2 xl:row-span-2" />
        <AccountsBalances className="h-full" />
        <AccountDetails className="h-full" />
        <AccountCreation className="h-full" />
        <AccountEditing className="h-full xl:col-span-2" />
      </div>
    </div>
  );
}
