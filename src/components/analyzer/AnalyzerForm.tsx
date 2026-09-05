import * as React from 'react';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ResumeUpload } from '@/components/resume-upload/ResumeUpload';
import { VacancySearch } from '@/components/vacancies/VacancySearch';
import { formatFileSize } from '@/lib/utils/helpers';
import { useToast } from '@/hooks/useToast';
import { useAiProvidersQuery } from '@/hooks/useAiProvidersQuery';
import { useVacancySelection } from '@/hooks/useVacancySelection';
import { AI_PROVIDER_LABELS } from '@/lib/ai/providers';
import { ANALYSIS_PROFILE_CONFIG, ANALYSIS_PROFILES } from '@/lib/analysis-profiles';
import { getUserFacingErrorMessage } from '@/lib/api/errors';
import { MAX_FILE_SIZE, PDF_MIME_TYPE } from '@/lib/constants';
import type { AiProviderType, AiProvidersResponse, AnalysisProfile } from '@/types/resume-analysis';
import type { VacancyAnalysisContext, VacancyAnalysisRequest, VacancySummary } from '@/types/vacancy';

interface AnalyzerFormProps {
  onAnalyze: (
    file: File,
    provider: AiProviderType,
    profile: AnalysisProfile,
    analysis?: VacancyAnalysisRequest,
    context?: VacancyAnalysisContext,
  ) => Promise<void>;
  isAnalyzing: boolean;
  error: Error | null;
}

export function AnalyzerForm({ onAnalyze, isAnalyzing, error }: AnalyzerFormProps) {
  const { addToast } = useToast();
  const providersQuery = useAiProvidersQuery();
  const [file, setFile] = React.useState<File | null>(null);
  const [provider, setProvider] = React.useState<AiProviderType | null>(null);
  const [profile, setProfile] = React.useState<AnalysisProfile>('JAVA_BACKEND');
  const [analysisSource, setAnalysisSource] = React.useState<'AUTO' | 'MANUAL'>('AUTO');
  const vacancySelection = useVacancySelection();
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (providersQuery.data && !initialized.current) {
      setProvider(providersQuery.data.defaultProvider);
      initialized.current = true;
    }
  }, [providersQuery.data]);

  const handleFileSelect = (selectedFile: File) => {
    const hasPdfExtension = selectedFile.name.toLowerCase().endsWith('.pdf');
    if (selectedFile.type !== PDF_MIME_TYPE && !hasPdfExtension) {
      addToast({ title: 'Ошибка', description: 'Можно загружать только PDF-файлы', variant: 'destructive' });
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      addToast({ title: 'Ошибка', description: 'Размер файла не должен превышать 10 MB', variant: 'destructive' });
      return;
    }
    setFile(selectedFile);
  };

  const handleProfileChange = (nextProfile: AnalysisProfile) => {
    setProfile(nextProfile);
    vacancySelection.clear();
  };

  const selectedProvider = providersQuery.data?.providers.find((item) => item.id === provider);
  const hasManualSelection =
    vacancySelection.selection.mode === 'ALL_MATCHING' || vacancySelection.selection.vacancyIds.length > 0;
  const canAnalyze = Boolean(
    file &&
    provider &&
    selectedProvider?.available &&
    !isAnalyzing &&
    (analysisSource === 'AUTO' || hasManualSelection),
  );

  const validateBase = (): boolean => {
    if (!file) {
      addToast({ title: 'Ошибка', description: 'Пожалуйста, загрузите PDF-файл', variant: 'destructive' });
      return false;
    }
    if (!provider || !selectedProvider?.available) {
      addToast({ title: 'Ошибка', description: 'Выберите доступного AI-провайдера', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const submitAnalysis = async () => {
    if (!validateBase() || !file || !provider) return;
    if (analysisSource === 'AUTO') {
      await onAnalyze(file, provider, profile, undefined, { mode: 'AUTO_MARKET' });
      return;
    }
    const selection = vacancySelection.selection;
    if (selection.mode === 'SELECTED' && selection.vacancyIds.length === 0) {
      addToast({
        title: 'Выберите вакансии',
        description: 'Для ручного анализа нужна хотя бы одна вакансия.',
        variant: 'destructive',
      });
      return;
    }
    if (selection.mode === 'SELECTED' && selection.vacancyIds.length > 200) {
      addToast({
        title: 'Слишком много вакансий',
        description: 'Для одного анализа можно использовать максимум 200 вакансий.',
        variant: 'destructive',
      });
      return;
    }
    await onAnalyze(file, provider, profile, { mode: 'SELECTED_VACANCIES', selection }, { mode: 'SELECTED_VACANCIES' });
  };

  const analyzeSingleVacancy = async (vacancy: VacancySummary) => {
    if (!validateBase() || !file || !provider) return;
    await onAnalyze(
      file,
      provider,
      profile,
      { mode: 'SINGLE_VACANCY', vacancyId: vacancy.id },
      { mode: 'SINGLE_VACANCY', vacancyTitle: vacancy.title, vacancyCompany: vacancy.company },
    );
  };

  return (
    <div aria-busy={isAnalyzing}>
      <Card>
        <CardHeader>
          <CardTitle>Загрузка резюме</CardTitle>
          <CardDescription>Загрузите PDF-файл и выберите AI-провайдера</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="resume-file">PDF резюме</Label>
            <ResumeUpload
              file={file ? { file, preview: '', size: formatFileSize(file.size) } : null}
              onFileSelect={handleFileSelect}
              onFileRemove={() => setFile(null)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="analysis-profile">Профиль анализа</Label>
            <ProfileSelect value={profile} onChange={handleProfileChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="provider">AI-провайдер</Label>
            {providersQuery.isPending ? (
              <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
                <Loader className="h-4 w-4" />
                Загружаем доступные провайдеры...
              </div>
            ) : providersQuery.isError ? (
              <div className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
                <p>Не удалось загрузить AI-провайдеры: {getUserFacingErrorMessage(providersQuery.error)}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => providersQuery.refetch()}
                >
                  Повторить
                </Button>
              </div>
            ) : (
              <ProviderSelect providers={providersQuery.data} value={provider} onChange={setProvider} />
            )}
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Источник анализа</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
              <input
                type="radio"
                name="analysis-source"
                value="AUTO"
                checked={analysisSource === 'AUTO'}
                onChange={() => setAnalysisSource('AUTO')}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block font-medium">Автоматический анализ рынка</span>
                <span className="block text-sm text-muted-foreground">
                  Прежний сценарий: рынок подбирается автоматически.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
              <input
                type="radio"
                name="analysis-source"
                value="MANUAL"
                checked={analysisSource === 'MANUAL'}
                onChange={() => setAnalysisSource('MANUAL')}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block font-medium">Выбрать вакансии вручную</span>
                <span className="block text-sm text-muted-foreground">
                  Найдите одну или несколько вакансий для точечного анализа.
                </span>
              </span>
            </label>
          </fieldset>
          {analysisSource === 'MANUAL' && (
            <VacancySearch
              key={profile}
              profile={profile}
              selection={vacancySelection}
              onAnalyzeSingle={(vacancy) => {
                void analyzeSingleVacancy(vacancy);
              }}
              isAnalyzing={isAnalyzing}
            />
          )}
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-2">
            <Button
              type="button"
              className="w-full"
              disabled={!canAnalyze}
              onClick={() => {
                void submitAnalysis();
              }}
              aria-describedby={isAnalyzing ? 'analysis-progress' : undefined}
            >
              {isAnalyzing ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  Анализируем резюме…
                </>
              ) : (
                'Анализировать резюме'
              )}
            </Button>
            {isAnalyzing && (
              <p
                id="analysis-progress"
                role="status"
                aria-live="polite"
                className="text-center text-sm text-muted-foreground"
              >
                Проверяем структуру, навыки и соответствие рынку. Это может занять несколько минут.
              </p>
            )}
            {error && (
              <p role="alert" aria-live="polite" className="text-sm text-destructive">
                {getUserFacingErrorMessage(error)}
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export function ProfileSelect({
  value,
  onChange,
}: {
  value: AnalysisProfile;
  onChange: (profile: AnalysisProfile) => void;
}) {
  return (
    <select
      id="analysis-profile"
      value={value}
      onChange={(event) => onChange(event.target.value as AnalysisProfile)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      {ANALYSIS_PROFILES.map((item) => (
        <option key={item} value={item}>
          {ANALYSIS_PROFILE_CONFIG[item].label}
        </option>
      ))}
    </select>
  );
}

export function ProviderSelect({
  providers,
  value,
  onChange,
}: {
  providers: AiProvidersResponse;
  value: AiProviderType | null;
  onChange: (provider: AiProviderType) => void;
}) {
  return (
    <select
      id="provider"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value as AiProviderType)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      {providers.providers.map((item) => (
        <option key={item.id} value={item.id} disabled={!item.available}>
          {AI_PROVIDER_LABELS[item.id]}
          {item.available ? '' : ' — недоступен'}
        </option>
      ))}
    </select>
  );
}
