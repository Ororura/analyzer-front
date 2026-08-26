import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { handleVacancySearch } from "../../server/api";
import { HhError } from "../../server/hh/errors";
import type { VacancyService } from "../../server/hh/service";

interface ResponseState {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

const responseDouble = (): { response: Response; state: ResponseState } => {
  const state: ResponseState = { statusCode: 200, body: undefined, headers: {} };
  const response = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return this;
    },
  } as unknown as Response;
  return { response, state };
};

const requestDouble = (query: Request["query"]): Request => ({ query }) as Request;
const service = (search: VacancyService["search"]): VacancyService => ({ search, clearCache: vi.fn() });

describe("/api/vacancies", () => {
  it("returns a successful search result", async () => {
    const search = vi
      .fn()
      .mockResolvedValue({ items: [], pagination: { page: 0, pageSize: 20, hasNext: false }, warnings: [] });
    const { response, state } = responseDouble();
    await handleVacancySearch(service(search), requestDouble({ text: "Java" }), response);
    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ items: [] });
  });
  it("returns 400 for an invalid query before calling HH", async () => {
    const search = vi.fn();
    const { response, state } = responseDouble();
    await handleVacancySearch(service(search), requestDouble({ page: "wrong" }), response);
    expect(state.statusCode).toBe(400);
    expect(search).not.toHaveBeenCalled();
  });
  it("maps an HH upstream error", async () => {
    const search = vi.fn().mockRejectedValue(new HhError("UPSTREAM", "HH unavailable", 502));
    const { response, state } = responseDouble();
    await handleVacancySearch(service(search), requestDouble({}), response);
    expect(state.statusCode).toBe(502);
    expect(state.body).toMatchObject({ code: "UPSTREAM" });
  });
});
