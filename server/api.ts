import type { Request, Response } from "express";
import { Router } from "express";
import type { VacancySearchFilters } from "../src/types/vacancy.js";
import { HhError } from "./hh/errors.js";
import type { VacancyService } from "./hh/service.js";

export const createApiRouter = (service: VacancyService): Router => {
  const router = Router();
  router.get("/vacancies", (request, response) => handleVacancySearch(service, request, response));
  return router;
};

export const handleVacancySearch = async (
  service: VacancyService,
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const filters = parseQuery(request);
    response.json(await service.search(filters));
  } catch (error) {
    if (error instanceof RangeError)
      return void response.status(400).json({ code: "INVALID_QUERY", message: error.message });
    if (error instanceof HhError) {
      if (error.retryAfter) response.setHeader("Retry-After", error.retryAfter);
      return void response.status(error.status || 502).json({ code: error.code, message: error.message });
    }
    console.error("Vacancy endpoint failed", error);
    response.status(500).json({ code: "INTERNAL", message: "Не удалось загрузить вакансии" });
  }
};

const parseQuery = (request: Request): VacancySearchFilters => ({
  text: scalar(request.query.text),
  page: integer(request.query.page),
  perPage: integer(request.query.perPage),
  salary: integer(request.query.salary),
  location: scalar(request.query.location),
  experience: list(request.query.experience),
  employment: list(request.query.employment),
  schedule: list(request.query.schedule),
});

const scalar = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
const integer = (value: unknown): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^-?\d+$/.test(value))
    throw new RangeError("Числовой параметр имеет неверный формат");
  return Number(value);
};
const list = (value: unknown): string[] | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  throw new RangeError("Параметр списка имеет неверный формат");
};
