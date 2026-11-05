// Preserve real stdout/stderr receipts, including baseline and superseded runs.
import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const dir='reports/turn3d';const names=(await fs.readdir(dir+'/logs')).filter(n=>/^(base-(install|lint|typecheck|unit|e2e|build)|final-(lint|typecheck|unit|e2e|build)|web-final-reviewed|turn-final|typecheck-final|models-rebuild|regrade-build|ui-proof-final|performance(-metal)?(-final)?|isolation-final|soak-final|capture-final|captures-regression|compare-final|video-encode)\.log$/.test(n)).sort();
const records=[];for(const name of names){const b=await fs.readFile(dir+'/logs/'+name);records.push({path:'logs/'+name,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')})}
execFileSync('tar',['-czf',dir+'/raw/test-logs.tar.gz','-C',dir,...records.map(r=>r.path)]);
await fs.writeFile(dir+'/raw/test-logs-index.json',JSON.stringify({archive:'test-logs.tar.gz',records},null,2)+'\n');console.log(JSON.stringify({logs:records.length,archive:'reports/turn3d/raw/test-logs.tar.gz'}));
