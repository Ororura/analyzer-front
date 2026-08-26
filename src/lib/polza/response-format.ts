import { AiResumeAnalysisResponseSchema } from "@/lib/analysis/schema";
import { providerForModel, toProviderResponseSchema } from "./response-schema";

export const responseFormat = (model: string) => ({
  type: "json_schema" as const,
  json_schema: {
    name: "resume_analysis",
    strict: true,
    schema: toProviderResponseSchema(AiResumeAnalysisResponseSchema, providerForModel(model)),
  },
});
