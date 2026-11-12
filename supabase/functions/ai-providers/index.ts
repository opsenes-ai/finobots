// Connect your own AI provider key for chat.
//
// POST { action, organization_id, ... }
//   connect     provider, api_key, model?   verify, encrypt and save a key
//   use         provider                    chat with this provider
//   use_default (none)                      go back to the platform default
//   remove      provider                    delete the key
//
// Owners and admins only. Keys are tested with the provider, encrypted, and
// stored where only server code can read them. They are never returned.

import { AI_PROVIDERS, MODEL_ID, providerTarget, testTarget } from "../_shared/ai.ts";
import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { createAdminClient, saveAiKey } from "../_shared/database.ts";
import { errorResponse, HttpError, json } from "../_shared/response.ts";
import {
  optionalString,
  readJson,
  requireOneOf,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";

const ACTIONS = ["connect", "use", "use_default", "remove"] as const;
const COLUMNS = "id, provider, model, key_last4, status, is_active, created_at";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.", "method_not_allowed");

    const body = await readJson(req);
    const action = requireOneOf(body.action, "action", ACTIONS);
    const organizationId = requireUuid(body.organization_id, "organization_id");

    const auth = await requireUser(req);
    await requireOrgMember(auth, organizationId, ["owner", "admin"]);

    // Row level security keeps every query inside this workspace.
    const findProvider = async (provider: string) => {
      const { data, error } = await auth.client
        .from("ai_providers")
        .select(COLUMNS)
        .eq("organization_id", organizationId)
        .eq("provider", provider)
        .maybeSingle<{ id: string; is_active: boolean }>();
      if (error) throw error;
      return data;
    };

    switch (action) {
      case "connect": {
        const provider = requireOneOf(body.provider, "provider", AI_PROVIDERS);
        const apiKey = requireString(body.api_key, "api_key", { min: 8, max: 500 });
        const model = optionalString(body.model, "model", { max: 100 });
        if (model !== undefined && !MODEL_ID.test(model)) {
          throw new HttpError(400, "model isn't a valid model id.", "invalid_input");
        }

        // Nothing is saved unless the provider accepts the key and model.
        if (!(await testTarget(providerTarget(provider, apiKey, model ?? null)))) {
          throw new HttpError(
            400,
            "The provider rejected this key or model. Check both and try again.",
            "invalid_key",
          );
        }

        const existing = await findProvider(provider);
        const fields = {
          model: model ?? null,
          key_last4: apiKey.slice(-4),
          status: "active",
        };

        let providerId: string;
        if (existing) {
          const { error } = await auth.client
            .from("ai_providers")
            .update(fields)
            .eq("id", existing.id);
          if (error) throw error;
          providerId = existing.id;
        } else {
          // The first key connected is used straight away.
          const { count, error: countError } = await auth.client
            .from("ai_providers")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("is_active", true);
          if (countError) throw countError;

          const { data, error } = await auth.client
            .from("ai_providers")
            .insert({
              ...fields,
              organization_id: organizationId,
              provider,
              is_active: (count ?? 0) === 0,
              created_by: auth.userId,
            })
            .select("id")
            .single<{ id: string }>();
          if (error) throw error;
          providerId = data.id;
        }

        try {
          await saveAiKey(createAdminClient(), providerId, apiKey);
        } catch (saveError) {
          // Don't leave a new provider behind that has no key.
          if (!existing) await auth.client.from("ai_providers").delete().eq("id", providerId);
          throw saveError;
        }

        const { data: saved, error } = await auth.client
          .from("ai_providers")
          .select(COLUMNS)
          .eq("id", providerId)
          .single();
        if (error) throw error;
        return json(req, { provider: saved }, existing ? 200 : 201);
      }

      case "use": {
        const provider = requireOneOf(body.provider, "provider", AI_PROVIDERS);
        const target = await findProvider(provider);
        if (!target) throw new HttpError(404, "Connect this provider first.", "not_found");

        // Switch the old one off first; only one can be active.
        const { error: offError } = await auth.client
          .from("ai_providers")
          .update({ is_active: false })
          .eq("organization_id", organizationId)
          .eq("is_active", true);
        if (offError) throw offError;

        const { error } = await auth.client
          .from("ai_providers")
          .update({ is_active: true })
          .eq("id", target.id);
        if (error) throw error;
        return json(req, { provider, is_active: true });
      }

      case "use_default": {
        const { error } = await auth.client
          .from("ai_providers")
          .update({ is_active: false })
          .eq("organization_id", organizationId)
          .eq("is_active", true);
        if (error) throw error;
        return json(req, { provider: null });
      }

      case "remove": {
        const provider = requireOneOf(body.provider, "provider", AI_PROVIDERS);
        const target = await findProvider(provider);
        if (!target) throw new HttpError(404, "Provider not found.", "not_found");

        // The key is removed with it (cascade).
        const { error } = await auth.client.from("ai_providers").delete().eq("id", target.id);
        if (error) throw error;
        return json(req, { provider, removed: true });
      }
    }
  } catch (error) {
    return errorResponse(req, error);
  }
});
