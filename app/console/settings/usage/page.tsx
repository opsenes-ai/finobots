import {
  UsageBreakdown,
  UsageHistory,
  UsageLimits,
  UsageSummary,
} from "@/components/pages/console/settings/pages/usage";

// Settings pages render inside the settings dialog, which only mounts in the
// browser, so they can't be checked for instant navigation at build time.
export const instant = false;

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
