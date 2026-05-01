type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
};

type ApiErrorPayload = {
  message?: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = { message: "Invalid JSON response from server" };
  }

  if (!response.ok) {
    const errorMessage =
      (data as ApiErrorPayload)?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get<T>(url: string) {
    return request<T>(url, { method: "GET" });
  },
  post<T>(url: string, body: unknown) {
    return request<T>(url, { method: "POST", body });
  },
  put<T>(url: string, body: unknown) {
    return request<T>(url, { method: "PUT", body });
  },
  delete<T>(url: string) {
    return request<T>(url, { method: "DELETE" });
  },
};
