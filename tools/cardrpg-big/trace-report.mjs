import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const directory = process.argv[2] || 'reports/cardrpg-big/baseline';
const name = process.argv[3] || '1280x720-dpr1-cpu1';
const measurement = JSON.parse(await readFile(`${directory}/${name}.json`, 'utf8'));
const events = JSON.parse(gunzipSync(await readFile(`${directory}/${name}-trace.json.gz`))).traceEvents;
const navigation = events.find(event => event.name === 'navigationStart'
  && event.args?.data?.documentLoaderURL?.startsWith('file:'));
if (!navigation) throw new Error('Trace has no file navigation origin');
const mainEvents = events.filter(event => event.pid === navigation.pid && event.tid === navigation.tid);
const profile = mainEvents.find(event => event.name === 'Profile');
const nodes = new Map();
const samples = [];
let timestamp = profile?.args.data.startTime;
for (const event of events) {
  if (event.name !== 'ProfileChunk' || event.pid !== navigation.pid || event.id !== profile?.id) continue;
  const data = event.args.data;
  for (const node of data.cpuProfile.nodes ?? []) nodes.set(node.id, node);
  for (const [index, id] of (data.cpuProfile.samples ?? []).entries()) {
    const duration = data.timeDeltas[index];
    timestamp += duration;
    samples.push({ at: timestamp, duration, id });
  }
}
function stack(id) {
  const frames = [];
  for (let node = nodes.get(id); node; node = nodes.get(node.parent)) {
    const frame = node.callFrame;
    frames.push({ function: frame.functionName || '(anonymous)', script: frame.scriptId,
      line: frame.lineNumber, column: frame.columnNumber, url: frame.url });
  }
  return frames;
}
const hitches = measurement.frames.filter(frame => frame.ms > 33).map(frame => {
  const until = navigation.ts + frame.at * 1000;
  const from = until - frame.ms * 1000;
  const work = mainEvents.filter(event => event.ph === 'X' && event.dur && event.ts < until && event.ts + event.dur > from);
  const sampled = new Map();
  for (const sample of samples) {
    if (sample.at < from || sample.at > until) continue;
    sampled.set(sample.id, (sampled.get(sample.id) ?? 0) + sample.duration / 1000);
  }
  const topSamples = [...sampled].sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([id, ms]) => ({ ms, stack: stack(id) }));
  const tasks = work.sort((a, b) => b.dur - a.dur).slice(0, 12).map(event => ({
    name: event.name, start: (event.ts - navigation.ts) / 1000, ms: event.dur / 1000,
    overlap: Math.max(0, Math.min(until, event.ts + event.dur) - Math.max(from, event.ts)) / 1000,
    data: event.args?.data,
  }));
  return { ...frame, tasks, topSamples };
});
const result = { source: `${name}-trace.json.gz`, origin: navigation.ts, mainThread: navigation.tid,
  method: 'RAF intervals aligned to navigationStart. Main renderer thread only. Task durations are inclusive. CPU samples are statistical stack evidence, never additive to nested task durations.', hitches };
await writeFile(`${directory}/trace-attribution.json`, JSON.stringify(result, null, 2));
const rows = hitches.map(hitch => {
  const tasks = hitch.tasks.filter(task => !['RunTask', 'v8.run', 'v8.callFunction'].includes(task.name)).slice(0, 3);
  const samples = hitch.topSamples.slice(0, 3).map(sample => `${sample.stack[0].function} (${sample.ms.toFixed(1)} ms sampled)`);
  return `| ${hitch.at.toFixed(1)} | ${hitch.ms.toFixed(1)} | ${tasks.map(task => `${task.name} ${task.ms.toFixed(1)} ms`).join(', ')} | ${samples.join(', ')} |`;
});
await writeFile(`${directory}/HITCHES.md`, `# Cold-page hitch attribution\nREFERENCE: ${name}-trace.json.gz; trace-attribution.json; tools/cardrpg-big/trace-report.mjs\n\n${result.method}\n\n| Frame end ms | Frame delta ms | Overlapping main-thread work | CPU profile leaves |\n| ---: | ---: | --- | --- |\n${rows.join('\n')}\n\nEach frame above 33 ms appears here. Full call stacks, source offsets and overlap durations are retained in trace-attribution.json. A sampled leaf labelled (program) or (idle) does not identify a particular source function.\n`);
console.log(JSON.stringify({ hitches: hitches.length, max: Math.max(...hitches.map(frame => frame.ms)) }));
