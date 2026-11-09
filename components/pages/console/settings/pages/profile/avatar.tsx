import { Skeleton } from "@/components/ui/skeleton";

// Profile picture upload.
export function ProfileAvatar() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Avatar</h3>
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </section>
  );
}
