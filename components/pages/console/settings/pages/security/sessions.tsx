"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";

// This device, plus a way to sign out everywhere else.
export function SecuritySessions() {
  const [signedInAt, setSignedInAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await createClient().auth.getUser();
      setSignedInAt(data.user?.last_sign_in_at ?? null);
    }
    void load();
  }, []);

  async function signOutOthers() {
    setBusy(true);
    const { error } = await createClient().auth.signOut({ scope: "others" });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Signed out of your other devices.");
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Sessions</h3>
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
            <MonitorSmartphone className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">This device</p>
            <p className="text-muted-foreground text-xs">
              {signedInAt
                ? `Signed in ${new Date(signedInAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                : "Current session"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled={busy} onClick={signOutOthers}>
          Sign out other devices
        </Button>
      </div>
    </section>
  );
}
