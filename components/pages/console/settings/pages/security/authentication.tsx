"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";

type Enrolment = { factorId: string; qr: string; secret: string };

// Two-factor authentication with an authenticator app (TOTP).
export function SecurityAuthentication() {
  const [factorId, setFactorId] = useState<string | null | undefined>(undefined);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await createClient().auth.mfa.listFactors();
    setFactorId(data?.totp[0]?.id ?? null);
  }, []);

  useEffect(() => {
    // Loads once on mount; state is set after the request finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function start() {
    setBusy(true);
    const supabase = createClient();

    // Clear any half-finished set-up from an earlier attempt.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const factor of existing?.all ?? []) {
      if (factor.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Couldn't start set-up. Try again.");
      return;
    }
    setEnrolment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setCode("");
  }

  async function cancel() {
    if (enrolment) await createClient().auth.mfa.unenroll({ factorId: enrolment.factorId });
    setEnrolment(null);
  }

  async function verify() {
    if (!enrolment) return;
    setBusy(true);
    const { error } = await createClient().auth.mfa.challengeAndVerify({
      factorId: enrolment.factorId,
      code: code.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error("That code didn't work. Check your app and try again.");
      return;
    }
    setEnrolment(null);
    toast.success("Two-factor authentication is on.");
    await load();
  }

  async function turnOff() {
    if (!factorId) return;
    setBusy(true);
    const { error } = await createClient().auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Two-factor authentication is off.");
    await load();
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Authentication</h3>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Authenticator app</p>
          <p className="text-muted-foreground text-xs">
            {factorId === undefined ? "Checking…" : factorId ? "On" : "Off"}
          </p>
        </div>
        {factorId ? (
          <Button variant="outline" size="sm" disabled={busy} onClick={turnOff}>
            Turn off
          </Button>
        ) : factorId === null && !enrolment ? (
          <Button variant="outline" size="sm" disabled={busy} onClick={start}>
            Set up
          </Button>
        ) : null}
      </div>

      {enrolment ? (
        <form
          className="space-y-4 rounded-lg border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void verify();
          }}
        >
          <p className="text-sm">
            Scan this QR code with your authenticator app, then enter the 6-digit code.
          </p>
          {/* A data URI from Supabase, so next/image has nothing to optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolment.qr} alt="QR code for your authenticator app" className="size-40" />
          <p className="text-muted-foreground text-xs">
            Can&apos;t scan it? Enter this key instead:{" "}
            <span className="font-mono select-all">{enrolment.secret}</span>
          </p>
          <div className="flex items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="totp-code">Code</Label>
              <Input
                id="totp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="w-32 font-mono"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button type="submit" size="sm" disabled={busy || code.length !== 6}>
              {busy ? "Checking…" : "Turn on"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
