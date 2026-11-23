/**
 * Resolves the backend API base URL strictly from environment variables (.env / .env.local).
 * Contains no hardcoded fallback URLs.
 */
export function getBackendApiUrl(): string {
  let url =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!url) {
    throw new Error(
      "Missing BACKEND_API_URL or NEXT_PUBLIC_API_URL in environment variables. Please check your .env file."
    );
  }

  url = url.replace(/\/+$/, "");

  // Localhost safety guard: prevent SSL handshake errors if localhost is accidentally prefixed with https://
  if (url.startsWith("https://localhost:") || url.startsWith("https://127.0.0.1:")) {
    url = url.replace(/^https:\/\//, "http://");
  }

  return url;
}
