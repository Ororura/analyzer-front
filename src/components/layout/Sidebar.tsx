import { History, Upload, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HistoryEntry } from '@/types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  history: HistoryEntry[];
  onHistoryItemClick: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
}

export function Sidebar({ activeTab, onTabChange, history, onHistoryItemClick, onClearHistory }: SidebarProps) {
  return (
    <aside className="hidden h-full flex-col border-r bg-background md:flex w-64 shrink-0">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Resume Analyzer</h1>
        <p className="text-sm text-muted-foreground">Java Backend Developer</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        <Button
          variant={activeTab === 'analyze' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onTabChange('analyze')}
        >
          <Upload className="mr-2 h-4 w-4" />
          Новый анализ
        </Button>

        <Button
          variant={activeTab === 'market' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onTabChange('market')}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Рынок вакансий
        </Button>

        <Button
          variant={activeTab === 'history' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onTabChange('history')}
        >
          <History className="mr-2 h-4 w-4" />
          История
        </Button>
      </nav>

      <div className="p-4 border-t">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground">Последние анализы</h3>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onClearHistory}
            >
              Очистить
            </Button>
          )}
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {history.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              История пуста
            </div>
          ) : (
            history.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="cursor-pointer rounded-md p-2 hover:bg-accent"
                onClick={() => onHistoryItemClick(entry)}
              >
                <p className="text-sm font-medium truncate">{entry.fileName}</p>
                <p className="text-xs text-muted-foreground">{entry.model}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
