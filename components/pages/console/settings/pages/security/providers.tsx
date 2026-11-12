"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { UserIdentity } from "@supabase/supabase-js";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";

const PAYPAL_PROVIDER = "custom:paypal";

function identityEmail(identity?: UserIdentity): string | undefined {
  const email = identity?.identity_data?.email;
  return typeof email === "string" ? email : undefined;
}

// Sign-in providers linked to the account. Email and password isn't listed,
// but it still counts as a sign-in method when deciding whether PayPal can
// be unlinked.
export function SecurityProviders() {
  const [identities, setIdentities] = useState<UserIdentity[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    createClient()
      .auth.getUserIdentities()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error("Couldn't load your sign-in methods.");
        setIdentities(data?.identities ?? []);
      });

    // Set by /auth/callback after PayPal is linked to this account.
    const url = new URL(window.location.href);
    if (url.searchParams.get("notice") === "paypal-linked") {
      toast.success("PayPal is now linked to your account.");
      url.searchParams.delete("notice");
      window.history.replaceState(null, "", url);
    }

    return () => {
      active = false;
    };
  }, []);

  const paypalIdentity = identities?.find((identity) => identity.provider === PAYPAL_PROVIDER);
  // Supabase requires at least one sign-in method to remain.
  const canUnlink = (identities?.length ?? 0) > 1;

  // Redirects to PayPal, then back here through /auth/callback.
  async function linkPayPal() {
    setBusy(true);
    const { error } = await createClient().auth.linkIdentity({
      provider: PAYPAL_PROVIDER,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/console/settings/security`,
      },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  }

  async function unlinkPayPal() {
    if (!paypalIdentity || !canUnlink) return;
    setBusy(true);
    const { error } = await createClient().auth.unlinkIdentity(paypalIdentity);
    if (error) {
      toast.error(error.message);
    } else {
      setIdentities((current) =>
        current?.filter((identity) => identity.identity_id !== paypalIdentity.identity_id) ?? null
      );
      toast.success("PayPal is no longer linked.");
    }
    setBusy(false);
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Providers</h3>
      <div className="divide-y rounded-lg border">
        {identities === null ? (
          <p className="text-muted-foreground p-3 text-sm">Loading…</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Image
                    src="/connections/paypal.png"
                    alt=""
                    width={16}
                    height={16}
                    style={{ width: 16, height: "auto" }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">PayPal</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {paypalIdentity
                      ? identityEmail(paypalIdentity) ?? "Connected"
                      : "Sign in with your PayPal account"}
                  </p>
                </div>
              </div>
              {paypalIdentity ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={unlinkPayPal}
                  disabled={busy || !canUnlink}
                  title={canUnlink ? undefined : "PayPal is your only sign-in method."}
                >
                  Unlink
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={linkPayPal} disabled={busy}>
                  {busy ? "Redirecting…" : "Link"}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
