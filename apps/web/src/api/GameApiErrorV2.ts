import { ERROR_CODES_V2, type ForgeBlockV2, type GameApiErrorBodyV2, type GameApiErrorCodeV2, type StackId } from './GameApiV2';

/** Rejection of every GameApiV2 method, demo and server alike. Extra fields follow GameApiErrorBodyV2. */
export class GameApiErrorV2 extends Error {
  readonly code: GameApiErrorCodeV2;
  readonly reason: ForgeBlockV2 | undefined;
  /** `not_enough` only: the first missing stack (body field `stack`; Error.stack is the trace). */
  readonly stackId: StackId | undefined;
  readonly cooldownUntil: number | undefined;

  constructor(code: GameApiErrorCodeV2, extra: Omit<GameApiErrorBodyV2, 'error'> = {}, message: string = code) {
    super(message);
    this.name = 'GameApiErrorV2';
    this.code = code;
    this.reason = extra.reason;
    this.stackId = extra.stack;
    this.cooldownUntil = extra.cooldownUntil;
  }
}

export function isGameApiErrorCodeV2(value: unknown): value is GameApiErrorCodeV2 {
  return typeof value === 'string' && (ERROR_CODES_V2 as readonly string[]).includes(value);
}
