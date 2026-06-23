import { API_BASE } from "./config";
import { z } from "zod";

const jsonHeaders = { "Content-Type": "application/json" };

export type ApiBody = object | string | number | boolean | null | undefined;

export interface ApiClientOptions extends RequestInit {
  withCredentials?: boolean;
  baseURL?: string;
}

function validateData<T>(data: unknown, schema: z.ZodType<T>, path: string, method = "GET"): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errMsg = `Dữ liệu từ máy chủ không đúng định dạng tại đường dẫn: ${path}`;
    console.error(`[API Validation Error] ${method} ${path}`, result.error.format());

    if (typeof window !== "undefined") {
      import("sonner").then(({ toast }) => {
        toast.error(errMsg);
      }).catch(() => {
        /* ignore toast load error */
      });
    }

    throw new Error(errMsg);
  }
  return result.data;
}

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
  init?: RequestInit,
  schema?: z.ZodType<T>
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
    const error = new Error(detail || `HTTP ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();
  if (schema) {
    return validateData<T>(data, schema, path, init?.method || "GET");
  }
  return data as T;
}

export function apiPostJson<T>(
  path: string,
  body: ApiBody,
  schema?: z.ZodType<T>
): Promise<T> {
  return apiJson<T>(
    path,
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(body),
    },
    schema
  );
}

export function apiPatchJson<T>(
  path: string,
  body: ApiBody,
  schema?: z.ZodType<T>
): Promise<T> {
  return apiJson<T>(
    path,
    {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(body),
    },
    schema
  );
}

// Aliases and helpers for validation compatibility
export function apiGet<T>(
  path: string,
  schema?: z.ZodType<T>,
  init?: RequestInit
): Promise<T> {
  return apiJson<T>(path, init, schema);
}

export function apiPost<T>(
  path: string,
  body: ApiBody,
  schema?: z.ZodType<T>
): Promise<T> {
  return apiPostJson<T>(path, body, schema);
}

export function apiPatch<T>(
  path: string,
  body: ApiBody,
  schema?: z.ZodType<T>
): Promise<T> {
  return apiPatchJson<T>(path, body, schema);
}

// Helper to distinguish options and Zod schemas in apiClient
function parseClientArgs<T>(
  arg3: z.ZodType<T> | ApiClientOptions | undefined,
  arg4: ApiClientOptions | undefined
): { schema?: z.ZodType<T>; options?: ApiClientOptions } {
  if (arg3 && (arg3 instanceof z.ZodType || typeof (arg3 as any).safeParse === "function")) {
    return { schema: arg3 as z.ZodType<T>, options: arg4 };
  }
  return { schema: arg4 as z.ZodType<T>, options: arg3 as ApiClientOptions };
}

// Polyfill for apiClient backward compatibility
export const apiClient = {
  delete: async <T = unknown>(path: string, schema?: z.ZodType<T>): Promise<{ data: T }> => {
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

    if (schema) {
      const validated = validateData<T>(data, schema, path, "DELETE");
      return { data: validated };
    }
    return { data: data as T };
  },

  put: async <T = unknown>(
    path: string,
    body?: ApiBody,
    arg3?: z.ZodType<T> | ApiClientOptions,
    arg4?: ApiClientOptions
  ): Promise<{ data: T }> => {
    const { schema, options } = parseClientArgs(arg3, arg4);
    const isJson =
      body !== null &&
      typeof body === "object" &&
      !(typeof Blob !== "undefined" && body instanceof Blob);

    const headers: Record<string, string> = { ...(options?.headers as Record<string, string>) };
    if (isJson && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const init: RequestInit = {
      method: "PUT",
      headers,
      body: isJson ? JSON.stringify(body) : (body as BodyInit | null),
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

    if (schema) {
      const validated = validateData<T>(data, schema, path, "PUT");
      return { data: validated };
    }
    return { data: data as T };
  },

  post: async <T = unknown>(
    path: string,
    body?: ApiBody,
    arg3?: z.ZodType<T> | ApiClientOptions,
    arg4?: ApiClientOptions
  ): Promise<{ data: T }> => {
    const { schema, options } = parseClientArgs(arg3, arg4);
    const isJson =
      body !== null &&
      typeof body === "object" &&
      !(typeof FormData !== "undefined" && body instanceof FormData) &&
      !(typeof Blob !== "undefined" && body instanceof Blob);

    const headers: Record<string, string> = { ...(options?.headers as Record<string, string>) };
    if (isJson && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const init: RequestInit = {
      method: "POST",
      headers,
      body: isJson ? JSON.stringify(body) : (body as BodyInit | null),
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

    if (schema) {
      const validated = validateData<T>(data, schema, path, "POST");
      return { data: validated };
    }
    return { data: data as T };
  },
};
