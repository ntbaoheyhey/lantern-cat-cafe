import { defineConfig } from 'vitest/config';

export default defineConfig({
  // pnpm also runs the database and web suites. Unbounded battle-simulation workers
  // starve each other and time out otherwise deterministic tests on the shared host.
  test: { maxWorkers: 2 },
});
