import { HttpError } from "./response.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CURRENCY = /^[A-Z]{3}$/;

function invalid(message: string): never {
  throw new HttpError(400, message, "invalid_input");
}

/** Parses the request body as a JSON object. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    invalid("The request body must be valid JSON.");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    invalid("The request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

export function requireString(
  value: unknown,
  field: string,
  { min = 1, max = 1000 }: { min?: number; max?: number } = {},
): string {
  if (typeof value !== "string") invalid(`${field} must be text.`);
  const text = value.trim();
  if (text.length < min || text.length > max) {
    invalid(`${field} must be between ${min} and ${max} characters.`);
  }
  return text;
}

export function optionalString(
  value: unknown,
  field: string,
  options?: { min?: number; max?: number },
): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireString(value, field, options);
}

export function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID.test(value)) {
    invalid(`${field} must be a valid id.`);
  }
  return value.toLowerCase();
}

export function requireAmount(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    invalid(`${field} must be a number.`);
  }
  return value;
}

export function requireCurrency(value: unknown, field: string): string {
  if (typeof value !== "string" || !CURRENCY.test(value)) {
    invalid(`${field} must be a 3-letter currency code, like USD.`);
  }
  return value;
}

export function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireUuid(value, field);
}

/** An ISO 8601 date or date-time. Returns it normalised to UTC. */
export function requireDate(value: unknown, field: string): Date {
  if (typeof value !== "string") invalid(`${field} must be a date.`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) invalid(`${field} must be a valid date.`);
  return date;
}

export function optionalDate(value: unknown, field: string): Date | undefined {
  if (value === undefined || value === null) return undefined;
  return requireDate(value, field);
}

export function requireArray(
  value: unknown,
  field: string,
  { min = 1, max = 100 }: { min?: number; max?: number } = {},
): unknown[] {
  if (!Array.isArray(value)) invalid(`${field} must be a list.`);
  if (value.length < min || value.length > max) {
    invalid(`${field} must have between ${min} and ${max} items.`);
  }
  return value;
}

export function requireInteger(
  value: unknown,
  field: string,
  { min, max }: { min: number; max: number },
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    invalid(`${field} must be a whole number between ${min} and ${max}.`);
  }
  return value;
}

export function requireOneOf<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    invalid(`${field} must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}
