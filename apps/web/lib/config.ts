/** Base URL API (FastAPI), ví dụ http://localhost:8000 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
