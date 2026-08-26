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

interface AnalyzerFormProps {
  onAnalyze: (file: File, apiKey: string, model: string) => Promise<void>;
  isAnalyzing: boolean;
}

type FormData = z.infer<typeof apiSchema>;

export function AnalyzerForm({ onAnalyze, isAnalyzing }: AnalyzerFormProps) {
  const { addToast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [modelInputValue, setModelInputValue] = React.useState('');
  const [apiKeyInputValue, setApiKeyInputValue] = React.useState('');
  
  const defaultValues = React.useMemo(() => {
    const savedKey = localStorage.getItem('pdf-analyzer-api-key');
    return {
      apiKey: savedKey || '',
      model: 'openai/gpt-5.2',
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

    try {
      await onAnalyze(file, apiKey, data.model);
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  React.useEffect(() => {
    if (apiKeyInputValue) {
      localStorage.setItem('pdf-analyzer-api-key', apiKeyInputValue);
    }
  }, [apiKeyInputValue]);

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
                <Label htmlFor="apiKey">Polza AI API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKeyInputValue}
                  onChange={(e) => setApiKeyInputValue(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Не сохраняйте API key в браузере для максимальной безопасности
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">AI Модель</Label>
                <Input
                  id="model"
                  {...register('model')}
                  placeholder="openai/gpt-5.2"
                  value={modelInputValue}
                  onChange={(e) => setModelInputValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Рекомендуется: openai/gpt-5.2, openai/gpt-4o
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
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
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
