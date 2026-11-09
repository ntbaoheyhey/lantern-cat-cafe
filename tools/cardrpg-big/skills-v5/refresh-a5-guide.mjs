// Refresh the inherited guide from complete S6 evidence; keep its A4 history intact.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',json=async p=>JSON.parse(await readFile(p,'utf8'));
const gates=await json(root+'/s6/on/numeric-gates.json'),delivery=await json(root+'/s6/delivery.json'),z=await json(root+'/s6/z/summary.json');
assert.equal(gates.offset,20000);assert(z.complete);assert.equal(z.artifactSha256,delivery.sha256);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const row=id=>{const r=gates.rows.find(r=>r.id===id);assert(r,id);return r;},pct=x=>(100*x).toFixed(2)+'%';
const rows=[
 ['Adjacent tiers ≥44/48, no reversals','46/48; 0 reversals','A5.tiers',r=>`${r.measured.positive}/${r.measured.total}; ${r.measured.train.reversals+r.measured.acceptance.reversals} reversals`],
 ['Fourth-slot gain ≤12 percentage points','Worst 93.40pp','A5.fourth-slot',r=>`${r.measured.misses}/${r.measured.cells} misses; worst ${r.measured.worstPp.toFixed(2)}pp`],
 ['Every set 35–75%, with a leading situation','67.03–79.60%','A5.sets',r=>r.measured.range.map(pct).join('–')],
 ['Every cat 55–75%, with a top-pick situation','31.38–64.66%','A5.cats',r=>r.measured.range.map(pct).join('–')],
 ['Coherent crew gain 10–25 percentage points','47.73pp','A5.crew-gain',r=>r.measured.gainPp.toFixed(2)+'pp'],
 ];
const comparison=rows.map(([name,before,id,measure])=>{const r=row(id);return `<tr><th>${name}</th><td>${before}</td><td>${measure(r)}</td><td>${r.status}</td></tr>`;}).join('');
const progression=(await readFile('reports/cardrpg-big/a5/B3-PROGRESSION.md','utf8')).split('\n').filter(l=>/^\|[1-7]\|/.test(l)).map(l=>l.split('|').slice(1,-1));assert.equal(progression.length,7);
const pictures=[];
for(const [name,caption]of [['combo-prepare','Prepare shows formation, skill shapes and the crew hint. This is the labelled reaction fixture.'],['equipment-compare','The earned-save equipment comparison names the utility change.'],['reaction-explanation','Result names the observed reaction. This is the labelled reaction fixture.']]){
 const path=`${root}/s6/z/1280-look-on/${name}.png`;assert(z.groups.some(g=>g.captures.some(c=>c.path===path)),path);
 pictures.push(`<figure><img alt="${esc(caption)}" src="data:image/png;base64,${(await readFile(path)).toString('base64')}"><figcaption>${esc(caption)}</figcaption></figure>`);
}
const section=`<section id="a5-skills-v5"><h2>A5 changes and Skills V5</h2><p>Home names tonight’s goal and tomorrow’s service. Prepare supports keyboard placement, crew plans and skill shapes. Equipment compares the consequence of a change. Result names contributions and offers an available next step. Battles remain automatic.</p><p><a class="button" href="skills-v5.html">Open the separate Skills V5 demo</a> · <a href="skills-v5-guide.html">Read the eight keywords and four reactions</a> · <a href="../../reports/cardrpg-big/skills-v5/PLAYTEST-KIT.md">Try the current fifteen-minute playtest</a></p><p>The main A4 demo remains unchanged. Its original guide and measurements are retained below. This section describes the newer preview; lane B’s new battle visuals remain a separate draft.</p><h3 id="a5-current-screens">Current screens</h3>${pictures.join('')}<h3 id="a5-current-balance">Historical A4 and current V5 measurements</h3><p>The A4 values come from its historical held-out report. Current V5 uses the registered 20001–20500 block. These different samples and configurations are not a same-seed causal estimate. The current report also pairs V5 with its A5 fallback on identical seeds.</p><div class="table"><table><thead><tr><th>Gate</th><th>Historical A4</th><th>V5 acceptance</th><th>V5 status</th></tr></thead><tbody>${comparison}</tbody></table></div><p><a href="../../reports/cardrpg-big/a4/A4-GAMEPLAY-REPORT.md">Historical A4 evidence</a> · <a href="../../reports/cardrpg-big/skills-v5/V5A-REPORT.md">Every current gate and remaining miss</a></p><h3 id="a5-first-week">Your first week</h3><p>These are suggested goals, not calendar locks or guaranteed drops. Existing progress requirements and daily limits still apply.</p><div class="table"><table><thead><tr><th>Day</th><th>Try this</th><th>Earned progress to chase</th><th>Tomorrow</th></tr></thead><tbody>${progression.map(cells=>`<tr>${cells.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>New preview: ${delivery.bytes.toLocaleString('en-US')} bytes. SHA-256 <span class="hash">${delivery.sha256}</span>. The screenshots above belong to this exact artifact. Bot and self-review results do not establish human enjoyment.</p></section>`;
const path='docs/cardrpg3/gameplay-v4.html';let html=await readFile(path,'utf8');
const marker='<!-- BEGIN A5 SKILLS V5 REFRESH -->',end='<!-- END A5 SKILLS V5 REFRESH -->';
if(html.includes(marker)){const a=html.indexOf(marker),b=html.indexOf(end,a);assert(b>a);html=html.slice(0,a)+html.slice(b+end.length);}
const anchor='<section id="prepare">';assert(html.includes(anchor));html=html.replace(anchor,marker+section+end+anchor);
const first=html.split('\n')[0];assert(first.startsWith('<!-- REFERENCE:'));
if(!first.includes('SKILLS-V5.md'))html=html.replace(first,first.replace(' -->','; docs/design/cardrpg/SKILLS-V5.md; reports/cardrpg-big/skills-v5/V5A-REPORT.md; reports/cardrpg-big/a5/B3-PROGRESSION.md -->'));
await writeFile(path,html);console.log('Refreshed the inherited A5 guide with current receipts and three Z captures');
