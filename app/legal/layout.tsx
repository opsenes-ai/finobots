import { AppLayout } from "@/components/app";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="prose">{children}</div>
      </div>
    </AppLayout>
  );
}
