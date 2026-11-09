const steps = [
  {
    title: "Connect Accounts",
    description:
      "Connect PayPal and bring your financial records into one workspace.",
  },
  {
    title: "Ask Anything",
    description:
      "Manage invoices, explore transactions, and understand cash flow through chat.",
  },
  {
    title: "Approve Actions",
    description:
      "Review proposed changes and approve them before execution.",
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="mx-auto w-full max-w-5xl px-6 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          How it works
        </h2>
        <p className="mt-3 text-muted-foreground">
          Get started in three simple steps.
        </p>
      </div>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.title} className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
              {i + 1}
            </div>
            <h3 className="mb-2 font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
