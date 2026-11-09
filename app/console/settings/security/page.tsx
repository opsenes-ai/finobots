import {
  SecurityAuthentication,
  SecurityPassword,
  SecuritySessions,
} from "@/components/pages/console/settings/pages/security";

export default function SecuritySettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Security</h1>
      <SecurityPassword />
      <SecurityAuthentication />
      <SecuritySessions />
    </div>
  );
}
