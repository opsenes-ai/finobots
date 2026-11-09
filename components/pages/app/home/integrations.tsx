import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const integrations = [
  {
    name: "PayPal",
    icon: "/connections/paypal.png",
    description:
      "A digital payments platform for sending money, accepting payments, and managing transactions online.",
  },
  {
    name: "Venmo",
    icon: "/connections/venmo.png",
    description:
      "A payment app for sending and receiving money, splitting bills, and paying participating businesses.",
  },
];

export function Integrations() {
  return (
    <section id="integrations" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 text-center sm:mb-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Integrations</h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Connect the tools your business already uses.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardContent className="flex items-start gap-4 p-4 sm:p-5">
              <Image
                src={integration.icon}
                alt={integration.name}
                width={40}
                height={40}
                className="shrink-0 rounded-lg"
                style={{ width: 40, height: "auto" }}
              />
              <div className="flex flex-col gap-1">
                <span className="font-medium">{integration.name}</span>
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
