import { chromium } from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const artifact = process.env.V5_ARTIFACT, out = process.env.V5_OUT, name = process.env.V5_NAME || 'after';
const pitch = process.env.V5_PITCH === '1', seconds = pitch ? 30 : 20;
const raw = `/tmp/cardrpg-v5full-video-${name}`;
await mkdir(out, { recursive: true }); await mkdir(raw, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const frames = [], writes = [], errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('file://' + artifact + '?dev=1'); await page.waitForFunction(() => window.__depthReview);
  let setup;
  if (process.env.V5_SETUP) setup = JSON.parse(await readFile(process.env.V5_SETUP));
  if (process.env.V5_CASE) {
    const rows = JSON.parse(await readFile(process.env.V5_REGISTRATION));
    setup = rows.find(row => row.id === process.env.V5_CASE).setup;
  }
  await page.evaluate(setup => {
    const m = window.__depthReview;
    if (setup) window.__v5LiveStart({ ...setup, skillsV5: true, gameplayV4: true }, 1); else m.watchNow();
    m.paused = true; m.camera = 'wide'; m.state.settings.speed = 1; m.notify(false);
  }, setup);
  await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
  await page.waitForFunction(() => window.__depthReview.battle.actors.every(a => window.__depthScene.puppets.get(a.id)?.asset === a.catalogId));
  const initial = await page.evaluate(() => window.__depthReview.battle.initial);
  await writeFile(`${out}/${name}-initial.json`, JSON.stringify(initial, null, 2));
  const cdp = await page.context().newCDPSession(page);
  cdp.on('Page.screencastFrame', event => {
    const path = `${raw}/${String(frames.length).padStart(5, '0')}.jpg`;
    frames.push({ path, at: event.metadata.timestamp }); writes.push(writeFile(path, Buffer.from(event.data, 'base64')));
    void cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1440, maxHeight: 900, everyNthFrame: 2 });
  await page.evaluate(() => {
    const m = window.__depthReview, seen = new Set(); window.__filmEvents = []; window.__filmStart = performance.now();
    const tick = () => {
      const plan = m.plan, p = window.__depthScene?.view().cardPresentation;
      const save = (key, detail) => { if (!seen.has(key)) { seen.add(key); window.__filmEvents.push({ ...detail, at: (performance.now() - window.__filmStart) / 1000 }); } };
      if (plan) {
        const id = `${plan.events[0]?.actionId}:${plan.skillId}`;
        if (m.animationAt >= plan.beats[2].start && plan.skillId.endsWith('-4')) save(id + ':ultimate', { kind: 'ultimate', id: plan.skillId });
        for (const cue of p?.reactions ?? []) if (m.animationAt >= cue.at && m.animationAt < cue.at + cue.duration) save(id + ':' + cue.id, { kind: 'reaction', id: cue.id });
        if ((p?.landings?.length ?? 0) >= 2 && m.animationAt >= p.landings[0].at) save(id + ':multi', { kind: 'multi-target', id: p.landings[0].shape });
      }
      window.__filmRaf = requestAnimationFrame(tick);
    };
    m.paused = false; m.notify(false); window.__filmRaf = requestAnimationFrame(tick);
  });
  if (pitch) {
    await page.waitForFunction(() => (window.__depthReview.battle?.result && !window.__depthReview.plan) || performance.now() - window.__filmStart >= 300000, null, { timeout: 310000 });
    await page.waitForTimeout(300);
  } else await page.waitForTimeout(20050);
  await cdp.send('Page.stopScreencast'); await Promise.all(writes);
  const observation = await page.evaluate(() => { cancelAnimationFrame(window.__filmRaf); return { events: window.__filmEvents, elapsed: (performance.now() - window.__filmStart) / 1000, result: window.__depthReview.battle?.result, choices: window.__depthReview.battle?.choices.length }; });
  const features = start => {
    const events = observation.events.filter(event => event.at >= start && event.at < start + seconds);
    return { reactions: [...new Set(events.filter(event => event.kind === 'reaction').map(event => event.id))], multiTargets: events.filter(event => event.kind === 'multi-target').length, ultimates: events.filter(event => event.kind === 'ultimate').length, events };
  };
  let start = 0, acceptance = true;
  if (pitch) {
    const candidates = [0, ...observation.events.map(event => Math.max(0, Math.min(observation.elapsed - seconds, event.at - .5)))];
    const accepted = candidates.find(value => { const f = features(value); return f.reactions.length >= 2 && f.multiTargets >= 2 && f.ultimates >= 1; });
    acceptance = accepted !== undefined;
    start = accepted ?? candidates.sort((a, b) => { const score = x => { const f = features(x); return f.reactions.length * 10 + Math.min(2, f.multiTargets) + Math.min(1, f.ultimates); }; return score(b) - score(a); })[0];
  }
  await writeFile(`${raw}/frames.txt`, frames.map((frame, i) => `file '${frame.path}'\nduration ${Math.max(.001, i + 1 < frames.length ? frames[i + 1].at - frame.at : .034)}`).join('\n') + `\nfile '${frames.at(-1).path}'\n`);
  const file = `${out}/${name}-${seconds}s.mp4`;
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${raw}/frames.txt`, '-ss', String(start), '-t', String(seconds), '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'fast', '-crf', '28', '-maxrate', '700k', '-bufsize', '1400k', '-movflags', '+faststart', file]);
  const bytes = await readFile(file), probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,nb_frames:format=duration', '-of', 'json', file], { encoding: 'utf8' }));
  const receipt = { method: 'Uninterrupted natural automatic x1 battle; only start/end trim, no tick injection or fixture plans. CDP timestamps encoded at30fps; recording is not a performance sample.', name, artifact, artifactSha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), initial, file, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, probe, trimStart: start, capturedFrames: frames.length, pitchAcceptance: pitch ? acceptance : null, features: features(start), observation, errors };
  await writeFile(`${out}/${name}.json`, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ name, bytes: bytes.length, trimStart: start, pitchAcceptance: receipt.pitchAcceptance, features: receipt.features, errors }));
} finally { await browser.close(); }
