import type { HistoryEntry } from '@/types';

export const getHistory = (): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem('pdf-analyzer-history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveToHistory = (entry: Omit<HistoryEntry, 'id' | 'createdAt'> & { result: string }): void => {
  try {
    const history = getHistory();
    const filtered = history.filter(h => h.fileName === entry.fileName && h.model === entry.model);
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      fileName: entry.fileName,
      model: entry.model,
      createdAt: new Date().toISOString(),
      result: entry.result,
    };
    const remaining = filtered.length > 0 ? history.filter(h => h.id !== filtered[0].id) : history;
    remaining.unshift(newEntry);
    localStorage.setItem('pdf-analyzer-history', JSON.stringify(remaining.slice(0, 20)));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

export const removeFromHistory = (id: string): void => {
  try {
    const history = getHistory();
    const filtered = history.filter(h => h.id !== id);
    localStorage.setItem('pdf-analyzer-history', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from history:', error);
  }
};

export const clearHistory = (): void => {
  try {
    localStorage.removeItem('pdf-analyzer-history');
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};

export const saveApiKey = (apiKey: string): void => {
  try {
    localStorage.setItem('pdf-analyzer-api-key', apiKey);
  } catch (error) {
    console.error('Failed to save API key:', error);
  }
};

export const loadApiKey = (): string | undefined => {
  try {
    return localStorage.getItem('pdf-analyzer-api-key') || undefined;
  } catch {
    return undefined;
  }
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
