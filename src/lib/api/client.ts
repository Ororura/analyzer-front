const DEFAULT_API_URL = "http://localhost:8080";

export class ApiClientError extends Error {
  constructor(message: string, readonly status: number) {
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
  const body = await response.json().catch(() => null) as unknown;

  if (!response.ok) {
    throw new ApiClientError(extractErrorMessage(body) || "Backend request failed", response.status);
  }
  if (body === null) {
    throw new ApiClientError("Backend returned an invalid JSON response", response.status);
  }

  return body as T;
};

const extractErrorMessage = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (record.error && typeof record.error === "object") {
    const message = (record.error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return undefined;
};
