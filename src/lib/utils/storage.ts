import type { HistoryEntry } from "@/types";

export const getHistory = (): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem("pdf-analyzer-history");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveToHistory = (entry: Omit<HistoryEntry, "id" | "createdAt">): void => {
  try {
    const history = getHistory();
    const filtered = history.filter((h) => h.fileName === entry.fileName && h.model === entry.model);
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      fileName: entry.fileName,
      model: entry.model,
      createdAt: new Date().toISOString(),
      result: entry.result,
      atsResult: entry.atsResult,
    };
    const remaining = filtered.length > 0 ? history.filter((h) => h.id !== filtered[0].id) : history;
    remaining.unshift(newEntry);
    localStorage.setItem("pdf-analyzer-history", JSON.stringify(remaining.slice(0, 20)));
  } catch (error) {
    console.error("Failed to save history:", error);
  }
};

export const removeFromHistory = (id: string): void => {
  try {
    const history = getHistory();
    const filtered = history.filter((h) => h.id !== id);
    localStorage.setItem("pdf-analyzer-history", JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove from history:", error);
  }
};

export const clearHistory = (): void => {
  try {
    localStorage.removeItem("pdf-analyzer-history");
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
};

const API_KEY_COOKIE = "pdf-analyzer-api-key";
const API_KEY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const saveApiKey = (apiKey: string): void => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${API_KEY_COOKIE}=${encodeURIComponent(apiKey)}; Path=/; Max-Age=${API_KEY_COOKIE_MAX_AGE}; SameSite=Strict${secure}`;
};

export const loadApiKey = (): string | undefined => {
  const prefix = `${API_KEY_COOKIE}=`;
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
};

export const clearApiKey = (): void => {
  document.cookie = `${API_KEY_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`;
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
