"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

// Requests made with your keys over the last 7 days.
export function ApiUsage() {
  const [requests, setRequests] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data } = await createClient().from("api_key_usage").select("requests").gte("day", since);
      const rows = (data as { requests: number }[] | null) ?? [];
      setRequests(rows.reduce((sum, row) => sum + row.requests, 0));
    }
    void load();
  }, []);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Usage</h3>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-muted-foreground text-sm">Requests, last 7 days</span>
        <span className="text-lg font-semibold tabular-nums">
          {requests === null ? "–" : requests.toLocaleString()}
        </span>
      </div>
    </section>
  );
}
