export const unusedPosters: readonly string[];
export function excludeUnusedPosters(): {
  name: string;
  apply: 'build';
  configResolved(config: {root: string; build: {outDir: string}}): void;
  closeBundle(): Promise<void>;
};
