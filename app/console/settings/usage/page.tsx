import {
  UsageBreakdown,
  UsageHistory,
  UsageLimits,
  UsageSummary,
} from "@/components/pages/console/settings/pages/usage";

export default function UsageSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Usage</h1>
      <UsageSummary />
      <UsageBreakdown />
      <UsageLimits />
      <UsageHistory />
    </div>
  );
}
