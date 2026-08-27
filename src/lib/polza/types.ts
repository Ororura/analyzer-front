import type { responseFormat } from "./response-format";

export interface SystemMessage {
  role: "system";
  content: string;
}

export interface UserTextPart {
  type: "text";
  text: string;
}

export interface UserFilePart {
  type: "file";
  file: {
    filename: string;
    file_data: string;
  };
}

export interface UserTextMessage {
  role: "user";
  content: string;
}

export interface UserMultimodalMessage {
  role: "user";
  content: Array<UserTextPart | UserFilePart>;
}

export type CompletionMessage = SystemMessage | UserTextMessage | UserMultimodalMessage;

export interface FileParserPlugin {
  id: "file-parser";
  pdf: {
    engine: "mistral-ocr";
  };
}

export interface CompletionRequest {
  model: string;
  messages: CompletionMessage[];
  response_format: ReturnType<typeof responseFormat>;
  temperature: number;
  plugins?: FileParserPlugin[];
}

export type { PolzaApiResponse, PolzaErrorResponse } from "./schema";
