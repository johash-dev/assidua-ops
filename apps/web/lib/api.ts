export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
  } & T;
  if (!res.ok) {
    throw new ApiError(body.message ?? body.code ?? `HTTP ${res.status}`, res.status, body.code);
  }
  return body as T;
}
