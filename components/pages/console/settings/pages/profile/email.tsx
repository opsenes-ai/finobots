"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { CopyField } from "./personal";

// Email address, shown for reference with a copy button. Not editable.
export function ProfileEmail() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await createClient().auth.getUser();
      setEmail(data.user?.email ?? null);
    }
    void load();
  }, []);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Email</h3>
      <CopyField id="email" label="Email" value={email} />
    </section>
  );
}
