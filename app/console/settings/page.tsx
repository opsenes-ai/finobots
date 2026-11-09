import { redirect } from "next/navigation";

export const instant = false;

export default function SettingsPage() {
  redirect("/console/settings/profile");
}
