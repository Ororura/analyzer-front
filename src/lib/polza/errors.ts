export class PolzaApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PolzaApiError";
  }
}

export class AnalysisResponseError extends Error {
  readonly code = "AI_RESPONSE_VALIDATION_ERROR";

  constructor(
    message: string,
    readonly issues: string[],
  ) {
    super(message);
    this.name = "AnalysisResponseError";
  }
}
