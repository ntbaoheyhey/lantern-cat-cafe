import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
for (const variant of ['common', 'carriers']) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`reports/cardrpg-big/a5/b2/utility-suppression-15/${variant}/run.mjs`], { stdio: 'inherit' });
    child.on('error', reject); child.on('close', resolve);
  });
  console.log(JSON.stringify({ variant, code }));
  if (code !== 0) { process.exitCode = code ?? 1; break; }
  await delay(7000);
}
