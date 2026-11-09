import { SettingsDialog } from "@/components/pages/console/settings";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsDialog>{children}</SettingsDialog>;
}
