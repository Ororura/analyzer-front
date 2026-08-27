import { z } from "zod";

export const PolzaApiResponseSchema = z
  .object({
    choices: z
      .array(
        z
          .object({
            message: z
              .object({
                content: z.string().refine((content) => content.trim().length > 0),
              })
              .passthrough(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

export const PolzaErrorResponseSchema = z
  .object({
    error: z
      .object({
        message: z.string().refine((message) => message.trim().length > 0),
      })
      .passthrough(),
  })
  .passthrough();

export type PolzaApiResponse = z.infer<typeof PolzaApiResponseSchema>;
export type PolzaErrorResponse = z.infer<typeof PolzaErrorResponseSchema>;
