import { useState } from "react";
import { analyzeResume } from "@/lib/analysis/analyze-resume";
import { loadVacancyMarket } from "@/lib/ats/load-vacancy-market";
import { saveApiKey } from "@/lib/utils/storage";
import { useToast } from "@/hooks/useToast";
import type { AtsAnalysisResult } from "@/types/ats";

export interface CurrentFile {
  file: File;
  preview: string;
  size: string;
}

interface RestoredAnalysis {
  result: string;
  model: string;
  atsResult: AtsAnalysisResult | null;
  file: File;
}

export function useResumeAnalysis() {
  const { addToast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState<CurrentFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisModel, setAnalysisModel] = useState("");
  const [atsResult, setAtsResult] = useState<AtsAnalysisResult | null>(null);

  const analyze = async (file: File, apiKey: string, model: string): Promise<void> => {
    setIsAnalyzing(true);

    setCurrentFile({
      file,
      preview: "",
      size: file.size.toString(),
    });

    setAnalysisModel(model);
    setAtsResult(null);

    try {
      const market = await loadVacancyMarket();

      const response = await analyzeResume(file, apiKey, model, market);

      saveApiKey(apiKey);

      setAnalysisResult(JSON.stringify(response.basicAnalysis));

      setAtsResult(response.atsAnalysis);

      if (market.source === "baseline" || market.warnings.length > 0) {
        addToast({
          title: "ATS-анализ выполнен с ограничениями",
          description: market.warnings.join("; ") || "Использован встроенный рыночный baseline",
        });
      }

      addToast({
        title: "Успех",
        description: "Резюме успешно проанализировано",
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";

      addToast({
        title: "Ошибка",
        description: `Не удалось выполнить анализ: ${message}`,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const restore = ({ result, model, atsResult: restoredAtsResult, file }: RestoredAnalysis) => {
    setAnalysisResult(result);
    setAnalysisModel(model);
    setAtsResult(restoredAtsResult);

    setCurrentFile({
      file,
      preview: "",
      size: "",
    });
  };

  return {
    analyze,
    restore,

    isAnalyzing,
    currentFile,
    analysisResult,
    analysisModel,
    atsResult,
  };
}
