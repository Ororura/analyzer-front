import { FileText } from "lucide-react";
import type { HistoryEntry } from "@/types";

interface HistoryViewProps {
  history: HistoryEntry[];
  onEntryClick: (entry: HistoryEntry) => void;
  onAnalyzeClick: () => void;
}

export function HistoryView({ history, onEntryClick, onAnalyzeClick }: HistoryViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">История анализов</h2>

        <p className="text-muted-foreground">{history.length} сохраненных резюме</p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-lg border bg-secondary/20 p-8 text-center">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground" />

          <h3 className="mt-4 text-lg font-medium">История пуста</h3>

          <p className="text-muted-foreground">Анализируйте резюме и они появятся здесь</p>

          <button type="button" onClick={onAnalyzeClick} className="mt-4 text-primary hover:underline">
            Начать анализ
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onEntryClick(entry)}
              className="cursor-pointer rounded-lg border bg-card p-6 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-start justify-between">
                <FileText className="h-5 w-5 text-primary" />

                <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>

              <h3 className="mt-4 truncate font-medium">{entry.fileName}</h3>

              <p className="mt-1 text-sm text-muted-foreground">{entry.model}</p>

              <p className="mt-2 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
