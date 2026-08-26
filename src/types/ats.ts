import type { z } from "zod";
import type {
  AtsAnalysisResultSchema,
  BasicAnalysisSchema,
  FilterAssessmentSchema,
  ResumeAnalysisResultSchema,
  TechnologyAssessmentSchema,
} from "@/lib/analysis/schema";

export type FilterAssessment = z.infer<typeof FilterAssessmentSchema>;
export type TechnologyAssessment = z.infer<typeof TechnologyAssessmentSchema>;
export type AtsAnalysisResult = z.infer<typeof AtsAnalysisResultSchema>;
export type BasicAnalysis = z.infer<typeof BasicAnalysisSchema>;
export type ResumeAnalysisResult = z.infer<typeof ResumeAnalysisResultSchema>;
