import {fileURLToPath} from 'node:url';
import {defineConfig} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import base from '../../apps/web/playwright.config.ts';
import {classicURL,v2URL} from '../../apps/web/e2e/support/servers.ts';

// Keep every original project/assertion. Run local and API projects separately
// so each lane stays inside its assigned ports without stopping inherited jobs.
const group = process.env.V3SOLO_E2E_GROUP ?? 'local';
const serverGroup = group === 'server' || group === 'fallback';
const urls = group === 'stage' ? [v2URL] : group === 'classic' ? [classicURL] : [classicURL,v2URL];
const allServers = Array.isArray(base.webServer) ? base.webServer : [base.webServer!];
export default defineConfig({...base,
  testDir:'../../apps/web/e2e',
  outputDir:'../../work/v3feel-e2e-' + (serverGroup?'server':'local'),
  webServer:allServers.filter(s=>serverGroup ? ![classicURL,v2URL].includes(s.url!) : urls.includes(s.url!)).map(s=>({...s,cwd:fileURLToPath(new URL('../../apps/web/',import.meta.url))})),
  projects:base.projects!.filter(p=>serverGroup ? p.name===(group==='fallback'?'stage-layout':'v2-server') : group==='stage' ? ['stage-layout','v2-loop'].includes(p.name) : group==='classic' ? p.name==='classic' : p.name!=='v2-server'),
  workers:2,
  reporter:'line',
});
