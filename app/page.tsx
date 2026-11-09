import { AppLayout } from "@/components/app";
import {
  Hero,
  Features,
  Workflow,
  Integrations,
  FAQ,
  CTA,
} from "@/components/pages/app/home";

export default function Home() {
  return (
    <AppLayout>
      <Hero />
      <Features />
      <Workflow />
      <Integrations />
      <FAQ />
      <CTA />
    </AppLayout>
  );
}
