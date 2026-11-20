/** Seal documentary facts only; missing pilot/audio observations remain OPEN. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {root} from './check-feel.mjs';
const base='reports/v3-feel/',file=resolve(root,base+'measurements.json');
const data=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{measurements:{}};
const read=name=>JSON.parse(readFileSync(resolve(root,base+name),'utf8'));
function set(key,value,paths){data.measurements['QR.'+key]={samples:[{fixture:'research',value}],evidence:paths.map(path=>({path:base+path,sha256:createHash('sha256').update(readFileSync(resolve(root,base+path))).digest('hex')}))};}
for(const [key,name] of [['principlesDocument','PRINCIPLES'],['referenceDocument','REFERENCE-BREAKDOWN'],['pipelineDocument','PIPELINE'],['toolsDocument','TOOLS'],['qualityDocument','QUALITY-BAR']]){
 const path=`CRAFT/${name}.md`;set(key,readFileSync(resolve(root,base+path),'utf8').trim().length>0,[path]);
}
const ref=read('REF-EFFECTS.json'),selection=read('CRAFT/reference-selection.json');
set('referenceBasics',selection.actions.filter(a=>a.tier==='basic').length,['CRAFT/reference-selection.json']);
set('referenceUltimates',selection.actions.filter(a=>a.tier==='ultimate').length,['CRAFT/reference-selection.json']);
set('referenceVideos',new Set(selection.actions.map(a=>a.source)).size,['CRAFT/reference-selection.json']);
set('referenceFps',ref.sampleFps,['REF-EFFECTS.json']);
set('frameTimingCharts',ref.actions.filter(a=>a.phases.anticipation&&a.phases.contact&&a.phases.followThrough&&a.phases.recovery).length,['REF-EFFECTS.json','CRAFT/REFERENCE-BREAKDOWN.md']);
set('referenceLayersMeasured',ref.actions.every(a=>a.layers.length>=3&&Number.isFinite(a.estimatedPeakAreaFraction)&&Number.isFinite(a.effectSpanSeconds)&&Number.isFinite(a.streakCountMinimum)),['REF-EFFECTS.json']);
set('sourcesCited',read('CRAFT/sources.json').sources.length,['CRAFT/sources.json']);
set('toolsAssessed',(readFileSync(resolve(root,base+'CRAFT/TOOLS.md'),'utf8').match(/^\| .+ \| .+ \| .+ \| .+ \| .+ \| .+ \| .+ \|$/gm)||[]).length-1,['CRAFT/TOOLS.md','CRAFT/tool-sources.json']);
const bar=read('CRAFT/quality-bar.json');for(const group of ['basic','ultimate','character'])set(group+'Checks',bar.criteria.filter(c=>c.group===group).length,['CRAFT/quality-bar.json','CRAFT/QUALITY-BAR.md']);
set('vietnameseSummaryLines',readFileSync(resolve(root,base+'STATUS-VI.md'),'utf8').split('\n').filter(s=>s.includes('/10:')).length,['STATUS-VI.md']);
data.updatedAt=new Date().toISOString();writeFileSync(file,JSON.stringify(data,null,2)+'\n');
console.log('Sealed documentary measurements. Pilot and listening remain unverified.');
