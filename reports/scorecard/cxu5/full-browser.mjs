import { writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const cwd = `${process.cwd()}/apps/web`;
const config = `${cwd}/.cxu5-full.config.ts`;
writeFileSync(config, `import config from './playwright.config';\nexport default { ...config, projects: config.projects?.map(project => ({ ...project, use: { ...project.use, viewport: process.env.CXU5_SIZE === '1600' ? { width: 1600, height: 900 } : { width: 1280, height: 720 } } })) };\n`);
try {
 for (const width of ['1280', '1600']) {
  const result = spawnSync('npx', ['-y', 'pnpm@10.28.0', 'test:e2e', '--config', '.cxu5-full.config.ts', '--workers=2'], { cwd, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, env: { ...process.env, E2E_PORT_CLASSIC: '4370', E2E_PORT_V2: '4371', E2E_PORT_SERVER: '4372', E2E_PORT_API: '4373', SCREENSHOTS: '0', CXU5_SIZE: width } });
  writeFileSync(`reports/scorecard/cxu5/logs/full-e2e-${width}.log`, `Native viewport override only: ${width}, same project matching, assertions, no retries.\n${result.stdout}${result.stderr}\nEXIT ${result.status}\n`);
  console.log(width, result.status);
 }
} finally { unlinkSync(config); }
