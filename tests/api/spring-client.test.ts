import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { createApiUrl, getApiJson } from "@/lib/api/client";
import { fetchVacancies, VacancyClientError } from "@/lib/vacancies/client";
import { server } from "../msw/server";

const API_URL = "http://localhost:8080";

describe("Spring API client", () => {
  it("uses VITE_API_URL fallback for Spring endpoints", () => {
    expect(createApiUrl("/api/health").toString()).toBe(`${API_URL}/api/health`);
  });

  it("serializes vacancy defaults and arrays as repeated query parameters", async () => {
    server.use(
      http.get(`${API_URL}/api/vacancies`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("text")).toBe("Java Backend Developer");
        expect(params.get("page")).toBe("0");
        expect(params.get("perPage")).toBe("20");
        expect(params.getAll("experience")).toEqual(["noExperience", "between1And3"]);
        expect(params.getAll("employment")).toEqual(["full"]);
        expect(params.getAll("schedule")).toEqual(["remote", "flexible"]);
        expect(params.get("salary")).toBe("150000");
        expect(params.get("location")).toBe("Москва");
        return HttpResponse.json({ items: [], pagination: { page: 0 } });
      }),
    );

    await expect(fetchVacancies({
      experience: ["noExperience", "between1And3"],
      employment: ["full"],
      schedule: ["remote", "flexible"],
      salary: 150000,
      location: "Москва",
    })).resolves.toMatchObject({ items: [], pagination: { page: 0 } });
  });

  it("accepts optional fields in Spring responses", async () => {
    server.use(
      http.get(`${API_URL}/api/vacancies`, () => HttpResponse.json({})),
    );

    await expect(fetchVacancies()).resolves.toEqual({});
  });

  it("surfaces structured Spring errors with their status", async () => {
    server.use(
      http.get(`${API_URL}/api/vacancies`, () =>
        HttpResponse.json({ error: { message: "Invalid filters" } }, { status: 400 })),
    );

    await expect(fetchVacancies()).rejects.toMatchObject<VacancyClientError>({
      message: "Invalid filters",
      status: 400,
    });
  });

  it("rejects successful responses that are not JSON", async () => {
    server.use(http.get(`${API_URL}/api/health`, () => new HttpResponse("ok")));

    await expect(getApiJson("/api/health")).rejects.toMatchObject({
      message: "Backend returned an invalid JSON response",
      status: 200,
    });
  });
});
