import {
  DataExports,
  DataImports,
  DataJobs,
  DataRetention,
} from "@/components/pages/console/settings/pages/data";

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
