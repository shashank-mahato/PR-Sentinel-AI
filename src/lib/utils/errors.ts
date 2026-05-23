export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function safeErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message.replace(/-----BEGIN[\s\S]+?-----END [A-Z ]+-----/g, "[redacted]");
  return fallback;
}

export function jsonError(error: unknown, fallback = "Request failed") {
  const message = safeErrorMessage(error, fallback);
  const status = error instanceof AppError ? error.status : 500;
  return Response.json({ error: message }, { status });
}
