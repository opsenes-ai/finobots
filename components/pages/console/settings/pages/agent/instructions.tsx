import { Skeleton } from "@/components/ui/skeleton";

// Custom instructions for the agent.
export function AgentInstructions() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Instructions</h3>
      <Skeleton className="h-28 w-full" />
    </section>
  );
}
