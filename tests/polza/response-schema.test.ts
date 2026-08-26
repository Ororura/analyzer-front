import { describe, expect, it } from "vitest";
import { AiResumeAnalysisResponseSchema } from "@/lib/analysis/schema";
import { providerForModel, toProviderResponseSchema } from "@/lib/polza/response-schema";

const walk = (value: unknown, visit: (node: Record<string, unknown>) => void): void => {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visit));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  const node = value as Record<string, unknown>;
  visit(node);
  Object.values(node).forEach((item) => walk(item, visit));
};

describe("Gemini response schema adapter", () => {
  const schema = toProviderResponseSchema(AiResumeAnalysisResponseSchema, "gemini");

  it("inlines the root object instead of sending a top-level $ref", () => {
    expect(schema.$ref).toBeUndefined();
    expect(schema.type).toBe("object");
    expect(schema.properties).toBeTypeOf("object");
    expect(schema.required).toEqual(expect.arrayContaining(["basicAnalysis", "atsAnalysis"]));
  });

  it("contains the complete ATS schema at the root properties", () => {
    const properties = schema.properties as Record<string, Record<string, unknown>>;
    const atsProperties = properties.atsAnalysis.properties as Record<string, unknown>;
    expect(atsProperties).toHaveProperty("hhSearchMatch");
    expect(atsProperties).toHaveProperty("structuredFilters");
    expect(atsProperties).toHaveProperty("technologies");
  });

  it("contains no unresolved or undefined definitions", () => {
    walk(schema, (node) => {
      expect(node).not.toHaveProperty("$ref");
      expect(node).not.toHaveProperty("$defs");
      expect(node).not.toHaveProperty("definitions");
      expect(node).not.toHaveProperty("nullable");
    });
  });

  it("preserves enums, optional properties and converts nullable values", () => {
    const serialized = JSON.stringify(schema);
    expect(serialized).toContain('"enum":["low","medium","high"]');
    expect(serialized).toContain('"type":"null"');
    expect(serialized).toContain('"additionalProperties":false');
    expect(serialized).not.toContain('"minLength"');
  });

  it("selects the adapter from the Polza model namespace", () => {
    expect(providerForModel("google/gemini-2.5-pro")).toBe("gemini");
    expect(providerForModel("openai/gpt-5.2")).toBe("openai-compatible");
  });
});
