#!/usr/bin/env node
// READ-ONLY token audit of ~/.claude/projects/**/*.jsonl for the last N days (default 7).
// Prints ONLY aggregates (numbers, tool names, project-folder labels). Never prints log text.
// Usage: node token-audit.mjs [days]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DAYS = Number(process.argv[2] || 7);
const ROOT = path.join(os.homedir(), '.claude', 'projects');
const since = Date.now() - DAYS * 864e5;

// Effective-cost weights relative to a plain input token.
const W = { in: 1, out: 5, cw: 1.25, cr: 0.1 };
const LONG_CTX = 150_000;

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.jsonl') && fs.statSync(p).mtimeMs >= since) files.push(p);
  }
})(ROOT);

const tot = { in: 0, out: 0, cw: 0, cr: 0, eff: 0 };
const side = { eff: 0, turns: 0 };
const longCtx = { eff: 0, turns: 0 };
const toolRes = {};          // tool name -> est tokens of results
let toolResAll = 0;
const readNoLimit = { n: 0, tok: 0 };
const agentLaunches = { n: 0 };
const sessions = new Map();  // file -> {min,max,eff,maxCtx,proj}
const projEff = {};

const eff = (u) =>
  (u.input_tokens || 0) * W.in + (u.output_tokens || 0) * W.out +
  (u.cache_creation_input_tokens || 0) * W.cw + (u.cache_read_input_tokens || 0) * W.cr;
const sizeOf = (c) => {
  if (typeof c === 'string') return c.length;
  if (Array.isArray(c)) return c.reduce((a, b) => a + (b && b.text ? b.text.length : 0), 0);
  return 0;
};

for (const f of files) {
  const proj = path.relative(ROOT, f).split(path.sep)[0].replace(/^-Users-[^-]+-?/, '') || 'home';
  const s = { min: Infinity, max: 0, eff: 0, maxCtx: 0, proj };
  const idToTool = new Map();
  const isSub = f.includes(`${path.sep}subagents${path.sep}`);
  let lines;
  try { lines = fs.readFileSync(f, 'utf8').split('\n'); } catch { continue; }
  for (const line of lines) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const t = o.timestamp ? Date.parse(o.timestamp) : NaN;
    if (!isNaN(t)) { if (t < since) continue; s.min = Math.min(s.min, t); s.max = Math.max(s.max, t); }
    const m = o.message;
    if (!m) continue;
    if (o.type === 'assistant' && m.usage) {
      const u = m.usage, e = eff(u);
      tot.in += u.input_tokens || 0; tot.out += u.output_tokens || 0;
      tot.cw += u.cache_creation_input_tokens || 0; tot.cr += u.cache_read_input_tokens || 0;
      tot.eff += e; s.eff += e; projEff[proj] = (projEff[proj] || 0) + e;
      const ctx = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
      s.maxCtx = Math.max(s.maxCtx, ctx);
      if (o.isSidechain || isSub) { side.eff += e; side.turns++; }
      if (ctx > LONG_CTX) { longCtx.eff += e; longCtx.turns++; }
      if (Array.isArray(m.content)) for (const b of m.content) if (b.type === 'tool_use') {
        idToTool.set(b.id, b.name);
        if (b.name === 'Agent' || b.name === 'Task') agentLaunches.n++;
        if (b.name === 'Read' && b.input && b.input.limit == null) readNoLimit.n++;
      }
    } else if (o.type === 'user' && Array.isArray(m.content)) {
      for (const b of m.content) if (b.type === 'tool_result') {
        const name = idToTool.get(b.tool_use_id) || 'unknown';
        const tok = sizeOf(b.content) / 4;
        toolRes[name] = (toolRes[name] || 0) + tok; toolResAll += tok;
        if (name === 'Read' && tok > 0) readNoLimit.tok += tok; // all Read output, upper bound for whole-file reads
      }
    }
  }
  if (s.eff > 0) sessions.set(f, s);
}

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + '%' : 'n/a');
const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n)));
const hrs = (s) => (s.max - s.min) / 36e5;

const list = [...sessions.values()];
const longSess = list.filter((s) => hrs(s) >= 3);
const longSessEff = longSess.reduce((a, s) => a + s.eff, 0);
const fresh = tot.in + tot.out + tot.cw;

console.log(`Token audit, last ${DAYS} days. Files: ${files.length}, sessions with usage: ${list.length}`);
console.log(`Raw tokens: input ${k(tot.in)}, output ${k(tot.out)}, cache-write ${k(tot.cw)}, cache-read ${k(tot.cr)}`);
console.log(`Cost-weighted units (in=1,out=5,cache-write=1.25,cache-read=0.1): ${k(tot.eff)}`);
console.log('\nTop projects by weighted cost:');
Object.entries(projEff).sort((a, b) => b[1] - a[1]).slice(0, 5)
  .forEach(([p, v]) => console.log(`  ${pct(v, tot.eff).padStart(6)}  ${p.slice(0, 50)}`));

console.log('\nTool-result size (est tokens = chars/4), share of all fresh tokens:');
Object.entries(toolRes).sort((a, b) => b[1] - a[1]).slice(0, 6)
  .forEach(([n, v]) => console.log(`  ${n.padEnd(14)} ${k(v).padStart(8)}  ${pct(v, fresh)}`));
console.log(`  Read calls without limit: ${readNoLimit.n}; Agent/Task launches: ${agentLaunches.n}`);

console.log('\nRANKED WASTE PATTERNS (approx, % of cost-weighted units unless noted):');
const bash = toolRes['Bash'] || 0, rd = toolRes['Read'] || 0;
const cands = [
  { name: 'Long-context turns (context > 150k)', pct: (longCtx.eff / tot.eff) * 100, extra: `${longCtx.turns} turns; sessions >=3h: ${longSess.length} = ${pct(longSessEff, tot.eff)}` },
  { name: 'Subagent/sidechain work', pct: (side.eff / tot.eff) * 100, extra: `${side.turns} turns, ${agentLaunches.n} launches` },
  { name: 'Bulky tool output (Read+Bash results)', pct: ((bash + rd) / fresh) * 100, extra: `Read ${k(rd)}, Bash ${k(bash)} est tokens, % is of fresh tokens` },
].sort((a, b) => b.pct - a.pct);
cands.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}: ${c.pct.toFixed(1)}%  (${c.extra})`));
