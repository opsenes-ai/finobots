import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    q: "What is Finobots?",
    a: "An open-source AI agent for managing invoices, payments, expenses, and cash flow through chat.",
  },
  {
    q: "How does it work?",
    a: "Connect your accounts, ask a question or request an action, and review the results in interactive tables and charts.",
  },
  {
    q: "Can it take actions for me?",
    a: "Yes. You review and approve actions, such as sending invoices or payment reminders, before they run.",
  },
  {
    q: "Which integrations are supported?",
    a: "PayPal is the first integration, with sandbox support for testing payment workflows.",
  },
  {
    q: "Can I self-host it?",
    a: "Yes. The open-source code can be deployed using your own infrastructure and API credentials.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="mx-auto w-full max-w-5xl px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <Accordion>
          {items.map((item, i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{item.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
