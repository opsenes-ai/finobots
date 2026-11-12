import {
  PersonalisationInstructions,
  PersonalisationMemory,
  PersonalisationModels,
  PersonalisationResponses,
} from "@/components/pages/console/settings/pages/personalisation";

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
