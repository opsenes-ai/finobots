import { RecentHistory } from "@/components/pages/console/recents";

export default function RecentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Recents</h1>
      <RecentHistory />
    </div>
  );
}
