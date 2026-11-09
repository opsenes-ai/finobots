import {
  ApiKeys,
  ApiScopes,
  ApiUsage,
} from "@/components/pages/console/settings/pages/api";

export default function ApiSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">API</h1>
      <ApiKeys />
      <ApiScopes />
      <ApiUsage />
    </div>
  );
}
