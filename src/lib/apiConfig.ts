/**
 * Resolves the backend API base URL strictly from environment variables (.env / .env.local).
 * Contains no hardcoded fallback URLs.
 */
export function getBackendApiUrl(): string {
  const url =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!url) {
    throw new Error(
      "Missing BACKEND_API_URL or NEXT_PUBLIC_API_URL in environment variables. Please check your .env file."
    );
  }

  return url.replace(/\/+$/, "");
}
