import { Skeleton } from "@/components/ui/skeleton";

// Invite people and pending invitations.
export function MembersInvitations() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Invitations</h3>
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </section>
  );
}
