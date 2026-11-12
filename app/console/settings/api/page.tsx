import {
  ApiKeys,
  ApiScopes,
  ApiUsage,
} from "@/components/pages/console/settings/pages/api";

// Settings pages render inside the settings dialog, which only mounts in the
// browser, so they can't be checked for instant navigation at build time.
export const instant = false;

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
