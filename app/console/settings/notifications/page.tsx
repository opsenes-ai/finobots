import {
  NotificationsAlerts,
  NotificationsChannels,
  NotificationsDigest,
} from "@/components/pages/console/settings/pages/notifications";

export default function NotificationsSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <NotificationsChannels />
      <NotificationsAlerts />
      <NotificationsDigest />
    </div>
  );
}
