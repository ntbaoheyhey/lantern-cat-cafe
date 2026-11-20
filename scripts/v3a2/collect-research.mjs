import {readFile,writeFile} from 'node:fs/promises';
import {root,evidenceMeta} from './check-gates.mjs';
const read=async p=>JSON.parse(await readFile(root+'/'+p,'utf8'));
const base='reports/v3-battle/a2',report=await readFile(root+'/'+base+'/RESEARCH-A2.md','utf8'),firstTable=report.split('Reference caveats:')[0];
const pilots=await read(base+'/R/pilots/pilot-metrics.json'),targets=await read('scripts/v3a2/targets.json');
const metrics={_meta:evidenceMeta(),reference:await read(base+'/REF-METRICS.json'),suite:await read(base+'/R/suite.json'),
 research:{tableRows:firstTable.split('\n').filter(l=>l.startsWith('|')).length-2,articles:new Set(report.match(/https:\/\/[^) ]+/g)).size,
 motionRules:report.split('\n').filter(l=>/^\d+\. /.test(l)).length,splitPilots:pilots.methods.filter(p=>p.extremePoses===8&&p.holes.length===8).length,
 layerTypes:report.split('## Ultimate layer plan')[1].split('## Review')[0].split('\n').filter(l=>l.startsWith('|')).length-2,targetsMeasured:Number(targets.status==='measured')}};
await writeFile(root+'/'+base+'/R/metrics.json',JSON.stringify(metrics,null,2)+'\n');console.log(metrics.research);
