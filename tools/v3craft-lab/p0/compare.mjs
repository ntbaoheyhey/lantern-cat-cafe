// P0 learning experiment: replay real Soot observations; no production changes.
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const old=JSON.parse(readFileSync('tools/v3craft-lab/q3b/pose-composition-study.json','utf8'));
const rows=old.rows.filter(r=>r.ms===225||r.ms===350).map(r=>({
  method:r.method,ms:r.ms,iou:r.restIou,footDriftPx:r.feetMove,
  silhouetteOnly:r.restIou<=(r.ms===225?.85:.75),
  silhouetteAndAnchor:r.restIou<=(r.ms===225?.85:.75)&&r.feetMove<=3,
}));
const paths=execFileSync('git',['ls-files','-z','reports/v3-feel'],{encoding:'utf8'}).split('\0').filter(Boolean);
const trackedBytes=paths.reduce((sum,p)=>sum+statSync(p).size,0);
const result={at:new Date().toISOString(),source:'tools/v3craft-lab/q3b/pose-composition-study.json',rows,
  silhouetteOnlyPasses:rows.filter(r=>r.silhouetteOnly).length,
  withAnchorPasses:rows.filter(r=>r.silhouetteAndAnchor).length,
  trackedBytes,ignoreOnlySavedBytes:0,
  conclusion:'A moved idle painting can pass IoU while sliding feet. Require all pose checks and visual identity review; ignore-only rules cannot trim already tracked evidence.'};
writeFileSync('tools/v3craft-lab/p0/results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
