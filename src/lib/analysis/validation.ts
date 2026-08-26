import type { ZodIssue } from "zod";

export const formatValidationIssues = (issues: readonly ZodIssue[]): string[] =>
  issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`);

export const reportValidationIssues = (message: string, issues: readonly ZodIssue[]): string[] => {
  console.error(
    message,
    issues.map((issue) => ({
      path: issue.path.join(".") || "root",
      code: issue.code,
      message: issue.message,
      received: "received" in issue ? issue.received : undefined,
    })),
  );
  return formatValidationIssues(issues);
};
