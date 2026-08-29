const ERROR_MESSAGES: Record<string, string> = {
  INVALID_FILE: "Не удалось обработать выбранный файл.",
  INVALID_QUERY: "Параметры запроса указаны некорректно.",
  PDF_TOO_LARGE: "PDF превышает допустимый размер.",
  RESUME_TEXT_TOO_LARGE: "Текст резюме превышает допустимый размер.",
  UNSUPPORTED_FILE_TYPE: "Поддерживаются только PDF-файлы.",
  PDF_PARSE_FAILED: "Не удалось прочитать PDF.",
  EMPTY_RESUME: "В PDF не найден текст для анализа.",
  AI_PROVIDER_FAILED: "AI-провайдер завершил анализ с ошибкой.",
  AI_INVALID_RESPONSE: "AI-провайдер вернул некорректный результат.",
  AI_PROVIDER_UNAVAILABLE: "Выбранный AI-провайдер сейчас недоступен.",
  AI_PROCESS_START_FAILED: "Codex CLI не удалось запустить на сервере.",
  AI_RATE_LIMITED: "AI-провайдер временно ограничил количество запросов.",
  AI_TIMEOUT: "Анализ занял слишком много времени.",
  ANALYSIS_FAILED: "Не удалось выполнить анализ резюме.",
  INTERNAL_ERROR: "На сервере произошла внутренняя ошибка.",
};

export const getApiErrorMessage = (code: string | undefined, fallback?: string): string =>
  (code && ERROR_MESSAGES[code]) || fallback || "Не удалось выполнить запрос к серверу.";

export const getUserFacingErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError) return getApiErrorMessage(error.code, error.message);
  if (error instanceof Error) return error.message;
  return "Неизвестная ошибка.";
};
import { ApiClientError } from "./client";
