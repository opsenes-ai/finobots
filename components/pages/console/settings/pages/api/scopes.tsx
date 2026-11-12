export const API_SCOPES = [
  { value: "accounts:read", label: "Read accounts" },
  { value: "transactions:read", label: "Read transactions" },
  { value: "transactions:write", label: "Write transactions" },
  { value: "cashflow:read", label: "Read cash flow" },
  { value: "connections:read", label: "Read connections" },
] as const;

// What each permission allows.
export function ApiScopes() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Scopes</h3>
      <ul className="divide-y rounded-lg border">
        {API_SCOPES.map((scope) => (
          <li key={scope.value} className="flex items-center justify-between gap-4 p-3 text-sm">
            <span>{scope.label}</span>
            <code className="text-muted-foreground text-xs">{scope.value}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
