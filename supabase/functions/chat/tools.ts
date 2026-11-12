// Read-only tools the assistant can call to look up the workspace's data.
//
// Every query runs as the signed-in user, so row level security limits it to
// their workspace. Arguments come from the model, so each one is checked and
// clamped before it's used. Results are kept small: lists are capped, and
// totals are added up per currency (currencies are never mixed).

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUSES = ["pending", "completed", "failed", "refunded", "cancelled"] as const;
const ACTION_STATUSES = ["proposed", "approved", "rejected", "executed", "failed"] as const;

export const READ_TOOL_NAMES = new Set([
  "get_accounts",
  "search_transactions",
  "get_cashflow",
  "get_connections",
  "get_approvals",
]);

export const READ_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_accounts",
      description:
        "List the workspace's accounts with their current balance, currency, type and source (a PayPal connection or manual).",
      parameters: {
        type: "object",
        properties: {
          include_archived: { type: "boolean", description: "Include archived accounts. Defaults to false." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_transactions",
      description:
        "Find transactions and total them by currency. Use it for questions about payments, sales, expenses, fees, refunds, customers or categories.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer", description: "How many days back to search, 1 to 365. Defaults to 30." },
          status: { type: "string", enum: [...STATUSES] },
          direction: { type: "string", enum: ["in", "out"], description: "Money in (positive) or out (negative)." },
          category: {
            type: "string",
            description: 'A category such as "Sales", "Fees" or "Software". Use "uncategorised" for transactions without one.',
          },
          account_name: { type: "string", description: "Part of an account name, for example \"PayPal USD\"." },
          text: { type: "string", description: "Words to find in the description or counterparty." },
          min_amount: { type: "number", description: "Smallest absolute amount." },
          max_amount: { type: "number", description: "Largest absolute amount." },
          limit: { type: "integer", description: "How many transactions to list, 1 to 50. Defaults to 20." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cashflow",
      description:
        "Money in, money out and net per currency for completed transactions, with a monthly breakdown and the top categories.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer", description: "How many days back, 7 to 365. Defaults to 90." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_connections",
      description: "List connected payment providers with their status and when they last synced.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_approvals",
      description: "List actions the assistant has proposed (send invoice, send reminder) and their approval status.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: [...ACTION_STATUSES] },
          limit: { type: "integer", description: "1 to 20. Defaults to 10." },
        },
      },
    },
  },
];

// --- Argument checks ----------------------------------------------------------

function int(value: unknown, fallback: number, min: number, max: number): number {
  const number = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, number));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

// Free text goes into a PostgREST filter, so keep only safe characters.
function searchText(value: unknown, max = 60): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[^\p{L}\p{N} .'&-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, max);
  return cleaned || undefined;
}

function amount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

// Money is added up in cents to avoid floating point drift.
const cents = (value: number | string) => Math.round(Number(value) * 100);
const fromCents = (value: number) => value / 100;

type Totals = { inflow: number; outflow: number };

function addTo(map: Map<string, Totals>, key: string, value: number) {
  const totals = map.get(key) ?? { inflow: 0, outflow: 0 };
  if (value >= 0) totals.inflow += value;
  else totals.outflow -= value;
  map.set(key, totals);
}

function formatTotals(totals: Totals) {
  return {
    inflow: fromCents(totals.inflow),
    outflow: fromCents(totals.outflow),
    net: fromCents(totals.inflow - totals.outflow),
  };
}

// --- Tools ----------------------------------------------------------------------

async function getAccounts(client: SupabaseClient, organizationId: string, args: Record<string, unknown>) {
  let query = client
    .from("accounts")
    .select("id, name, type, currency, balance, balance_updated_at, is_active, connection:connections(name)")
    .eq("organization_id", organizationId)
    .order("name")
    .limit(100);
  if (args.include_archived !== true) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;

  const totals = new Map<string, number>();
  const accounts = (data ?? []).map((row) => {
    const account = row as unknown as {
      id: string;
      name: string;
      type: string;
      currency: string;
      balance: number | string;
      balance_updated_at: string | null;
      is_active: boolean;
      connection: { name: string } | null;
    };
    if (account.is_active) totals.set(account.currency, (totals.get(account.currency) ?? 0) + cents(account.balance));
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: Number(account.balance),
      balance_as_of: account.balance_updated_at,
      source: account.connection?.name ?? "Manual",
      archived: !account.is_active,
    };
  });

  return {
    accounts,
    total_balance_by_currency: [...totals.entries()].map(([currency, value]) => ({ currency, total: fromCents(value) })),
  };
}

async function searchTransactions(client: SupabaseClient, organizationId: string, args: Record<string, unknown>) {
  const days = int(args.days, 30, 1, 365);
  const limit = int(args.limit, 20, 1, 50);
  const status = oneOf(args.status, STATUSES);
  const direction = oneOf(args.direction, ["in", "out"] as const);
  const category = searchText(args.category);
  const text = searchText(args.text);
  const accountName = searchText(args.account_name);
  const minAmount = amount(args.min_amount);
  const maxAmount = amount(args.max_amount);

  let query = client
    .from("transactions")
    .select("id, occurred_at, description, counterparty, category, status, amount, currency, account:accounts(name)")
    .eq("organization_id", organizationId)
    .gte("occurred_at", new Date(Date.now() - days * DAY_MS).toISOString())
    .order("occurred_at", { ascending: false })
    .limit(2000);

  if (status) query = query.eq("status", status);
  if (direction === "in") query = query.gt("amount", 0);
  if (direction === "out") query = query.lt("amount", 0);
  if (category) {
    query = /^uncategori[sz]ed$/i.test(category) ? query.is("category", null) : query.ilike("category", category);
  }
  if (text) query = query.or(`description.ilike.%${text}%,counterparty.ilike.%${text}%`);

  if (accountName) {
    const { data: accounts, error } = await client
      .from("accounts")
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("name", `%${accountName}%`);
    if (error) throw error;
    const ids = (accounts ?? []).map((row) => row.id as string);
    if (ids.length === 0) return { days, count: 0, note: `No account matches "${accountName}".`, transactions: [] };
    query = query.in("account_id", ids);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? [])
    .map((row) => row as unknown as {
      id: string;
      occurred_at: string;
      description: string | null;
      counterparty: string | null;
      category: string | null;
      status: string;
      amount: number | string;
      currency: string;
      account: { name: string } | null;
    })
    .filter((row) => {
      const size = Math.abs(Number(row.amount));
      return (minAmount === undefined || size >= minAmount) && (maxAmount === undefined || size <= maxAmount);
    });

  // Pending, failed and cancelled transactions haven't moved money, so only
  // completed and refunded ones count towards the totals.
  const totals = new Map<string, Totals>();
  for (const row of rows) {
    if (row.status === "completed" || row.status === "refunded") addTo(totals, row.currency, cents(row.amount));
  }

  return {
    days,
    count: rows.length,
    totals_note: "Totals include completed and refunded transactions only; the list shows every status.",
    totals_by_currency: [...totals.entries()].map(([currency, value]) => ({ currency, ...formatTotals(value) })),
    showing: Math.min(limit, rows.length),
    transactions: rows.slice(0, limit).map((row) => ({
      id: row.id,
      date: row.occurred_at.slice(0, 10),
      description: row.description,
      counterparty: row.counterparty,
      category: row.category,
      status: row.status,
      amount: Number(row.amount),
      currency: row.currency,
      account: row.account?.name ?? null,
    })),
  };
}

async function getCashflow(client: SupabaseClient, organizationId: string, args: Record<string, unknown>) {
  const days = int(args.days, 90, 7, 365);
  const { data, error } = await client
    .from("transactions")
    .select("amount, currency, category, occurred_at")
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .gte("occurred_at", new Date(Date.now() - days * DAY_MS).toISOString())
    .limit(5000);
  if (error) throw error;

  const byCurrency = new Map<string, { totals: Totals; months: Map<string, Totals>; categories: Map<string, Totals> }>();
  for (const row of data ?? []) {
    const currency = row.currency as string;
    const value = cents(row.amount as number);
    const entry = byCurrency.get(currency) ?? { totals: { inflow: 0, outflow: 0 }, months: new Map(), categories: new Map() };
    if (value >= 0) entry.totals.inflow += value;
    else entry.totals.outflow -= value;
    addTo(entry.months, (row.occurred_at as string).slice(0, 7), value);
    addTo(entry.categories, (row.category as string | null) ?? "Uncategorised", value);
    byCurrency.set(currency, entry);
  }

  return {
    days,
    note: "Completed transactions only. Transfers between your own accounts count as both in and out.",
    currencies: [...byCurrency.entries()].map(([currency, entry]) => {
      const categories = [...entry.categories.entries()].map(([category, value]) => ({ category, ...formatTotals(value) }));
      return {
        currency,
        ...formatTotals(entry.totals),
        months: [...entry.months.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, value]) => ({ month, ...formatTotals(value) })),
        top_income: categories.filter((c) => c.inflow > 0).sort((a, b) => b.inflow - a.inflow).slice(0, 5)
          .map((c) => ({ category: c.category, amount: c.inflow })),
        top_spending: categories.filter((c) => c.outflow > 0).sort((a, b) => b.outflow - a.outflow).slice(0, 5)
          .map((c) => ({ category: c.category, amount: c.outflow })),
      };
    }),
  };
}

async function getConnections(client: SupabaseClient, organizationId: string) {
  const { data, error } = await client
    .from("connections")
    .select("name, provider, status, last_synced_at, metadata")
    .eq("organization_id", organizationId)
    .neq("status", "disconnected");
  if (error) throw error;
  return {
    connections: (data ?? []).map((row) => ({
      name: row.name,
      provider: row.provider,
      status: row.status,
      environment: (row.metadata as { environment?: string } | null)?.environment ?? null,
      last_synced: row.last_synced_at,
    })),
  };
}

async function getApprovals(client: SupabaseClient, organizationId: string, args: Record<string, unknown>) {
  const status = oneOf(args.status, ACTION_STATUSES);
  let query = client
    .from("agent_actions")
    .select("type, payload, summary, status, created_at, decided_at, executed_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(int(args.limit, 10, 1, 20));
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return {
    actions: (data ?? []).map((row) => ({
      type: row.type,
      invoice_id: (row.payload as { invoice_id?: string } | null)?.invoice_id ?? null,
      summary: row.summary,
      status: row.status,
      proposed: row.created_at,
      decided: row.decided_at,
      executed: row.executed_at,
    })),
  };
}

/** Runs one read tool. Errors come back as a short message for the model. */
export async function runReadTool(
  client: SupabaseClient,
  organizationId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  try {
    switch (name) {
      case "get_accounts":
        return await getAccounts(client, organizationId, args);
      case "search_transactions":
        return await searchTransactions(client, organizationId, args);
      case "get_cashflow":
        return await getCashflow(client, organizationId, args);
      case "get_connections":
        return await getConnections(client, organizationId);
      case "get_approvals":
        return await getApprovals(client, organizationId, args);
      default:
        return { error: `Unknown tool ${name}.` };
    }
  } catch (error) {
    console.error("Tool failed", name, error);
    return { error: "That lookup failed. Try again or ask a narrower question." };
  }
}
