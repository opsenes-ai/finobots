import { AppLayout } from "@/components/app";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="prose dark:prose-invert">{children}</div>
      </div>
    </AppLayout>
  );
}
