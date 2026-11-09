import {
  ProfileAvatar,
  ProfileEmail,
  ProfilePersonal,
} from "@/components/pages/console/settings/pages/profile";

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <ProfileAvatar />
      <ProfilePersonal />
      <ProfileEmail />
    </div>
  );
}
