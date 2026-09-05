import { Copy, Download, RefreshCw, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import type { ResumeAnalysisResult } from '@/types/resume-analysis';

interface AnalysisHeaderProps {
  file: File;
  result: ResumeAnalysisResult | null;
  markdown: string;
  onUpload?: () => void;
  onRefresh?: () => void;
  onSave?: (fileName: string, result: ResumeAnalysisResult) => void;
}
export function AnalysisHeader({ file, result, markdown, onUpload, onRefresh, onSave }: AnalysisHeaderProps) {
  const { addToast } = useToast();
  const date = result ? new Date(result.metadata.generatedAt) : null;
  const download = (extension: 'md' | 'txt') => {
    const url = URL.createObjectURL(
      new Blob([markdown], { type: extension === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-analysis-${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      addToast({ title: 'Скопировано', description: 'Отчёт скопирован', variant: 'success' });
    } catch {
      addToast({ title: 'Не удалось скопировать', description: 'Вы можете скачать отчёт.', variant: 'destructive' });
    }
  };
  return (
    <header className="analysis-header">
      <div className="header-title">
        <h1>
          {result?.targetRole ?? 'Анализ резюме'} <span>– {file.name}</span>
        </h1>
        <div className="header-meta">
          <span>
            {date && Number.isFinite(date.getTime())
              ? `Последний анализ: ${date.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : 'Сохранённый анализ'}
          </span>
          {onRefresh ? (
            <button onClick={onRefresh}>
              <RefreshCw size={13} />
              Обновить анализ
            </button>
          ) : (
            <span>Для обновления загрузите PDF</span>
          )}
        </div>
      </div>
      <div className="header-actions">
        <details className="download-menu">
          <summary>
            <Download size={15} />
            Скачать отчёт
          </summary>
          <div>
            <button onClick={() => download('md')}>Markdown (.md)</button>
            <button onClick={() => download('txt')}>Текст (.txt)</button>
            <button
              onClick={() => {
                void copy();
              }}
            >
              <Copy size={13} />
              Копировать отчёт
            </button>
            {result && onSave && (
              <button
                onClick={() => {
                  try {
                    onSave(file.name, result);
                    addToast({ title: 'Сохранено', description: 'Результат добавлен в историю', variant: 'success' });
                  } catch {
                    addToast({
                      title: 'Не удалось сохранить',
                      description: 'Хранилище браузера недоступно',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <Save size={13} />
                Сохранить в историю
              </button>
            )}
          </div>
        </details>
        {onUpload && (
          <Button onClick={onUpload}>
            <Upload size={15} className="mr-2" />
            Загрузить новое резюме
          </Button>
        )}
      </div>
    </header>
  );
}
