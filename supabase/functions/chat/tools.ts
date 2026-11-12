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
  "get_account_details",
  "get_transaction",
  "get_cashflow",
  "get_forecast",
  "get_connections",
  "get_approvals",
]);

const GROUPS = ["month", "week", "category", "counterparty", "account"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      name: "get_account_details",
      description:
        "Everything about one account: balance, source, money in and out over a period, status counts, top categories and counterparties, and its latest transactions. Pass the account's id from get_accounts, or part of its name.",
      parameters: {
        type: "object",
        properties: {
          account: { type: "string", description: "The account id, or part of its name." },
          days: { type: "integer", description: "Period for the totals, 7 to 365. Defaults to 90." },
        },
        required: ["account"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_transaction",
      description:
        "Full details of one transaction: amount, status, account, category, PayPal reference, reconciliation, receipt and dates. Pass its id from search_transactions, or words from its description or counterparty to find it.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The transaction id." },
          text: { type: "string", description: "Words from the description or counterparty, if there's no id." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cashflow",
      description:
        "Money in, money out and net per currency for completed transactions, grouped by month, week, category, counterparty or account, with the top income and spending categories.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer", description: "How many days back, 7 to 365. Defaults to 90." },
          group_by: { type: "string", enum: [...GROUPS], description: "How to break it down. Defaults to month." },
          account_name: { type: "string", description: "Only this account (part of its name)." },
          exclude_transfers: {
            type: "boolean",
            description: "Leave out transfers between your own accounts. Defaults to false.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_forecast",
      description:
        "Project the balance in one currency forward, from today's balance and the average daily net over a look-back period.",
      parameters: {
        type: "object",
        properties: {
          currency: { type: "string", description: "Three-letter currency code, such as USD." },
          horizon_days: { type: "integer", description: "Days ahead, 7 to 180. Defaults to 30." },
          lookback_days: { type: "integer", description: "Days of history to average, 30 to 365. Defaults to 90." },
        },
        required: ["currency"],
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

type AccountRow = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number | string;
  balance_updated_at: string | null;
  is_active: boolean;
  created_at: string;
  connection: { name: string; status: string } | null;
};

// Finds accounts by id, or by part of the name.
async function findAccounts(client: SupabaseClient, organizationId: string, value: unknown) {
  const select =
    "id, name, type, currency, balance, balance_updated_at, is_active, created_at, connection:connections(name, status)";
  if (typeof value === "string" && UUID.test(value.trim())) {
    const { data, error } = await client
      .from("accounts")
      .select(select)
      .eq("organization_id", organizationId)
      .eq("id", value.trim());
    if (error) throw error;
    return (data ?? []) as unknown as AccountRow[];
  }
  const name = searchText(value);
  if (!name) return [];
  const { data, error } = await client
    .from("accounts")
    .select(select)
    .eq("organization_id", organizationId)
    .ilike("name", `%${name}%`)
    .limit(10);
  if (error) throw error;
  return (data ?? []) as unknown as AccountRow[];
}

function topBy(rows: { key: string; value: number }[], take: number) {
  const totals = new Map<string, Totals>();
  for (const row of rows) addTo(totals, row.key, row.value);
  return [...totals.entries()]
    .map(([key, value]) => ({ key, ...formatTotals(value) }))
    .sort((a, b) => b.inflow + b.outflow - (a.inflow + a.outflow))
    .slice(0, take);
}

async function getAccountDetails(client: SupabaseClient, organizationId: string, args: Record<string, unknown>) {
  const days = int(args.days, 90, 7, 365);
  const matches = await findAccounts(client, organizationId, args.account);
  if (matches.length === 0) return { error: "No account matches that. Call get_accounts to see them all." };
  if (matches.length > 1) {
    return {
      note: "More than one account matches. Ask which one, or call again with its id.",
      matches: matches.map((a) => ({ id: a.id, name: a.name, currency: a.currency })),
    };
  }

  const account = matches[0];
  const { data, error } = await client
    .from("transactions")
    .select("id, occurred_at, description, counterparty, category, status, amount")
    .eq("account_id", account.id)
    .gte("occurred_at", new Date(Date.now() - days * DAY_MS).toISOString())
    .order("occurred_at", { ascending: false })
    .limit(3000);
  if (error) throw error;

  const rows = data ?? [];
  const completed = rows.filter((row) => row.status === "completed" || row.status === "refunded");
  const totals: Totals = { inflow: 0, outflow: 0 };
  for (const row of completed) {
    const value = cents(row.amount as number);
    if (value >= 0) totals.inflow += value;
    else totals.outflow -= value;
  }
  const statusCounts: Record<string, number> = {};
  for (const row of rows) statusCounts[row.status as string] = (statusCounts[row.status as string] ?? 0) + 1;

  return {
    account: {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: Number(account.balance),
      balance_as_of: account.balance_updated_at,
      source: account.connection?.name ?? "Manual",
      connection_status: account.connection?.status ?? null,
      archived: !account.is_active,
      added: account.created_at.slice(0, 10),
    },
    period_days: days,
    transactions_in_period: rows.length,
    status_counts: statusCounts,
    totals: formatTotals(totals),
    uncategorised: rows.filter((row) => !row.category).length,
    top_categories: topBy(
      completed.map((row) => ({ key: (row.category as string | null) ?? "Uncategorised", value: cents(row.amount as number) })),
      5,
    ).map(({ key, ...rest }) => ({ category: key, ...rest })),
    top_counterparties: topBy(
      completed.map((row) => ({ key: (row.counterparty as string | null) ?? "Unknown", value: cents(row.amount as number) })),
      5,
    ).map(({ key, ...rest }) => ({ counterparty: key, ...rest })),
    latest: rows.slice(0, 8).map((row) => ({
      id: row.id,
      date: (row.occurred_at as string).slice(0, 10),
      description: row.description,
      counterparty: row.counterparty,
      status: row.status,
      amount: Number(row.amount),
    })),
  };
}

async function getTransaction(client: SupabaseClient, organizationId: string, args: Record<string, unknown>) {
  const select =
    "id, external_id, occurred_at, created_at, updated_at, description, counterparty, category, status, amount, currency, receipt_path, metadata, account:accounts(id, name)";

  let query = client.from("transactions").select(select).eq("organization_id", organizationId);
  if (typeof args.id === "string" && UUID.test(args.id.trim())) {
    query = query.eq("id", args.id.trim());
  } else {
    const text = searchText(args.text);
    if (!text) return { error: "Give a transaction id, or words from its description or counterparty." };
    query = query.or(`description.ilike.%${text}%,counterparty.ilike.%${text}%`);
  }
  const { data, error } = await query.order("occurred_at", { ascending: false }).limit(5);
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    id: string;
    external_id: string | null;
    occurred_at: string;
    created_at: string;
    updated_at: string;
    description: string | null;
    counterparty: string | null;
    category: string | null;
    status: string;
    amount: number | string;
    currency: string;
    receipt_path: string | null;
    metadata: { reconciled?: { at: string; reference: string | null } } | null;
    account: { id: string; name: string } | null;
  }[];
  if (rows.length === 0) return { error: "No transaction matches that." };
  if (rows.length > 1) {
    return {
      note: "Several transactions match. These are the newest; ask which one, or call again with its id.",
      matches: rows.map((row) => ({
        id: row.id,
        date: row.occurred_at.slice(0, 10),
        description: row.description,
        counterparty: row.counterparty,
        amount: Number(row.amount),
        currency: row.currency,
      })),
    };
  }

  const row = rows[0];
  return {
    transaction: {
      id: row.id,
      date: row.occurred_at,
      description: row.description,
      counterparty: row.counterparty,
      amount: Number(row.amount),
      currency: row.currency,
      direction: Number(row.amount) >= 0 ? "in" : "out",
      status: row.status,
      category: row.category ?? "Uncategorised",
      account: row.account?.name ?? null,
      account_id: row.account?.id ?? null,
      paypal_reference: row.external_id,
      reconciled: row.metadata?.reconciled
        ? { on: row.metadata.reconciled.at.slice(0, 10), reference: row.metadata.reconciled.reference }
        : null,
      receipt_attached: Boolean(row.receipt_path),
      added: row.created_at,
      last_changed: row.updated_at,
    },
  };
}

// Monday of the row's week, as YYYY-MM-DD.
function weekOf(date: string) {
  const day = new Date(date.slice(0, 10) + "T00:00:00Z");
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

async function getCashflow(client: SupabaseClient, organizationId: string, args: Record<string, unknown>) {
  const days = int(args.days, 90, 7, 365);
  const groupBy = oneOf(args.group_by, GROUPS) ?? "month";
  const excludeTransfers = args.exclude_transfers === true;

  let query = client
    .from("transactions")
    .select("amount, currency, category, counterparty, occurred_at, account:accounts(name)")
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .gte("occurred_at", new Date(Date.now() - days * DAY_MS).toISOString())
    .limit(5000);

  const accountName = searchText(args.account_name);
  if (accountName) {
    const matches = await findAccounts(client, organizationId, accountName);
    if (matches.length === 0) return { error: `No account matches "${accountName}".` };
    query = query.in("account_id", matches.map((a) => a.id));
  }

  const { data, error } = await query;
  if (error) throw error;

  type Row = {
    amount: number | string;
    currency: string;
    category: string | null;
    counterparty: string | null;
    occurred_at: string;
    account: { name: string } | null;
  };
  const rows = ((data ?? []) as unknown as Row[]).filter(
    (row) => !excludeTransfers || (row.category ?? "").toLowerCase() !== "transfers",
  );

  const keyOf = (row: Row) => {
    switch (groupBy) {
      case "week":
        return weekOf(row.occurred_at);
      case "category":
        return row.category ?? "Uncategorised";
      case "counterparty":
        return row.counterparty ?? "Unknown";
      case "account":
        return row.account?.name ?? "Unknown";
      default:
        return row.occurred_at.slice(0, 7);
    }
  };

  const byCurrency = new Map<string, { totals: Totals; groups: Map<string, Totals>; categories: Map<string, Totals> }>();
  for (const row of rows) {
    const value = cents(row.amount);
    const entry = byCurrency.get(row.currency) ?? { totals: { inflow: 0, outflow: 0 }, groups: new Map(), categories: new Map() };
    if (value >= 0) entry.totals.inflow += value;
    else entry.totals.outflow -= value;
    addTo(entry.groups, keyOf(row), value);
    addTo(entry.categories, row.category ?? "Uncategorised", value);
    byCurrency.set(row.currency, entry);
  }

  const timeOrdered = groupBy === "month" || groupBy === "week";

  return {
    days,
    group_by: groupBy,
    account: accountName ?? "all accounts",
    note: excludeTransfers
      ? "Completed transactions only, without transfers between your own accounts."
      : "Completed transactions only. Transfers between your own accounts count as both in and out.",
    currencies: [...byCurrency.entries()].map(([currency, entry]) => {
      const categories = [...entry.categories.entries()].map(([category, value]) => ({ category, ...formatTotals(value) }));
      const groups = [...entry.groups.entries()].map(([group, value]) => ({ group, ...formatTotals(value) }));
      return {
        currency,
        ...formatTotals(entry.totals),
        groups: timeOrdered
          ? groups.sort((a, b) => a.group.localeCompare(b.group))
          : groups.sort((a, b) => b.inflow + b.outflow - (a.inflow + a.outflow)).slice(0, 15),
        top_income: categories.filter((c) => c.inflow > 0).sort((a, b) => b.inflow - a.inflow).slice(0, 5)
          .map((c) => ({ category: c.category, amount: c.inflow })),
        top_spending: categories.filter((c) => c.outflow > 0).sort((a, b) => b.outflow - a.outflow).slice(0, 5)
          .map((c) => ({ category: c.category, amount: c.outflow })),
      };
    }),
  };
}

async function getForecast(client: SupabaseClient, organizationId: string, args: Record<string, unknown>) {
  const currency = typeof args.currency === "string" ? args.currency.trim().toUpperCase() : "";
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Give a three-letter currency code, such as USD." };
  const horizon = int(args.horizon_days, 30, 7, 180);
  const lookback = int(args.lookback_days, 90, 30, 365);

  const [{ data: accounts, error: accountError }, { data: rows, error: rowError }] = await Promise.all([
    client
      .from("accounts")
      .select("balance")
      .eq("organization_id", organizationId)
      .eq("currency", currency)
      .eq("is_active", true),
    client
      .from("transactions")
      .select("amount")
      .eq("organization_id", organizationId)
      .eq("currency", currency)
      .eq("status", "completed")
      .gte("occurred_at", new Date(Date.now() - lookback * DAY_MS).toISOString())
      .limit(10000),
  ]);
  if (accountError) throw accountError;
  if (rowError) throw rowError;
  if (!accounts?.length) return { error: `There are no active ${currency} accounts.` };

  const balance = accounts.reduce((sum, row) => sum + cents(row.balance as number), 0);
  const dailyNet = (rows ?? []).reduce((sum, row) => sum + cents(row.amount as number), 0) / lookback;

  const points: { date: string; balance: number }[] = [];
  for (let day = 7; day <= horizon; day += 7) {
    points.push({
      date: new Date(Date.now() + day * DAY_MS).toISOString().slice(0, 10),
      balance: fromCents(Math.round(balance + dailyNet * day)),
    });
  }
  if (points.at(-1)?.date !== new Date(Date.now() + horizon * DAY_MS).toISOString().slice(0, 10)) {
    points.push({
      date: new Date(Date.now() + horizon * DAY_MS).toISOString().slice(0, 10),
      balance: fromCents(Math.round(balance + dailyNet * horizon)),
    });
  }

  return {
    currency,
    method: `Today's balance plus the average daily net of the last ${lookback} days. A simple projection, not a guarantee.`,
    current_balance: fromCents(balance),
    average_daily_net: fromCents(Math.round(dailyNet)),
    horizon_days: horizon,
    points,
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
      case "get_account_details":
        return await getAccountDetails(client, organizationId, args);
      case "get_transaction":
        return await getTransaction(client, organizationId, args);
      case "get_cashflow":
        return await getCashflow(client, organizationId, args);
      case "get_forecast":
        return await getForecast(client, organizationId, args);
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
