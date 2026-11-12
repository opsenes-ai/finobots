"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { focusSetup, usePayPalConnected } from "./connected";

// Available connectors.
export function ConnectionsCatalogue({ className }: { className?: string }) {
  const connected = usePayPalConnected();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Catalogue</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Image
            src="/connections/paypal.png"
            alt=""
            width={40}
            height={40}
            className="shrink-0 rounded-lg"
            style={{ width: 40, height: "auto" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">PayPal</p>
            <p className="text-muted-foreground truncate text-xs">Balances, transactions and invoices</p>
          </div>
          {connected ? (
            <Badge variant="secondary">Connected</Badge>
          ) : connected === false ? (
            <Button size="sm" variant="outline" onClick={focusSetup}>
              Connect
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
