import { corsHeaders } from "./cors.ts";

/** An error with an HTTP status, safe to show to the caller. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "error",
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function json(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export function errorResponse(req: Request, error: unknown): Response {
  if (error instanceof HttpError) {
    return new Response(
      JSON.stringify({ error: { code: error.code, message: error.message } }),
      {
        status: error.status,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      },
    );
  }

  // Log the details server-side; never send internal errors to the caller.
  console.error(error);
  return new Response(
    JSON.stringify({
      error: { code: "internal_error", message: "Something went wrong." },
    }),
    {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    },
  );
}
