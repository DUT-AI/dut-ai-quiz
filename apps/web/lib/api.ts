import { API_BASE } from "./config";

const jsonHeaders = { "Content-Type": "application/json" };

export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  return fetch(url, {
    credentials: "include",
    ...init,
  });
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function apiPostJson<T>(path: string, body: unknown): Promise<T> {
  return apiJson<T>(path, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
}

export function apiPatchJson<T>(path: string, body: unknown): Promise<T> {
  return apiJson<T>(path, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
}

// Aliases for compatibility
export const apiGet = apiJson;
export const apiPost = apiPostJson;
export const apiPatch = apiPatchJson;

// Polyfill for apiClient backward compatibility
export const apiClient = {
  delete: async (path: string) => {
    const res = await apiFetch(path, { method: "DELETE" });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        if (body?.detail) detail = String(body.detail);
      } catch {
        /* ignore */
      }
      throw new Error(detail || `HTTP ${res.status}`);
    }
    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { data };
  },
  put: async (path: string, body?: any, options?: any) => {
    const isJson =
      body !== null &&
      typeof body === "object" &&
      !(typeof Blob !== "undefined" && body instanceof Blob);

    const headers: Record<string, string> = { ...options?.headers };
    if (isJson && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const init: RequestInit = {
      method: "PUT",
      headers,
      body: isJson ? JSON.stringify(body) : body,
    };

    if (options?.withCredentials === false) {
      init.credentials = "omit";
    }

    const res = await apiFetch(path, init);

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const rspBody = await res.json();
        if (rspBody?.detail) detail = String(rspBody.detail);
      } catch {
        /* ignore */
      }
      throw new Error(detail || `HTTP ${res.status}`);
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { data };
  },
  post: async <T>(path: string, body?: any, options?: any): Promise<{ data: T }> => {
    const isJson =
      body !== null &&
      typeof body === "object" &&
      !(typeof FormData !== "undefined" && body instanceof FormData) &&
      !(typeof Blob !== "undefined" && body instanceof Blob);

    const headers: Record<string, string> = { ...options?.headers };
    if (isJson && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const init: RequestInit = {
      method: "POST",
      headers,
      body: isJson ? JSON.stringify(body) : body,
    };

    const res = await apiFetch(path, init);

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const rspBody = await res.json();
        if (rspBody?.detail) detail = String(rspBody.detail);
      } catch {
        /* ignore */
      }
      throw new Error(detail || `HTTP ${res.status}`);
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { data };
  },
};
