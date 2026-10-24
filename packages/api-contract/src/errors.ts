/** Error codes a call can reject with (`GameApiError.code`), in the order the docs list them. */
export const ERROR_CODES = [
  'unauthenticated',
  'not_owner',
  'not_found',
  'rate_limited',
  'no_attempts_left',
  'forge_blocked',
  'mint_not_confirmed',
  'not_enough_gold',
  'max_level',
  'server_error',
] as const;

export type GameApiErrorCode = (typeof ERROR_CODES)[number];

/** The HTTP status the Edge Functions send for each error code (docs/api.md). */
export const HTTP_STATUS: Record<GameApiErrorCode, number> = {
  unauthenticated: 401,
  not_owner: 403,
  not_found: 404,
  rate_limited: 429,
  no_attempts_left: 409,
  forge_blocked: 409,
  mint_not_confirmed: 409,
  not_enough_gold: 409,
  max_level: 409,
  server_error: 500,
};

export function isGameApiErrorCode(code: unknown): code is GameApiErrorCode {
  return (ERROR_CODES as readonly unknown[]).includes(code);
}

export class GameApiError extends Error {
  constructor(
    readonly code: GameApiErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = 'GameApiError';
  }
}
