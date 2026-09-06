import { useState } from 'react';

import { Sidebar, type SidebarTab } from '@/components/layout/Sidebar';
import { AnalyzerForm } from '@/components/analyzer/AnalyzerForm';
import { ResultDisplay } from '@/components/result/ResultDisplay';
import { AnalysisSkeleton } from '@/components/result/OverviewCards';
import { Button } from '@/components/ui/button';
import { getUserFacingErrorMessage } from '@/lib/api/errors';
import { EmptyResult } from '@/components/result/EmptyResult';
import { MarketAnalysis } from '@/components/market/MarketAnalysis';
import { HistoryView } from '@/components/history/HistoryView';
import { ProfilesPage } from '@/components/profiles/ProfilesPage';

import { useResumeAnalysis } from '@/hooks/useResumeAnalysis';
import { useAnalysisHistory } from '@/hooks/useAnalysisHistory';
import { useToast } from '@/hooks/useToast';

import type { HistoryEntry } from '@/types';
import type { AiProviderType, AnalysisProfile } from '@/types/resume-analysis';
import type { VacancyAnalysisContext, VacancyAnalysisRequest } from '@/types/vacancy';

function App() {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<SidebarTab>('result');
  const [restorationKey, setRestorationKey] = useState(0);
  const [profilesDirty, setProfilesDirty] = useState(false);
  const [profileEditRequest, setProfileEditRequest] = useState<string>();

  const analysis = useResumeAnalysis();
  const analysisHistory = useAnalysisHistory();

  const [lastRequest, setLastRequest] = useState<{
    file: File;
    provider: AiProviderType;
    profile: AnalysisProfile;
    vacancyAnalysis?: VacancyAnalysisRequest;
    context?: VacancyAnalysisContext;
    profileId?: string;
  } | null>(null);
  const handleAnalyze = async (
    file: File,
    provider: AiProviderType,
    profile: AnalysisProfile,
    vacancyAnalysis?: VacancyAnalysisRequest,
    context?: VacancyAnalysisContext,
    profileId?: string,
  ) => {
    setLastRequest({ file, provider, profile, vacancyAnalysis, context, profileId });
    setActiveTab('result');
    try {
      await analysis.analyze(file, provider, profile, vacancyAnalysis, context, profileId);
    } catch {
      /* The dashboard and toast display the user-facing error. */
    }
  };
  const retryAnalysis = () => {
    const request = lastRequest;
    if (request)
      void handleAnalyze(request.file, request.provider, request.profile, request.vacancyAnalysis, request.context, request.profileId);
    else setActiveTab('analyze');
  };

  const handleHistoryItemClick = (entry: HistoryEntry) => {
    setLastRequest(null);
    setRestorationKey((value) => value + 1);
    const restored = analysisHistory.restore(entry);

    analysis.restore(restored);

    setActiveTab('result');
  };

  const handleClearHistory = () => {
    analysisHistory.clear();

    addToast({
      title: 'Очищено',
      description: 'История анализа очищена',
      variant: 'success',
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analyze':
        return null;

      case 'result':
        if (analysis.isAnalyzing)
          return (
            <>
              <header className="empty-header">
                <h1>Анализ резюме</h1>
                <p>Готовим ваш отчёт</p>
              </header>
              <AnalysisSkeleton />
            </>
          );
        if (analysis.error)
          return (
            <div className="glass-card analysis-error" role="alert">
              <h1>Не удалось обработать анализ</h1>
              <p>{getUserFacingErrorMessage(analysis.error)}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={retryAnalysis}>Повторить</Button>
                <Button variant="outline" onClick={() => setActiveTab('analyze')}>
                  Изменить параметры
                </Button>
              </div>
            </div>
          );
        if ((!analysis.result && !analysis.legacyMarkdown) || !analysis.currentFile) {
          return <EmptyResult onBack={() => setActiveTab('analyze')} />;
        }

        return (
          <ResultDisplay
            key={`${restorationKey}:${analysis.result?.metadata.generatedAt ?? analysis.legacyMarkdown}`}
            result={analysis.result}
            legacyMarkdown={analysis.legacyMarkdown}
            file={analysis.currentFile}
            analysisContext={analysis.analysisContext}
            analysisRun={analysis.analysisRun}
            onSave={analysisHistory.save}
            onUpload={() => setActiveTab('analyze')}
            onRefresh={lastRequest ? retryAnalysis : undefined}
            onVacancies={() => setActiveTab('market')}
            historyContent={
              <HistoryView
                history={analysisHistory.history}
                onEntryClick={handleHistoryItemClick}
                onAnalyzeClick={() => setActiveTab('analyze')}
              />
            }
          />
        );

      case 'market':
        return <MarketAnalysis />;

      case 'profiles':
        return (
          <ProfilesPage
            key={profileEditRequest ?? 'profiles'}
            initialEditId={profileEditRequest}
            onDirtyChange={setProfilesDirty}
          />
        );

      case 'history':
        return (
          <HistoryView
            history={analysisHistory.history}
            onEntryClick={handleHistoryItemClick}
            onAnalyzeClick={() => setActiveTab('analyze')}
          />
        );

      default:
        return null;
    }
  };

  const navigate = (tab: SidebarTab) => {
    if (
      activeTab === 'profiles' &&
      tab !== 'profiles' &&
      profilesDirty &&
      !window.confirm('Есть несохранённые изменения. Уйти без сохранения?')
    )
      return;
    if (tab !== 'profiles') setProfileEditRequest(undefined);
    setActiveTab(tab);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        К содержимому
      </a>
      <Sidebar
        activeTab={activeTab}
        onTabChange={navigate}
        history={analysisHistory.history}
        onHistoryItemClick={handleHistoryItemClick}
        onClearHistory={handleClearHistory}
      />

      <main className="app-main" id="main-content">
        <div className="app-content">
          {renderContent()}
          <div hidden={activeTab !== 'analyze'} className="upload-page">
            <header className="empty-header">
              <h1>Загрузите резюме для анализа</h1>
              <p>Мы сравним навыки, опыт и структуру резюме с актуальными требованиями рынка.</p>
            </header>
            <AnalyzerForm
              onAnalyze={handleAnalyze}
              isAnalyzing={analysis.isAnalyzing}
              error={analysis.error}
              onManageProfiles={() => {
                setProfileEditRequest(undefined);
                setActiveTab('profiles');
              }}
              onEditProfile={(id) => {
                setProfileEditRequest(id);
                setActiveTab('profiles');
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
