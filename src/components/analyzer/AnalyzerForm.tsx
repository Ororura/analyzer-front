import * as React from "react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ResumeUpload } from "@/components/resume-upload/ResumeUpload";
import { formatFileSize } from "@/lib/utils/helpers";
import { useToast } from "@/hooks/useToast";
import { useAiProvidersQuery } from "@/hooks/useAiProvidersQuery";
import { AI_PROVIDER_LABELS } from "@/lib/ai/providers";
import { getUserFacingErrorMessage } from "@/lib/api/errors";
import { MAX_FILE_SIZE, PDF_MIME_TYPE } from "@/lib/constants";
import type { AiProviderType, AiProvidersResponse } from "@/types/resume-analysis";

interface AnalyzerFormProps {
  onAnalyze: (file: File, provider: AiProviderType) => Promise<void>;
  isAnalyzing: boolean;
  error: Error | null;
}

export function AnalyzerForm({ onAnalyze, isAnalyzing, error }: AnalyzerFormProps) {
  const { addToast } = useToast();
  const providersQuery = useAiProvidersQuery();
  const [file, setFile] = React.useState<File | null>(null);
  const [provider, setProvider] = React.useState<AiProviderType | null>(null);
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (providersQuery.data && !initialized.current) {
      setProvider(providersQuery.data.defaultProvider);
      initialized.current = true;
    }
  }, [providersQuery.data]);

  const handleFileSelect = (selectedFile: File) => {
    const hasPdfExtension = selectedFile.name.toLowerCase().endsWith(".pdf");
    if (selectedFile.type !== PDF_MIME_TYPE && !hasPdfExtension) {
      addToast({ title: "Ошибка", description: "Можно загружать только PDF-файлы", variant: "destructive" });
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      addToast({ title: "Ошибка", description: "Размер файла не должен превышать 10 MB", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
  };

  const selectedProvider = providersQuery.data?.providers.find((item) => item.id === provider);
  const canAnalyze = Boolean(file && provider && selectedProvider?.available && !isAnalyzing);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      addToast({ title: "Ошибка", description: "Пожалуйста, загрузите PDF-файл", variant: "destructive" });
      return;
    }
    if (!provider || !selectedProvider?.available) {
      addToast({ title: "Ошибка", description: "Выберите доступного AI-провайдера", variant: "destructive" });
      return;
    }
    await onAnalyze(file, provider);
  };

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Загрузка резюме</CardTitle>
          <CardDescription>Загрузите PDF-файл и выберите AI-провайдера</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="resume-file">PDF резюме</Label>
            <ResumeUpload file={file ? { file, preview: "", size: formatFileSize(file.size) } : null} onFileSelect={handleFileSelect} onFileRemove={() => setFile(null)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="provider">AI-провайдер</Label>
            {providersQuery.isPending ? (
              <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground"><Loader className="h-4 w-4" />Загружаем доступные провайдеры...</div>
            ) : providersQuery.isError ? (
              <div className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
                <p>Не удалось загрузить AI-провайдеры: {getUserFacingErrorMessage(providersQuery.error)}</p>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => providersQuery.refetch()}>Повторить</Button>
              </div>
            ) : (
              <ProviderSelect providers={providersQuery.data} value={provider} onChange={setProvider} />
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-2">
            <Button type="submit" className="w-full" disabled={!canAnalyze}>
              {isAnalyzing ? <><Loader className="mr-2 h-4 w-4" />Анализируем...</> : "Анализировать резюме"}
            </Button>
            {error && <p className="text-sm text-destructive">{getUserFacingErrorMessage(error)}</p>}
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}

export function ProviderSelect({ providers, value, onChange }: { providers: AiProvidersResponse; value: AiProviderType | null; onChange: (provider: AiProviderType) => void }) {
  return <select id="provider" value={value ?? ""} onChange={(event) => onChange(event.target.value as AiProviderType)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
    {providers.providers.map((item) => <option key={item.id} value={item.id} disabled={!item.available}>
      {AI_PROVIDER_LABELS[item.id]}{item.available ? "" : " — недоступен"}
    </option>)}
  </select>;
}
