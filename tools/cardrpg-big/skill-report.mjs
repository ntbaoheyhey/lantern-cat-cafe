import { readFile, writeFile } from 'node:fs/promises';

const directory = process.argv[2] || 'reports/cardrpg-big/baseline/skills';
const receipt = JSON.parse(await readFile(`${directory}/summary.json`, 'utf8'));
const groups = new Map();
for (const row of receipt.rows) {
  const configuration = `${row.width}×${row.height} DPR${row.dpr} CPU${row.cpu} ${row.quality}`;
  if (!groups.has(configuration)) groups.set(configuration, []);
  groups.get(configuration).push(row);
}
function summarize(rows, use) {
  const windows = rows.map(row => row.casts.find(cast => cast.use === use));
  const totalFrames = windows.reduce((sum, cast) => sum + cast.summary.frames, 0);
  return {
    max: Math.max(...windows.map(cast => cast.summary.max)),
    above25: windows.reduce((sum, cast) => sum + cast.summary.above25, 0),
    above50: windows.reduce((sum, cast) => sum + cast.summary.above50, 0),
    within20: windows.reduce((sum, cast) => sum + cast.summary.frames * cast.summary.within20, 0) / totalFrames,
    maxHeapDelta: Math.max(...windows.map(cast => cast.after.heap - cast.before.heap)),
    maxGeometryDelta: Math.max(...windows.map(cast => cast.after.gpuObjects.geometries - cast.before.gpuObjects.geometries)),
    maxTextureDelta: Math.max(...windows.map(cast => cast.after.gpuObjects.textures - cast.before.gpuObjects.textures)),
    maxDuration: Math.max(...windows.map(cast => cast.after.at - cast.before.at)),
  };
}
const configurations = [...groups].map(([name, rows]) => ({
  name, cases: rows.length, pageMax: Math.max(...rows.map(row => row.pageOpen.max)),
  pageAbove25: rows.reduce((sum, row) => sum + row.pageOpen.above25, 0),
  pageAbove50: rows.reduce((sum, row) => sum + row.pageOpen.above50, 0),
  first: summarize(rows, 'first'), repeat: summarize(rows, 'repeat'),
}));
const ranked = receipt.rows.map(row => ({ name: row.name, action: row.action.name,
  page: row.pageOpen, first: row.casts[0].summary, repeat: row.casts[1].summary,
  firstDuration: row.casts[0].after.at - row.casts[0].before.at,
  repeatDuration: row.casts[1].after.at - row.casts[1].before.at,
})).sort((a, b) => Math.max(b.first.max, b.repeat.max) - Math.max(a.first.max, a.repeat.max) || b.page.max - a.page.max);
const expected = 610;
const complete = receipt.rows.length === expected && !!receipt.ended;
const errors = receipt.rows.flatMap(row => row.errors.map(message => ({ name: row.name, message })));
const result = { complete, expected, measured: receipt.rows.length, artifactSha256: receipt.sha256,
  started: receipt.started, ended: receipt.ended, errors, configurations, ranked };
await writeFile(`${directory}/ranked.json`, JSON.stringify(result, null, 2));
const table = configurations.map(row => `| ${row.name} | ${row.cases} | ${row.pageMax.toFixed(1)} | ${row.first.max.toFixed(1)} / ${row.repeat.max.toFixed(1)} | ${row.first.above25} / ${row.repeat.above25} | ${row.first.above50} / ${row.repeat.above50} | ${(row.first.within20 * 100).toFixed(2)} / ${(row.repeat.within20 * 100).toFixed(2)} |`).join('\n');
const ranking = ranked.map(row => `| [${row.name}](${row.name}.json) | ${row.page.max.toFixed(1)} | ${row.first.max.toFixed(1)} / ${row.repeat.max.toFixed(1)} | ${row.firstDuration.toFixed(1)} / ${row.repeatDuration.toFixed(1)} |`).join('\n');
await writeFile(`${directory}/README.md`, `# Exhaustive skill timing\nREFERENCE: summary.json; ranked.json; tools/cardrpg-big/skill-measure.mjs; tools/cardrpg-big/skill-report.mjs\n\n${complete ? 'Complete' : 'In progress'} · ${receipt.rows.length}/${expected} cases. ${errors.length} page errors. Each case opens a fresh context and cold file, clicks the campaign and battle node, then uses the isolated Feel lab fixture. Every raw file includes page-open RAF deltas, long tasks/frames, heap/GPU snapshots, two cast windows and planned/observed duration. First-use fixture setup hides every spell frame until the measured trigger. CPU4 throttles CPU only. Cast duration includes the measurement endpoint polling interval, so it can exceed the authored duration by approximately one RAF.\n\nThe catalogue contains 48 skills, including 12 ultimates, and 13 enemies, including 3 bosses. Ten configurations yield 610 cases and 1,220 casts. Low and 2560×1440 use DPR1 CPU1.\n\n| Configuration | Cases | Page MAX ms | First / repeat MAX ms | >25 first / repeat | >50 first / repeat | ≤20 ms % first / repeat |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n${table}\n\n## Ranked cases\nREFERENCE: ranked.json; ../HITCHES.md; ../trace-attribution.json\n\nSort by the larger cast MAX, then page MAX. The raw CPU profile identifies decoder, script compilation, scene construction and first program/uniform initialization during page-open spikes. Skill-body effects lack direction registrations in the F0 artifact, which must be considered when comparing these timings with later complete effects. Profile evidence for individual later cast spikes must be captured before claiming their cause.\n\n| Case and raw frames | Page MAX ms | First / repeat MAX ms | First / repeat duration ms |\n| --- | ---: | ---: | ---: |\n${ranking}\n`);
console.log(JSON.stringify({ complete, measured: receipt.rows.length, errors: errors.length, configurations }));
