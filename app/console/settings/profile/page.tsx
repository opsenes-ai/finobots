import {
  ProfileAvatar,
  ProfileEmail,
  ProfileIds,
  ProfilePersonal,
} from "@/components/pages/console/settings/pages/profile";

// Settings pages render inside the settings dialog, which only mounts in the
// browser, so they can't be checked for instant navigation at build time.
export const instant = false;

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <ProfileAvatar />
      <ProfilePersonal />
      <ProfileEmail />
      <ProfileIds />
    </div>
  );
}
