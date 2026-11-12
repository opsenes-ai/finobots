import {
  DataExports,
  DataImports,
  DataJobs,
  DataRetention,
} from "@/components/pages/console/settings/pages/data";

// Settings pages render inside the settings dialog, which only mounts in the
// browser, so they can't be checked for instant navigation at build time.
export const instant = false;

export default function DataSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Data</h1>
      <DataImports />
      <DataExports />
      <DataJobs />
      <DataRetention />
    </div>
  );
}
