import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestProject } from "vitest/node";
import { buildMigratedDb } from "./src/game-db.ts";

// Migrating a fresh PGlite takes about 3 s alone and much longer when 12 test files do it at once
// (it used to trip the 10 s hook timeout under load). Do it once here, dump the data directory, and
// let every file start from that copy (about 0.5 s). Any migration error fails the whole run here.
export default async function setup(project: TestProject) {
  const dir = mkdtempSync(join(tmpdir(), "taskbar-hero-pglite-"));
  const db = await buildMigratedDb();
  const file = join(dir, "template.tar");
  writeFileSync(file, Buffer.from(await (await db.dumpDataDir("none")).arrayBuffer()));
  await db.close();
  project.provide("pgliteTemplate", file);
  return () => rmSync(dir, { recursive: true, force: true });
}
