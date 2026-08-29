const DEFAULT_API_URL = "http://localhost:8080";

export class ApiClientError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

export const createApiUrl = (path: string, searchParams?: URLSearchParams): URL => {
  const baseUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (searchParams) url.search = searchParams.toString();
  return url;
};

export const getApiJson = async <T>(path: string, searchParams?: URLSearchParams): Promise<T> => {
  const response = await fetch(createApiUrl(path, searchParams));
  return parseApiJson<T>(response);
};

export const parseApiJson = async <T>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => null) as unknown;
  const error = extractApiError(body);
  if (!response.ok) {
    throw new ApiClientError(error.message || "Backend request failed", response.status, error.code);
  }
  if (body === null) {
    throw new ApiClientError("Backend returned an invalid JSON response", response.status);
  }
  return body as T;
};

const extractApiError = (body: unknown): { code?: string; message?: string } => {
  if (!body || typeof body !== "object") return {};
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string") return { message: record.message };
  if (record.error && typeof record.error === "object") {
    const error = record.error as Record<string, unknown>;
    return {
      code: typeof error.code === "string" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : undefined,
    };
  }
  return {};
};
