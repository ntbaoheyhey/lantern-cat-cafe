// Local test dependency only; does not call models or schedule a future task.
import { spawn } from 'node:child_process';
const [pid, command, ...args] = process.argv.slice(2);
if (!pid || !command) throw Error('Usage: PID command args');
for (;;) {
  try { process.kill(Number(pid), 0); } catch { break; }
  await new Promise(resolve => setTimeout(resolve, 5000));
}
const child = spawn(command, args, { stdio: 'inherit', env: process.env });
process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));
child.on('close', code => { process.exitCode = code ?? 1; });
