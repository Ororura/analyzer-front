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
  INVALID_SELECTION: "Проверьте выбранные вакансии и повторите анализ.",
  SELECTION_TOO_LARGE: "Выбрано слишком много вакансий. Максимум — 200.",
  VACANCY_NOT_FOUND: "Вакансия больше недоступна.",
  NOT_FOUND: "Вакансия больше недоступна.",
  VACANCY_RATE_LIMITED: "Сервис вакансий временно ограничил количество запросов.",
  RATE_LIMITED: "Сервис вакансий временно ограничил количество запросов.",
  VACANCY_PROVIDER_TIMEOUT: "Сервис вакансий не ответил вовремя. Попробуйте ещё раз.",
  TIMEOUT: "Сервис вакансий не ответил вовремя. Попробуйте ещё раз.",
  VACANCY_PROVIDER_FAILED: "Сервис вакансий временно недоступен.",
  UPSTREAM_ERROR: "Сервис вакансий временно недоступен.",
  ANALYSIS_FAILED: "Не удалось выполнить анализ резюме.",
  INTERNAL_ERROR: "На сервере произошла внутренняя ошибка.",
};

export const getApiErrorMessage = (code: string | undefined, fallback?: string): string =>
  (code && ERROR_MESSAGES[code]) || fallback || "Не удалось выполнить запрос к серверу.";

export const getUserFacingErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError) {
    if (error.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
    if (error.status === 404) return "Вакансия больше недоступна.";
    if (error.status === 429) return "Сервис вакансий временно ограничил количество запросов.";
    if (error.status >= 500) return "Сервис временно недоступен. Попробуйте ещё раз.";
    return getApiErrorMessage(error.code, error.message);
  }
  if (error instanceof TypeError) return "Не удалось подключиться к серверу. Проверьте соединение и повторите попытку.";
  if (error instanceof Error) return error.message || "Не удалось выполнить запрос к серверу.";
  return "Неизвестная ошибка.";
};
import { ApiClientError } from "./client";
