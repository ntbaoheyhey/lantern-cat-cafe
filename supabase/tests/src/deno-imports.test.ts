import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const run = (dir: string) => spawnSync(process.execPath, [join(dir, "scripts/check-deno-imports.mjs")], { encoding: "utf8" });

// BASE0 fixes the explicit-index map defect. Keep the original assertions active
// so an unresolved local edge now fails the normal suite rather than being expected.
it("every Edge Function resolves its transitive local imports using its own Deno map", () => {
  const result = run(root);
  expect(result.stderr).toBe("");
  expect(result.status).toBe(0);
  expect(result.stdout).toMatch(/functions clean/);
});

it("a scratch copy missing the api-contract v2 map key fails and names the exact edge", () => {
  const scratch = mkdtempSync(join(tmpdir(), "n2-deno-"));
  try {
    for (const dir of ["scripts", "packages", "supabase/functions"]) {
      cpSync(join(root, dir), join(scratch, dir), { recursive: true, filter: path => !path.includes("node_modules") });
    }
    const config = join(scratch, "supabase/functions/v2-claim/deno.json");
    const map = JSON.parse(readFileSync(config, "utf8"));
    delete map.imports["../../../packages/api-contract/src/v2"];
    writeFileSync(config, JSON.stringify(map));
    const result = run(scratch);
    expect(result.status).toBe(1);
    expect(result.stderr.split("\n")).toContain("v2-claim: packages/api-contract/src/index.ts -> ./v2");
  } finally { rmSync(scratch, { recursive: true, force: true }); }
});

it("does not exempt formerly unresolved explicit-index imports", () => {
  const result = run(root);
  expect(result.stderr.trim().split("\n").filter(Boolean)).toEqual([]);
});

it("walks aliases, type exports, dynamic imports and cycles without guessing extensions", () => {
  const scratch = mkdtempSync(join(tmpdir(), "n2-deno-graph-"));
  const put = (path: string, text: string) => {
    const full = join(scratch, path);
    mkdirSync(join(full, ".."), { recursive: true }); writeFileSync(full, text);
  };
  try {
    put("scripts/check-deno-imports.mjs", readFileSync(join(root, "scripts/check-deno-imports.mjs"), "utf8"));
    put("supabase/functions/example/deno.json", JSON.stringify({ imports: {
      "pkg": "../../../packages/example/index.ts",
      "../../../packages/example/leaf": "../../../packages/example/leaf.ts",
    } }));
    put("supabase/functions/example/index.ts", 'import "pkg"; // import "ignored"\n/* export * from "ignored" */');
    put("packages/example/index.ts", 'export type { T } from "./leaf"; const text = "import bogus from missing";');
    put("packages/example/leaf.ts", 'import "./index.ts"; import("./missing.ts");');
    expect(run(scratch).stderr.trim()).toBe("example: packages/example/leaf.ts -> ./missing.ts");
    put("packages/example/missing.ts", "export const ok = true;");
    expect(run(scratch).status).toBe(0);
    put("packages/example/leaf.ts", 'import "./missing";');
    expect(run(scratch).status).toBe(1);
  } finally { rmSync(scratch, { recursive: true, force: true }); }
});
