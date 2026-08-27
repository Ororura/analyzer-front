import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ResumeUpload } from '@/components/resume-upload/ResumeUpload';
import { formatFileSize } from '@/lib/utils/helpers';
import { apiSchema } from '@/lib/validation/schema';
import { useToast } from '@/hooks/useToast';
import { clearApiKey, loadApiKey, saveApiKey } from '@/lib/utils/storage';
import { DEFAULT_MODEL, RECOMMENDED_MODELS } from '@/lib/constants';

const MODEL_STORAGE_KEY = 'pdf-analyzer-model';

interface AnalyzerFormProps {
  onAnalyze: (file: File, apiKey: string, model: string) => Promise<void>;
  isAnalyzing: boolean;
  error: Error | null;
}

type FormData = z.infer<typeof apiSchema>;

export function AnalyzerForm({ onAnalyze, isAnalyzing, error }: AnalyzerFormProps) {
  const { addToast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [apiKeyInputValue, setApiKeyInputValue] = React.useState(() => loadApiKey() ?? '');
  
  const defaultValues = React.useMemo(() => {
    const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
    return {
      apiKey: loadApiKey() || '',
      model: savedModel && RECOMMENDED_MODELS.includes(savedModel) ? savedModel : DEFAULT_MODEL,
    };
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(apiSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { register, handleSubmit } = form;

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      addToast({
        title: 'Ошибка',
        description: 'Можно загружать только PDF-файлы',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      addToast({
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 50 MB',
        variant: 'destructive',
      });
      return;
    }
    
    setFile(selectedFile);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  const onSubmit = async (data: FormData) => {
    if (!file) {
      addToast({
        title: 'Ошибка',
        description: 'Пожалуйста, загрузите PDF-файл',
        variant: 'destructive',
      });
      return;
    }

    const apiKey = apiKeyInputValue || data.apiKey;
    
    if (!apiKey) {
      addToast({
        title: 'Ошибка',
        description: 'API key обязателен',
        variant: 'destructive',
      });
      return;
    }

    await onAnalyze(file, apiKey, data.model);
  };

  React.useEffect(() => {
    if (apiKeyInputValue) {
      saveApiKey(apiKeyInputValue);
    } else {
      clearApiKey();
    }
  }, [apiKeyInputValue]);

  const handleClearApiKey = () => {
    clearApiKey();
    setApiKeyInputValue('');
    form.setValue('apiKey', '');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка резюме</CardTitle>
            <CardDescription>Загрузите PDF-файл резюме для анализа</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="resume-file">PDF резюме</Label>
              <ResumeUpload
                file={file ? { file, preview: '', size: formatFileSize(file.size) } : null}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                error={undefined}
              />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="apiKey">Polza AI API Key</Label>
                  {apiKeyInputValue && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleClearApiKey}>
                      Очистить ключ
                    </Button>
                  )}
                </div>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKeyInputValue}
                  onChange={(e) => setApiKeyInputValue(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Ключ хранится 30 дней в cookie этого сайта
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">AI Модель</Label>
                <select
                  id="model"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  {...register('model', {
                    onChange: (event) => localStorage.setItem(MODEL_STORAGE_KEY, event.target.value),
                  })}
                >
                  {RECOMMENDED_MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Выбор сохранится для следующего запуска
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isAnalyzing || !file}
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4" />
                    Анализируем...
                  </>
                ) : (
                  'Анализировать резюме'
                )}
              </Button>
              {error && <p className="text-sm text-destructive">{error.message}</p>}
            </div>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
