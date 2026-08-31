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
  INVALID_RESPONSE: "Сервер анализа вернул ответ в неожиданном формате.",
};

export const getApiErrorMessage = (code: string | undefined, fallback?: string): string =>
  (code && ERROR_MESSAGES[code]) || fallback || "Не удалось выполнить запрос к серверу.";

export const getUserFacingErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError) {
    if (error.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
    if (error.status === 400) return "Проверьте выбранный PDF и параметры анализа.";
    if (error.status === 413) return "PDF превышает допустимый размер.";
    if (error.status === 415) return "Поддерживаются только PDF-файлы.";
    if (error.status === 422) return "Не удалось извлечь текст из PDF.";
    if (error.status === 429) return "Сервис временно ограничил количество запросов. Попробуйте позже.";
    if (error.status === 502) return "Сервис анализа вернул некорректный ответ. Попробуйте ещё раз.";
    if (error.status === 503) return "Сервис анализа временно недоступен.";
    if (error.status === 504) return "Анализ занял слишком много времени. Попробуйте ещё раз.";
    if (error.status === 404) return "Запрошенные данные не найдены.";
    if (error.status >= 500) return "Сервис временно недоступен. Попробуйте ещё раз.";
    return getApiErrorMessage(error.code);
  }
  if (error instanceof DOMException && error.name === "AbortError") return "Анализ был отменён или превысил допустимое время ожидания.";
  if (error instanceof TypeError) {
    return import.meta.env.DEV
      ? "Не удалось подключиться к серверу анализа. Проверьте, что backend запущен на localhost:8080."
      : "Не удалось подключиться к серверу анализа. Проверьте соединение и повторите попытку.";
  }
  if (error instanceof Error) return "Не удалось выполнить запрос к серверу.";
  return "Неизвестная ошибка.";
};
import { ApiClientError } from "./client";
