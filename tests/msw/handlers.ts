import { http, HttpResponse } from "msw";

export const POLZA_COMPLETIONS_URL = "https://polza.ai/api/v1/chat/completions";
export const VACANCIES_URL = "http://localhost:8080/api/vacancies";
export const VACANCY_MARKET_URL = "http://localhost:8080/api/vacancy-market";

export const polzaCompletionHandler = (content: string) =>
  http.post(POLZA_COMPLETIONS_URL, () =>
    HttpResponse.json({
      id: "completion-1",
      choices: [{ message: { role: "assistant", content } }],
    }),
  );

export const polzaErrorHandler = (message: string, status = 400) =>
  http.post(POLZA_COMPLETIONS_URL, () => HttpResponse.json({ error: { message } }, { status }));
