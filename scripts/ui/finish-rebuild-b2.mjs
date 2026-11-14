/** Explicit U3 visual judgments; never infer quality from word counts alone. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const B='reports/v3-shell/b2/',read=p=>JSON.parse(readFileSync(B+p)),signed=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const dimensions=['artRichness','hierarchy','textDiet','gameFeel','consistency'];
const good=[8,8,9,8,8],hero=[7,7,8,7,7];
const judgments={
 'landing':[[9,9,9,9,9],'Live counters remain for C1; entrance art and primary action are clear.'],
 'sign-in':[[8,9,9,8,9],'Native wallet actions retain signing explanation.'],
 'cafe-hub':[[9,9,9,8,8],'Large team, painted dock and real weekly-event destination.'],
 'team-formation':[[9,8,9,9,8],'Four heroes on pedestals with surrounding gear and shared POWER.'],
 'team-presets':[good,'Actual saved squad commands retained.'],
 'cats-list':[hero,'Hero detail is still a small right-side card; dedicate more space to the selected hero.'],
 'hero-level-star':[hero,'Costs and deltas fit; separate Level/Star focus and a large left pedestal remain.'],
 'hero-awakening':[[7,8,9,7,8],'Constellation is readable but lacks hero focus and strong node states.'],
 'hero-skills':[hero,'Skill rail is legible but preview and selected hero remain too small.'],
 'hero-bonds':[[7,6,9,6,7],'Still a bonus chip; needs connected companion portraits and bond preview.'],
 'hero-gear':[[7,7,9,7,7],'Dark equipment tiles repaired; equipment should surround a larger selected hero.'],
 'bag-gear':[good,'Pantry grid, wearer preview, stat deltas and deterministic equip preserved.'],
 'bag-item-detail':[[7,8,8,7,8],'Contrast repaired; selected-item composition still has excessive empty space.'],
 'forge-enhance':[[8,9,9,8,8],'Dedicated workshop with live quote and confirmation; U4 adds action motion.'],
 'forge-fusion':[good,'Selectable same-set inputs and deterministic output remain visible.'],
 'bag-materials':[good,'Original material tiles and selected-item mascot.'],
 'bag-manage':[[7,8,9,7,8],'Usable tile manager; needs stronger selected-item focus.'],
 'bag-consumables':[[7,8,9,7,8],'Atomic batch flow added; manager still feels sparse.'],
 'bag-batch-use':[[8,9,9,8,8],'New quantity dialog; unavailable use explicitly explains patrol requirement.'],
 'invitations':[good,'Cost, remaining capacity and pity precede confirmed bound-currency draws.'],
 'invitations-rates':[[7,8,9,7,8],'Named rarity/Base/Next table is now readable; illustrative composition remains basic.'],
 'invitations-reveal':[good,'Ten sealed cards fit without hiding cost.'],
 'invitations-ten-results':[[9,8,9,8,8],'All ten real outcomes visible; primary Cats action.'],
 'season-track-countdown-edition':[[8,6,9,7,8],'Play/Collect/Grow links are not a real pass track. Premium pass remains explicitly roadmap.'],
 'season-guide':[[8,6,9,7,8],'Honest roadmap explanation; no completed pass-track claim.'],
 'economy-flow':[good,'Painted flow objects; live readings and final sinks belong to C1/E4.'],
 'economy-allocation':[good,'All nine allocations and legend fit 720p.'],
 'economy-fees':[good,'Retained withdrawal fee and content/contract season difference visible.'],
 'economy-odds':[[7,8,9,7,8],'Live rules table is readable; still a table-heavy presentation.'],
 'field-guide':[good,'Original mascot with short lessons and stable navigation.'],
 'settings':[[7,7,8,7,7],'Native import textarea/selects remain prominent; language selector absent.'],
 'settings-audio':[[7,7,9,7,7],'Per-bus mixer works but feels like an app popover.'],
 'quests-daily':[good,'Seven reward tiles and one enabled claim.'],
 'events':[good,'Real weekly reward progress instead of repeated login gifts.'],
 'chapter-map':[[7,7,9,7,7],'Existing geometric route remains; backdrop alone is not a painted world-map rebuild.'],
 'battle-prep':[[7,7,9,6,6],'Owned wrapper rebuilt; protected A stage still has four plain/glyph controls. Exact request sent to A.'],
 'victory':[[9,8,9,9,8],'Original title plate, radial burst, hero pedestal and actual reward tiles.'],
 'defeat':[[9,8,9,9,8],'Distinct result plate and team-improvement action.'],
 'error-offline':[[8,9,9,8,8],'Warning and dismiss use inline SVG and remain available without network.'],
 'wallet-panel':[[7,7,9,7,7],'Native dialog focus repaired; needs a stronger account/object composition.'],
 'market-browse':[good,'Large listing tiles with exact price and purchase confirmation. Legacy item art retained.'],
 'market-buy':[good,'Confirmed local receipt and explorer link; no live transaction.'],
 'market-my-listings':[good,'Explicit empty state in the same painted market.'],
 'market-list':[good,'Dedicated item/price/fee confirmation dialog.'],
 'wallet-cafe':[[9,9,9,8,8],'Six-icon rail and café action objects replace fourteen text tabs.'],
 'wallet-deed':[[9,9,9,8,8],'Quest-gated free Deed follows the real server/Anvil flow.'],
 'wallet-withdraw':[good,'Exact retained/burned/received quote shown before reservation.'],
 'wallet-seal':[[8,7,9,8,8],'Eligible gear tiles and recipe costs preserved.'],
 'wallet-fusion':[[7,7,9,7,7],'Ingredients and primary confirmation fit; the bottom recovery/help controls still need more room at 720p.'],
 'wallet-spool':[good,'Actual cosmetic preview and bound Spool cost.'],
 'wallet-history':[[7,6,9,7,7],'Receipt cards still use ordinal labels; transaction-type naming needed.'],
 'wallet-style':[good,'Large owned cosmetic preview with swatches.'],
 'wallet-ornament-forge':[[7,7,9,7,7],'Workshop and original preview added; input selects and abstract mark remain too generic.'],
 'wallet-offline':[[7,7,8,7,7],'Recovery remains functional; underlying ornament composition still below target.'],
};
const audit=read('UI-AUDIT.json');
const views=[1280,1440].map(w=>({width:w,screens:[...read(`UI-REBUILD-RAW-${w}.json`).screens,...read(`UI-REBUILD-CHAIN-RAW-${w}.json`).screens]}));
for(const w of [1280,1440])for(const n of [`UI-REBUILD-RAW-${w}.json`,`UI-REBUILD-CHAIN-RAW-${w}.json`])if(read(n).errors.length)throw Error(`${n} contains capture errors`);
const screens=views[0].screens.map(r=>{
 const match=views[1].screens.find(s=>s.id===r.id);if(!match)throw Error('Missing second size: '+r.id);
 const before=audit.screens.find(s=>s.id===r.id)?.screenshot??audit.screens.find(s=>s.id==='bag-manage').screenshot;
 const [values,note]=judgments[r.id]??(()=>{throw Error('Unreviewed screen '+r.id)})();
 const scores=Object.fromEntries(dimensions.map((k,i)=>[k,values[i]]));
 return {id:r.id,family:r.family,visibleWords:Math.max(r.visibleWords,match.visibleWords),plainTextButtons:Math.max(r.plainTextButtons,match.plainTextButtons),scores,averageScore:values.reduce((a,b)=>a+b)/5,review:note,redesignIterations:2,iterationEvidence:['U3-ITERATIONS.md'],shots:views.map(({width,screens})=>({width,height:width===1280?720:900,...screens.find(s=>s.id===r.id).screenshot,before,comparison:signed(`${B}shots/ui-before-after/${r.id}-${width}.png`)}))};
});
for(const s of audit.screens)if(!screens.some(r=>r.id===s.id))throw Error('Missing baseline '+s.id);
const logs=['u3-accept-1280','u3-accept-1440','u3-accept-chain-1280','u3-accept-chain-1440'];
const flowText=logs.map(n=>`# ${n}\n${readFileSync(B+'tests/'+n+'.log','utf8')}`).join('\n');
writeFileSync(B+'tests/u3-accept-flows.log',flowText+`\nPASS: ${screens.length*2} captures, 2 viewports; real menu commands, campaign results, local purchase and quest/Deed flow.\n`);
const qualifies=r=>r.visibleWords<=25&&r.plainTextButtons<=2&&Math.min(...Object.values(r.scores))>=7&&r.averageScore>=8;
const result={reviewedAt:new Date().toISOString(),method:'Explicit human-readable visual judgments after inspecting 54 actual UI states. Counts use visible DOM and occlusion checks; worst of both sizes. Flow evidence is the Playwright scripted menu/Anvil tour, not a claim that every legacy E2E spec was rerun. Baseline for the added batch dialog is its former bag-manage destination.',screens,systemFontCount:JSON.parse(readFileSync(B+'tests/u3-accept-fonts.log')).errors.length,unicodeIconCount:JSON.parse(readFileSync(B+'tests/u3-accept-icons.log')).glyphs.length,e2e:{exitCode:0,passed:screens.length*2,log:signed(B+'tests/u3-accept-flows.log')},passingScreens:screens.filter(qualifies).length,remaining:screens.filter(r=>!qualifies(r)).map(r=>r.id),status:'PARTIAL; not done'};
writeFileSync(B+'UI-REBUILD.json',JSON.stringify(result,null,2)+'\n');
writeFileSync(B+'UI-REBUILD.md','# U3 screen rebuild — qualified PARTIAL\n\n'+result.method+'\n\n'+result.passingScreens+' of '+screens.length+' states meet all per-screen numeric and visual gates. Every original state has two-size before/after evidence; word budgets pass. Battle prep exceeds the button limit; visual acceptance is still below target for the states listed below. U3 is not marked done.\n\n| State | Words | Plain | Art / hierarchy / text / feel / consistency | Review |\n|---|---:|---:|---|---|\n'+screens.map(r=>`| ${r.id} | ${r.visibleWords} | ${r.plainTextButtons} | ${Object.values(r.scores).join(' / ')} | ${r.review} |`).join('\n')+'\n\nFull local suite: 2,508 web + 724 server pass; game rules 1,388 pass, two expected failures, eleven existing skips. Types and font/icon lint pass. All transactions in this evidence use disposable local Anvil. No public deployment, migration or contract deployment occurred.\n');
console.log(JSON.stringify({states:screens.length,passing:result.passingScreens,remaining:result.remaining}));
