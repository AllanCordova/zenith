export function apiUrl(): string {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error("API_URL is not set");
  }
  return url.replace(/\/$/, "");
}

export async function nestFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(`${apiUrl()}${path}`, {
    ...init,
    headers,
  });
}

export async function forwardNestError(nestRes: Response): Promise<Response> {
  const body = await nestRes.text();
  return new Response(body, {
    status: nestRes.status,
    headers: { "content-type": nestRes.headers.get("content-type") ?? "application/json" },
  });
}
