import type { PGlite } from "@electric-sql/pglite";

/** The next UTC day at 10:00, safely after SQL defaults and away from game midnight. */
export function nextFixtureDayUtc(databaseMillis: number): number {
  const now = new Date(databaseMillis);
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 10);
}

/** Anchor injected test time to the database without changing its defaults or guards. */
export async function databaseFixtureClock(db: PGlite): Promise<number> {
  const { rows } = await db.query<{ millis: number }>("select extract(epoch from now()) * 1000 as millis");
  return nextFixtureDayUtc(Number(rows[0]!.millis));
}
