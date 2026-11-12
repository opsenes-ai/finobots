export { cn } from "cn"

// An amount in its own currency, e.g. "$1,234.50" or "-£12.00".
export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "–"
  return new Date(value).toLocaleString(
    undefined,
    withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }
  )
}
