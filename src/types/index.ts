export type ResumeFile = {
  file: File;
  preview: string;
  size: string;
};

export type HistoryEntry = {
  id: string;
  fileName: string;
  model: string;
  createdAt: string;
  result: string;
  atsResult?: string;
};

export type SkillAssessment = {
  name: string;
  score: number;
  progress: string;
};

export type AnalysisResult = {
  markdown: string;
  overallScore?: number;
  candidateLevel?: string;
  skills?: SkillAssessment[];
  problems?: string[];
  recommendations?: string[];
  finalVerdict?: {
   hrScreening?: 'Low' | 'Medium' | 'High';
    technicalInterview?: 'Low' | 'Medium' | 'High';
    summary?: string;
  };
};

export type PolzaApiResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
};

export type PolzaApiError = {
  error: {
    message: string;
    type: string;
    code: string;
  };
};
