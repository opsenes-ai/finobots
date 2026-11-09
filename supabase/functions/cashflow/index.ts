// Calculate cashflow projections and summaries.
//
// POST { action, organization_id, ... }
//   summary   from?, to?, account_ids?        Inflow, outflow, and net by
//             currency, category, and month. Defaults to the last 30 days.
//   forecast  currency, lookback_days?, horizon_days?
//             Projects the balance forward using the average daily net.
//
// Any member. Reads run as the user, so row level security applies.
// Only completed transactions count. Currencies are never added together.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";
import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { errorResponse, HttpError, json } from "../_shared/response.ts";
import {
  optionalDate,
  readJson,
  requireArray,
  requireCurrency,
  requireInteger,
  requireOneOf,
  requireUuid,
} from "../_shared/validation.ts";

const ACTIONS = ["summary", "forecast"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;
const MAX_ROWS = 50_000;

// Money is summed in whole units of 1/10,000 to match numeric(19,4) and
// avoid floating point drift.
const SCALE = 10_000;
const toUnits = (amount: number | string) => Math.round(Number(amount) * SCALE);
const fromUnits = (units: number) => Number((units / SCALE).toFixed(4));

type Row = { amount: number | string; currency: string; category: string | null; occurred_at: string };
type Totals = { inflow: number; outflow: number };

async function fetchTransactions(
  client: SupabaseClient,
  filter: {
    organizationId: string;
    from: Date;
    to: Date;
    accountIds?: string[];
    currency?: string;
  },
): Promise<Row[]> {
  const rows: Row[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = client
      .from("transactions")
      .select("amount, currency, category, occurred_at")
      .eq("organization_id", filter.organizationId)
      .eq("status", "completed")
      .gte("occurred_at", filter.from.toISOString())
      .lt("occurred_at", filter.to.toISOString())
      .order("occurred_at")
      .range(offset, offset + PAGE_SIZE - 1);
    if (filter.accountIds) query = query.in("account_id", filter.accountIds);
    if (filter.currency) query = query.eq("currency", filter.currency);

    const { data, error } = await query.returns<Row[]>();
    if (error) throw error;
    rows.push(...(data ?? []));

    if (rows.length > MAX_ROWS) {
      throw new HttpError(400, "Too many transactions in this range. Choose a shorter one.", "range_too_large");
    }
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }

  return rows;
}

function add(totals: Totals, units: number) {
  if (units >= 0) totals.inflow += units;
  else totals.outflow += -units;
}

function format(totals: Totals) {
  return {
    inflow: fromUnits(totals.inflow),
    outflow: fromUnits(totals.outflow),
    net: fromUnits(totals.inflow - totals.outflow),
  };
}

function summarise(rows: Row[]) {
  const byCurrency = new Map<
    string,
    { totals: Totals; categories: Map<string, Totals>; months: Map<string, Totals> }
  >();

  for (const row of rows) {
    const units = toUnits(row.amount);
    let entry = byCurrency.get(row.currency);
    if (!entry) {
      entry = { totals: { inflow: 0, outflow: 0 }, categories: new Map(), months: new Map() };
      byCurrency.set(row.currency, entry);
    }

    add(entry.totals, units);

    const category = row.category ?? "Uncategorised";
    if (!entry.categories.has(category)) entry.categories.set(category, { inflow: 0, outflow: 0 });
    add(entry.categories.get(category)!, units);

    const month = row.occurred_at.slice(0, 7); // YYYY-MM
    if (!entry.months.has(month)) entry.months.set(month, { inflow: 0, outflow: 0 });
    add(entry.months.get(month)!, units);
  }

  return [...byCurrency.entries()].map(([currency, entry]) => ({
    currency,
    ...format(entry.totals),
    categories: [...entry.categories.entries()].map(([category, totals]) => ({
      category,
      ...format(totals),
    })),
    months: [...entry.months.entries()].map(([month, totals]) => ({ month, ...format(totals) })),
  }));
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.", "method_not_allowed");

    const body = await readJson(req);
    const action = requireOneOf(body.action, "action", ACTIONS);
    const organizationId = requireUuid(body.organization_id, "organization_id");

    const auth = await requireUser(req);
    await requireOrgMember(auth, organizationId);

    switch (action) {
      case "summary": {
        const to = optionalDate(body.to, "to") ?? new Date();
        const from = optionalDate(body.from, "from") ?? new Date(to.getTime() - 30 * DAY_MS);
        if (from >= to) throw new HttpError(400, "from must be before to.", "invalid_input");
        if (to.getTime() - from.getTime() > 366 * DAY_MS) {
          throw new HttpError(400, "Choose a range of at most one year.", "invalid_input");
        }

        const accountIds =
          body.account_ids === undefined
            ? undefined
            : requireArray(body.account_ids, "account_ids", { max: 100 }).map((id, i) =>
                requireUuid(id, `account_ids[${i}]`)
              );

        const rows = await fetchTransactions(auth.client, { organizationId, from, to, accountIds });
        return json(req, {
          from: from.toISOString(),
          to: to.toISOString(),
          currencies: summarise(rows),
        });
      }

      case "forecast": {
        const currency = requireCurrency(body.currency, "currency");
        const lookbackDays =
          body.lookback_days === undefined
            ? 90
            : requireInteger(body.lookback_days, "lookback_days", { min: 7, max: 365 });
        const horizonDays =
          body.horizon_days === undefined
            ? 30
            : requireInteger(body.horizon_days, "horizon_days", { min: 7, max: 365 });

        const { data: accounts, error } = await auth.client
          .from("accounts")
          .select("balance")
          .eq("organization_id", organizationId)
          .eq("currency", currency)
          .eq("is_active", true)
          .returns<{ balance: number | string }[]>();
        if (error) throw error;
        const balanceUnits = (accounts ?? []).reduce((sum, a) => sum + toUnits(a.balance), 0);

        const now = new Date();
        const rows = await fetchTransactions(auth.client, {
          organizationId,
          from: new Date(now.getTime() - lookbackDays * DAY_MS),
          to: now,
          currency,
        });
        const netUnits = rows.reduce((sum, row) => sum + toUnits(row.amount), 0);
        const dailyNetUnits = netUnits / lookbackDays;

        // One point a week, plus the final day.
        const days = new Set<number>([horizonDays]);
        for (let day = 7; day < horizonDays; day += 7) days.add(day);
        const points = [...days]
          .sort((a, b) => a - b)
          .map((day) => ({
            date: new Date(now.getTime() + day * DAY_MS).toISOString().slice(0, 10),
            balance: fromUnits(Math.round(balanceUnits + dailyNetUnits * day)),
          }));

        return json(req, {
          currency,
          method: "average_daily_net",
          lookback_days: lookbackDays,
          horizon_days: horizonDays,
          current_balance: fromUnits(balanceUnits),
          average_daily_net: fromUnits(Math.round(dailyNetUnits)),
          points,
        });
      }
    }
  } catch (error) {
    return errorResponse(req, error);
  }
});
