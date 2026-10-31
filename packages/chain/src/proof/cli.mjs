import { writeFile } from 'node:fs/promises';
import { friendlyError, humanTable, json, proveChain } from './proof.mjs';

/** stdout is one JSON document; the human table goes to stderr, including failures. */
export async function runCli(args, {
  loadRuntime = async () => (await import('./runtime.mjs')).loadRuntime(),
  stdout = (text) => process.stdout.write(text),
  stderr = (text) => process.stderr.write(text),
  save = writeFile,
} = {}) {
  let report;
  let out;
  try {
    for (let i = 0; i < args.length; i++) {
      if (args[i] !== '--out' || out !== undefined || !args[i + 1] || args[i + 1].startsWith('--')) {
        throw new Error('Usage: node scripts/chain-proof.mjs [--out path/to/proof.json]');
      }
      out = args[++i];
    }
    report = await proveChain(await loadRuntime());
    if (out) await save(out, `${json(report)}\n`, 'utf8');
  } catch (error) {
    if (!report) report = { status: 'NOT VERIFIED', checks: [], contracts: {}, limitations: [] };
    report.status = 'NOT VERIFIED';
    report.checks.push({ name: 'CLI', ok: false, detail: friendlyError(error) });
  }
  stdout(`${json(report)}\n`);
  stderr(`${humanTable(report)}\n`);
  return report.status === 'VERIFIED' ? 0 : 1;
}
