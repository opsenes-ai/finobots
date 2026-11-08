import { ConsoleLayout } from "@/components/console";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleLayout>{children}</ConsoleLayout>;
}
