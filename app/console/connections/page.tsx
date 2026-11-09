import {
  ConnectionActions,
  ConnectionDetails,
  ConnectionSetup,
  ConnectionsCatalogue,
  ConnectionsConnected,
} from "@/components/pages/console/connections";

export default function ConnectionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Connections</h1>
        <ConnectionActions />
      </div>
      {/* Bento grid: every row is filled at each breakpoint.
          1 col: stacked. 2 cols: connected full width, details + setup,
          catalogue full width. 3 cols: connected 2x2 beside details and
          setup, then catalogue across the full width. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ConnectionsConnected className="h-full sm:col-span-2 xl:row-span-2" />
        <ConnectionDetails className="h-full" />
        <ConnectionSetup className="h-full" />
        <ConnectionsCatalogue className="h-full sm:col-span-2 xl:col-span-3" />
      </div>
    </div>
  );
}
