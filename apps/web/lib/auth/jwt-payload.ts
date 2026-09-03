export type JwtRolePayload = {
  sub?: string;
  email?: string;
  role?: string;
  type?: string;
};

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

export function decodeJwtPayload(token: string): JwtRolePayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtRolePayload;
  } catch {
    return null;
  }
}
