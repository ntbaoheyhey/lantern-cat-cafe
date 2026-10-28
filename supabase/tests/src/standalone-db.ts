import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "../../migrations");

export type Role = "anon" | "authenticated" | "service_role";

/** A fresh PGlite with the Supabase stubs and every migration applied (slow: about 3 s). */
export async function buildMigratedDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(join(here, "../sql/bootstrap.sql"), "utf8"));
  for (const f of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
  }
  return db;
}

/** Run statements as a role with the given JWT claims, always resetting afterwards. */
export async function as<T>(db: PGlite, role: Role, claims: object | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims ? JSON.stringify(claims) : ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.exec("reset request.jwt.claims");
  }
}


/** Restore a throwaway snapshot without a filesystem or a database connection string. */
export async function restoreDb(snapshot: Blob): Promise<PGlite> {
  const db = new PGlite({ loadDataDir: snapshot });
  await db.waitReady;
  return db;
}
