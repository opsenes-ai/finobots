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
    <section id="workflow" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-10 text-center sm:mb-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How it works
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Get started in three simple steps.
        </p>
      </div>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.title} className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
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
