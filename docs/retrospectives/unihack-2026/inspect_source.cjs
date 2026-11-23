// Parse each distinct JS/TS source and index every source blob from audit_history.py.
// Run from the repository root. No project modules are evaluated.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const {execFileSync} = require("node:child_process");
const ts = require(require.resolve("typescript", {paths: [path.resolve("apps/web")]}));
const [manifest, destination] = process.argv.slice(2);
if (!manifest || !destination) throw Error("Pass blob-inventory.jsonl.gz and an output directory.");
const rows = zlib.gunzipSync(fs.readFileSync(manifest)).toString("utf8").trimEnd().split("\n")
  .map(line => JSON.parse(line)).filter(row => row[2] === "source");
const sourceKinds = {ts: ts.ScriptKind.TS, mts: ts.ScriptKind.TS, cts: ts.ScriptKind.TS,
  tsx: ts.ScriptKind.TSX, js: ts.ScriptKind.JS, mjs: ts.ScriptKind.JS, cjs: ts.ScriptKind.JS, jsx: ts.ScriptKind.JSX};
const signatures = {
  characterMedia: ["VideoTexture", "requestVideoFrameCallback", "DesignerVideoMedia"],
  sceneAnimation: ["AnimationMixer", "SpineActor", "AnimationState", "rootPose", "requestAnimationFrame"],
  assetCatalogues: ["import.meta.glob", "lookPortrait(", "portraitProps", "assetManifest"],
  clientPersistence: ["localStorage", "sessionStorage", "indexedDB"],
  buildSwitches: ["import.meta.env", "VITE_CHAIN_", "VITE_GAME_"],
  chainSettlement: ["balanceOfBatch", "mintBossReward", "getTransactionReceipt", "EIP712", "ERC1155"],
  seededRules: ["deriveSeed(", "new Rng(", "ECONOMY_V3", "runBattle("],
  backendAuthority: ["Deno.serve(", "createClient(", "SECURITY DEFINER", "security definer"],
  testHarness: ["describe(", "test(", "it(", "chromium.launch(", "Test is "]
};
const index = [], families = {}, byExtension = {};
let parsed = 0, diagnostics = 0, statements = 0, imports = 0;
function scan(file, body) {
  const [oid, name, , bytes, lines] = file;
  const content = body.toString("utf8");
  const ext = path.extname(name).slice(1).toLowerCase();
  byExtension[ext || "(none)"] = (byExtension[ext || "(none)"] || 0) + 1;
  const tags = Object.keys(signatures).filter(key => signatures[key].some(term => content.includes(term)));
  for (const key of tags) families[key] = (families[key] || 0) + 1;
  const vites = [...new Set(content.match(/\bVITE_[A-Z][A-Z0-9_]{1,90}\b/g) || [])].sort();
  const row = {oid, path: name, bytes, lines, tags};
  if (vites.length) row.viteIdentifiers = vites;
  if (Object.hasOwn(sourceKinds, ext)) {
    const ast = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, false, sourceKinds[ext]);
    const deps = ast.statements.filter(ts.isImportDeclaration).length;
    row.ast = {statements: ast.statements.length, imports: deps, syntaxDiagnostics: ast.parseDiagnostics.length};
    parsed++; statements += ast.statements.length; imports += deps;
    if (ast.parseDiagnostics.length) diagnostics++;
  }
  index.push(row);
}
function inspectBatch(batch, expectedSize) {
  const stream = execFileSync("git", ["cat-file", "--batch"], {
    input: batch.map(row => row[0]).join("\n") + "\n", maxBuffer: expectedSize + batch.length * 128 + 1024
  });
  let offset = 0;
  for (const row of batch) {
    const eol = stream.indexOf(10, offset);
    const header = stream.toString("ascii", offset, eol);
    if (header !== row[0] + " blob " + row[3]) throw Error("Unexpected Git record: " + row[0]);
    scan(row, stream.subarray(eol + 1, eol + 1 + row[3]));
    offset = eol + row[3] + 2;
  }
  if (offset !== stream.length) throw Error("Incomplete Git batch");
}
let batch = [], total = 0;
for (const row of rows) {
  if (batch.length && (total + row[3] > 8 * 1024 * 1024 || batch.length >= 40)) {
    inspectBatch(batch, total); batch = []; total = 0;
  }
  batch.push(row); total += row[3];
}
if (batch.length) inspectBatch(batch, total);
fs.writeFileSync(path.join(destination, "code-index.jsonl.gz"),
  zlib.gzipSync(index.map(row => JSON.stringify(row)).join("\n") + "\n"));
const summary = {sourceBlobs: index.length, parser: "typescript " + ts.version, jsTsParsed: parsed,
  jsTsWithSyntaxDiagnostics: diagnostics, topLevelStatementsAcrossVersions: statements, staticImportsAcrossVersions: imports,
  sourceVersionsByExtension: byExtension, nonexclusiveFamiliesByLiteral: families};
fs.writeFileSync(path.join(destination, "code-summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary));
