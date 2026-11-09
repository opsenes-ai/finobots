import { RecentEntry } from "./entry";

const groups = [
  { label: "Today", count: 2 },
  { label: "Yesterday", count: 3 },
  { label: "Previous 7 days", count: 4 },
];

// Previous chats grouped by date.
export function RecentHistory() {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {group.label}
          </h2>
          <div className="space-y-2">
            {Array.from({ length: group.count }).map((_, i) => (
              <RecentEntry key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
