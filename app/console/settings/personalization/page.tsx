import {
  PersonalisationInstructions,
  PersonalisationMemory,
  PersonalisationModels,
  PersonalisationResponses,
} from "@/components/pages/console/settings/pages/personalisation";

// Settings pages render inside the settings dialog, which only mounts in the
// browser, so they can't be checked for instant navigation at build time.
export const instant = false;

export default function PersonalizationSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Personalization</h1>
      <PersonalisationModels />
      <PersonalisationResponses />
      <PersonalisationInstructions />
      <PersonalisationMemory />
    </div>
  );
}
