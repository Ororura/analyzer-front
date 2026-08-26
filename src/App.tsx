import { useState } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { AnalyzerForm } from "@/components/analyzer/AnalyzerForm";
import { ResultDisplay } from "@/components/result/ResultDisplay";
import { EmptyResult } from "@/components/result/EmptyResult";
import { MarketAnalysis } from "@/components/market/MarketAnalysis";
import { HistoryView } from "@/components/history/HistoryView";

import { useResumeAnalysis } from "@/hooks/useResumeAnalysis";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { useToast } from "@/hooks/useToast";

import type { HistoryEntry } from "@/types";

type AppTab = "analyze" | "result" | "market" | "history";

function App() {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<AppTab>("analyze");

  const analysis = useResumeAnalysis();
  const analysisHistory = useAnalysisHistory();

  const handleAnalyze = async (file: File, apiKey: string, model: string) => {
    try {
      await analysis.analyze(file, apiKey, model);

      setActiveTab("result");
    } catch {
      /* empty */
    }
  };

  const handleHistoryItemClick = (entry: HistoryEntry) => {
    const restored = analysisHistory.restore(entry);

    analysis.restore(restored);

    setActiveTab("result");
  };

  const handleClearHistory = () => {
    analysisHistory.clear();

    addToast({
      title: "Очищено",
      description: "История анализа очищена",
      variant: "success",
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "analyze":
        return <AnalyzerForm onAnalyze={handleAnalyze} isAnalyzing={analysis.isAnalyzing} />;

      case "result":
        if (!analysis.analysisResult || !analysis.currentFile) {
          return <EmptyResult onBack={() => setActiveTab("analyze")} />;
        }

        return (
          <ResultDisplay
            result={analysis.analysisResult}
            file={analysis.currentFile.file}
            model={analysis.analysisModel}
            atsResult={analysis.atsResult ?? undefined}
          />
        );

      case "market":
        return <MarketAnalysis />;

      case "history":
        return (
          <HistoryView
            history={analysisHistory.history}
            onEntryClick={handleHistoryItemClick}
            onAnalyzeClick={() => setActiveTab("analyze")}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as AppTab)}
        history={analysisHistory.history}
        onHistoryItemClick={handleHistoryItemClick}
        onClearHistory={handleClearHistory}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">{renderContent()}</div>
      </main>
    </div>
  );
}

export default App;
