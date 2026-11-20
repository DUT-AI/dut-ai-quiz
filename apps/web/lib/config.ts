/** Base URL API (FastAPI) */
export const API_BASE =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
      "http://localhost:8076"
    : (window.location.hostname.endsWith("dutai.io.vn") || window.location.pathname.startsWith("/lms"))
      ? (window.location.pathname.startsWith("/lms") ? "/lms" : "")
      : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

