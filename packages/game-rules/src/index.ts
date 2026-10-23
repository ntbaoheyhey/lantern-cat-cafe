export const GAME_VERSION = '0.1.0';
export { CONFIG, type Config } from './config';
export { Rng, deriveSeed, type Seed } from './rng';
export * from './types';
export * from './rules';
export { simulateActivePlay, powerAfter } from './sim';
