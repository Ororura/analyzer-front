import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export type StructuredOutputProvider = "gemini" | "openai-compatible";
export type ProviderResponseSchema = Record<string, unknown>;

const GEMINI_SCHEMA_KEYS = new Set([
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
]);

export const providerForModel = (model: string): StructuredOutputProvider =>
  model.toLowerCase().startsWith("google/") || model.toLowerCase().includes("gemini") ? "gemini" : "openai-compatible";

export const toProviderResponseSchema = (
  schema: z.ZodTypeAny,
  provider: StructuredOutputProvider,
): ProviderResponseSchema => {
  const generated = zodToJsonSchema(schema, {
    name: "resume_analysis",
    target: "openApi3",
    $refStrategy: "none",
  }) as ProviderResponseSchema;

  if (provider !== "gemini") return generated;

  const inlined = inlineLocalReferences(generated, generated, new Set());
  const compatible = sanitizeGeminiSchema(inlined);
  if (compatible.type !== "object" || !isRecord(compatible.properties) || !Array.isArray(compatible.required)) {
    throw new Error("Gemini response schema must have an object root with properties and required");
  }
  return compatible;
};

const inlineLocalReferences = (value: unknown, document: ProviderResponseSchema, resolving: Set<string>): unknown => {
  if (Array.isArray(value)) return value.map((item) => inlineLocalReferences(item, document, resolving));
  if (!isRecord(value)) return value;

  if (typeof value.$ref === "string") {
    const reference = value.$ref;
    if (!reference.startsWith("#/")) throw new Error(`External schema reference is not supported: ${reference}`);
    if (resolving.has(reference)) throw new Error(`Recursive Gemini schema reference is not supported: ${reference}`);
    const target = resolveJsonPointer(document, reference);
    return inlineLocalReferences(target, document, new Set([...resolving, reference]));
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !["$defs", "definitions", "$schema", "$id"].includes(key))
      .map(([key, item]) => [key, inlineLocalReferences(item, document, resolving)]),
  );
};

const resolveJsonPointer = (document: ProviderResponseSchema, reference: string): unknown => {
  let current: unknown = document;
  for (const encodedPart of reference.slice(2).split("/")) {
    const part = encodedPart.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isRecord(current) || !(part in current)) throw new Error(`Reference to undefined schema: ${reference}`);
    current = current[part];
  }
  return current;
};

const sanitizeGeminiSchema = (value: unknown): ProviderResponseSchema => {
  if (!isRecord(value)) throw new Error("Gemini schema node must be an object");
  const nullable = value.nullable === true;
  const result: ProviderResponseSchema = {};

  for (const [key, item] of Object.entries(value)) {
    if (!GEMINI_SCHEMA_KEYS.has(key)) continue;
    if (key === "properties" && isRecord(item)) {
      result.properties = Object.fromEntries(
        Object.entries(item).map(([name, property]) => [name, sanitizeGeminiSchema(property)]),
      );
    } else if (key === "items" && isRecord(item)) {
      result.items = sanitizeGeminiSchema(item);
    } else if (["prefixItems", "anyOf", "oneOf"].includes(key) && Array.isArray(item)) {
      result[key] = item.map(sanitizeGeminiSchema);
    } else if (key === "additionalProperties" && isRecord(item)) {
      result.additionalProperties = sanitizeGeminiSchema(item);
    } else {
      result[key] = item;
    }
  }

  if (!nullable) return result;
  return { anyOf: [result, { type: "null" }] };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
