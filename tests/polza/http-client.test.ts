import { afterEach, describe, expect, it, vi } from "vitest";
import { requestCompletion } from "@/lib/polza/client";
import { PolzaApiError } from "@/lib/polza/errors";
import type { CompletionRequest } from "@/lib/polza/types";

const request: CompletionRequest = {
  model: "test-model",
  messages: [{ role: "system", content: "test" }],
  response_format: {
    type: "json_schema",
    json_schema: { name: "resume_analysis", strict: true, schema: {} },
  },
  temperature: 0,
};

const jsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("Polza HTTP client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns content from a valid completion", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "completion", role: "assistant" } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestCompletion("secret", request)).resolves.toBe("completion");

    const sentRequest = fetchMock.mock.calls[0][0] as Request;
    expect(sentRequest.headers.get("Authorization")).toBe("Bearer secret");
    expect(sentRequest.headers.get("Content-Type")).toBe("application/json");
  });

  it("maps HTTP 400 to PolzaApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: {} }, 400)));

    await expect(requestCompletion("secret", request)).rejects.toMatchObject({
      name: "PolzaApiError",
      message: "Polza AI вернул ошибку",
      status: 400,
    });
  });

  it("uses the provider error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: { message: "Invalid API key" } }, 401)));

    await expect(requestCompletion("secret", request)).rejects.toMatchObject({
      message: "Invalid API key",
      status: 401,
    });
  });

  it.each([
    ["response without choices", {}],
    ["response without message.content", { choices: [{ message: {} }] }],
    ["response with empty message.content", { choices: [{ message: { content: "   " } }] }],
  ])("rejects %s", async (_caseName, payload) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(payload)));

    await expect(requestCompletion("secret", request)).rejects.toEqual(
      expect.objectContaining<Partial<PolzaApiError>>({
        name: "PolzaApiError",
        message: "AI response does not contain message.content",
        status: 200,
      }),
    );
  });

  it("rejects malformed provider JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{invalid", { headers: { "Content-Type": "application/json" } })),
    );

    await expect(requestCompletion("secret", request)).rejects.toMatchObject({
      name: "PolzaApiError",
      message: "Polza AI вернул некорректный ответ",
      status: 200,
    });
  });
});
