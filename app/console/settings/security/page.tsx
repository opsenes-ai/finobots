import {
  SecurityAuthentication,
  SecurityPassword,
  SecurityProviders,
  SecuritySessions,
} from "@/components/pages/console/settings/pages/security";

// Settings pages render inside the settings dialog, which only mounts in the
// browser, so they can't be checked for instant navigation at build time.
export const instant = false;

export default function SecuritySettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Security</h1>
      <SecurityPassword />
      <SecurityAuthentication />
      <SecurityProviders />
      <SecuritySessions />
    </div>
  );
}
