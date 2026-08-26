export type HhErrorCode =
  | 'TIMEOUT'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM'
  | 'ANTI_BOT'
  | 'LAYOUT_CHANGED';

export class HhError extends Error {
  constructor(
    readonly code: HhErrorCode,
    message: string,
    readonly status?: number,
    readonly retryAfter?: string,
  ) {
    super(message);
    this.name = 'HhError';
  }
}
