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

export type { PolzaApiResponse } from "@/lib/polza/types";
