import { AppLayout } from "@/components/app";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <div className="flex min-h-[calc(100svh-128px)] items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </AppLayout>
  );
}
