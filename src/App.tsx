import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AnalyzerForm } from '@/components/analyzer/AnalyzerForm';
import { ResultDisplay } from '@/components/result/ResultDisplay';
import { analyzeResume } from '@/lib/polza/client';
import { useToast } from '@/hooks/useToast';
import type { HistoryEntry } from '@/types';
import { FileText } from 'lucide-react';

function App() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('analyze');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState<{ file: File; preview: string; size: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisModel, setAnalysisModel] = useState<string>('');

  useEffect(() => {
    const storedHistory = localStorage.getItem('pdf-analyzer-history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    }
  }, []);

  const handleAnalyze = async (file: File, apiKey: string, model: string) => {
    setIsAnalyzing(true);
    setCurrentFile({
      file,
      preview: '',
      size: file.size.toString(),
    });
    setAnalysisModel(model);

    try {
      const response = await analyzeResume(file, apiKey, model);
      
      if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        if (content) {
          setAnalysisResult(content);
          setActiveTab('result');
          
          addToast({
            title: 'Успех',
            description: 'Резюме успешно проанализировано',
            variant: 'success',
          });
        }
      } else {
        throw new Error('Пустой ответ от API');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      addToast({
        title: 'Ошибка',
        description: `Не удалось выполнить анализ: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleHistoryItemClick = (entry: HistoryEntry) => {
    setAnalysisResult(entry.result);
    setAnalysisModel(entry.model);
    setCurrentFile({
      file: new File([], entry.fileName),
      preview: '',
      size: '',
    });
    setActiveTab('result');
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('pdf-analyzer-history');
    addToast({
      title: 'Очищено',
      description: 'История анализа очищена',
      variant: 'success',
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analyze':
        return <AnalyzerForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />;
      case 'result':
        if (!analysisResult || !currentFile) {
          return (
            <div className="rounded-lg border bg-secondary/20 p-8 text-center">
              <h3 className="text-lg font-medium">Нет результатов</h3>
              <p className="text-muted-foreground">Загрузите резюме для анализа</p>
              <button
                onClick={() => setActiveTab('analyze')}
                className="mt-4 text-primary hover:underline"
              >
                Вернуться к загрузке
              </button>
            </div>
          );
        }
        return <ResultDisplay result={analysisResult} file={currentFile.file} model={analysisModel} />;
      case 'history':
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
                <button
                  onClick={() => setActiveTab('analyze')}
                  className="mt-4 text-primary hover:underline"
                >
                  Начать анализ
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="cursor-pointer rounded-lg border bg-card p-6 transition-colors hover:border-primary hover:bg-primary/5"
                    onClick={() => handleHistoryItemClick(entry)}
                  >
                    <div className="flex items-start justify-between">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="mt-4 font-medium truncate">{entry.fileName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{entry.model}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        history={history}
        onHistoryItemClick={handleHistoryItemClick}
        onClearHistory={handleClearHistory}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
