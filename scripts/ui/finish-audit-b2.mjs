/** U1 review judgments recorded after inspecting all 53 baseline screenshots. */
import {readFileSync,writeFileSync} from 'node:fs';
const dir='reports/v3-shell/b2',read=name=>JSON.parse(readFileSync(`${dir}/${name}`));
const dimensions=['artRichness','hierarchy','textDiet','gameFeel','consistency'];
const judgments={
 'landing':[[8,8,4,7,7],'Ribbon title; clear readable counters','Cut secondary slogans; repair title fill; keep the illustrated entrance and one Play action.'],
 'sign-in':[[5,8,9,6,7],'Ornate frame; mascot; icon controls','Use a wallet object, concise signing explanation and illustrated modal frame.'],
 'cafe-hub':[[8,8,8,8,7],'Event icon art; restrained unlock notifications','Replace remaining rectangular event labels with painted icons; reduce stacked notification clutter.'],
 'team-formation':[[6,5,9,5,6],'Large POWER; gear slots; hero pedestal','Enlarge the central squad, add surrounding gear slots and one outlined POWER total.'],
 'team-presets':[[2,4,9,3,4],'Team thumbnails; slot tiles; primary action','Show three illustrated saved-squad cards with one selected Apply action.'],
 'cats-list':[[3,4,5,3,5],'Cat portraits; rarity frames; clear selected item','Replace oversized role-symbol placeholders with owned portrait art and compact rarity tiles.'],
 'hero-level-star':[[3,4,5,3,5],'Hero pedestal; stat deltas; separate upgrade focus','Give the selected hero a large pedestal and right-hand stats, with Level and Star tabs.'],
 'hero-awakening':[[1,3,4,2,3],'Readable text contrast; constellation nodes','Replace pale-on-pale help with readable nodes, cost icons and one unlock action.'],
 'hero-skills':[[3,4,5,3,5],'Large hero; skill art; clear active skill','Use a pedestal plus an illustrated skill rail; show one selected skill and its preview.'],
 'hero-bonds':[[3,4,5,3,5],'Bond portraits; connection artwork','Turn the sparse symbol row into connected companion portraits with visible bonuses.'],
 'hero-gear':[[3,4,5,3,5],'Equipment around hero; rarity tiles','Arrange four gear slots around the hero and show selected item deltas.'],
 'bag-gear':[[4,5,6,4,6],'Pantry backdrop; large item; rarity frames','Use a pantry shelf grid and a larger selected item; preserve costs and before/after stats.'],
 'bag-item-detail':[[1,3,4,2,2],'Readable contrast; affix icons; item focus','Replace the low-contrast text popup with an item plate and short affix chips; move explanations to help.'],
 'forge-enhance':[[4,6,5,4,5],'Workshop; hammer; success feedback','Give Enhance a workshop scene, focused item, cost tiles and visible success odds.'],
 'forge-fusion':[[2,4,7,3,4],'Anvil; input slots; output preview','Arrange ingredients around an anvil; show deterministic output and cost before confirm.'],
 'bag-materials':[[2,3,8,3,4],'Material tiles; useful grouping; item detail','Replace the isolated number and select with pantry tiles and selectable material details.'],
 'bag-manage':[[2,3,2,2,4],'Rarity tiles; batch-use controls; compact help','Replace paragraphs with material tiles; add real Min/-10/-/+/+10/Max controls for usable stacks.'],
 'bag-consumables':[[2,4,2,2,4],'Supply icons; recipient portrait; primary action','Use a selected recipient portrait and supply tiles; move recipes and explanations into focused subpanels.'],
 'invitations':[[5,6,8,5,5],'Shop counter; invitation object; concise action rail','Keep the mascot, add a shop backdrop and one primary pull action with adjacent config odds.'],
 'invitations-rates':[[2,3,3,3,2],'Readable contrast; clear rarity labels','Repair pale-on-pale numbers; use rarity tiles and explicit percentage columns.'],
 'invitations-reveal':[[5,6,5,5,6],'Unobstructed cards; rarity burst; focused reveal','Dim the recruitment controls and give the card flip its own stage and skip icon.'],
 'invitations-ten-results':[[6,6,3,6,6],'Compact shard tags; collect action; full card visibility','Remove repeated rarity words; use corner shard counts and one Collect action.'],
 'season-track-countdown-edition':[[3,4,8,3,5],'Real reward track; garden scene; progress nodes','Replace Play/Collect/Grow placeholder with a config-backed bound reward track and claim states.'],
 'season-guide':[[3,4,6,3,5],'Illustrated season help; concise timing line','Explain content/contract timing in one short line and move details to the guide.'],
 'economy-flow':[[3,4,5,3,5],'Faucet/sink links; live numbers; painted objects','Draw flows from the final rules config; use jar, spool and furnace objects with numeric live counters.'],
 'economy-allocation':[[1,5,8,2,4],'Game-styled chart; allocation icons','Keep the accurate allocation shares; replace the plain table with a legible illustrated chart.'],
 'economy-fees':[[1,3,9,2,4],'Fee preview tiles; retained-versus-burn split','Show fee components with coin icons and distinct retained/burned totals; preserve risk access.'],
 'economy-odds':[[1,4,7,2,4],'Rarity tiles; focused odds categories','Show one odds category at a time with rarity colors; all numbers remain rules-derived.'],
 'field-guide':[[3,6,7,3,5],'Mascot; illustrated lessons; icon navigation','Replace native chapter select with illustrated category tiles; keep concise explanation pages.'],
 'settings':[[3,4,7,3,4],'Grouped controls; compact save tray; language access','Use icon settings groups, move save import/export to a tray, and expose audio and tutorial controls clearly.'],
 'settings-audio':[[3,4,6,3,4],'Integrated mixer; bus icons; large sliders','Move the floating narrow mixer into the settings panel with painted bus icons and accessible sliders.'],
 'quests-daily':[[3,5,8,4,5],'Reward chests; rarity frames; selected claim','Use a seven-stop reward path with one selected Claim action and completed markers.'],
 'events':[[3,4,8,3,4],'Distinct event destination; event art; timer','The Events entry currently opens the daily login tab; provide an actual event panel and event progress.'],
 'chapter-map':[[6,7,8,6,6],'Painted parchment; drop preview; sweep quantity','Keep the route hierarchy; add original parchment art, node rewards and x10 sweep where rules allow.'],
 'battle-prep':[[5,6,8,5,6],'Loadout rail; primary focus; reward preview','Rebuild the owned preparation wrapper with gear slots and one Fight action; leave battle rendering to A.'],
 'victory':[[4,6,8,4,4],'VICTORY plate; radial burst; reward tiles','Use the result kit around the owned overlay, add reward tiles and flying currency feedback.'],
 'defeat':[[4,6,8,4,4],'DEFEAT plate; useful next action; coherent frame','Use the defeat plate and companion pose; highlight Improve or Return and keep tactical notes in help.'],
 'error-offline':[[7,5,8,5,5],'Visible retry action; readable status','Add a compact connection toast with a real Retry control and preserve player progress.'],
 'wallet-panel':[[3,4,6,3,4],'Wallet object; compact account controls','Use a wallet card and icon controls; keep balances, signing meaning and no-real-value notice readable.'],
 'market-browse':[[2,3,8,2,3],'Shop backdrop; rarity tiles; icon navigation','Replace the broad empty panel with a shop grid, compact filters and an item preview.'],
 'market-buy':[[2,3,9,2,2],'Pre-purchase confirmation; receipt plate; scaled close control','Add a cost confirmation before submitting; replace the oversized close glyph with a compact receipt frame.'],
 'market-my-listings':[[1,2,8,1,3],'Empty-state mascot; listing tiles','Show a helpful empty state or owned listing tiles with one List action.'],
 'market-list':[[2,3,8,2,2],'Listing dialog; contained controls; price preview','Use a focused item listing dialog; constrain inherited icon dimensions and show proceeds/fee split.'],
 'wallet-cafe':[[4,4,5,3,4],'Café objects; at most six visible navigation icons','Replace stacked text rails with a café scene whose objects open Deed, jar, press, anvil and ledger actions.'],
 'wallet-deed':[[4,4,5,3,4],'Deed scroll; mint preview; quest progress','Use a Deed scroll object with visible eligibility and one mint action.'],
 'wallet-withdraw':[[1,3,5,2,3],'Withdraw jar; amount controls; fee preview','Use quantity controls and an explicit retained-fee/net-received preview beside the jar.'],
 'wallet-seal':[[2,3,4,2,3],'Seal press; selected item; rarity/cost tiles','Show selectable eligible gear around a seal press and one confirm action with cost.'],
 'wallet-fusion':[[2,3,3,2,3],'Fusion anvil; matching slots; output preview','Show three matched input slots, required thread and burn cost, deterministic output and one confirm.'],
 'wallet-spool':[[2,3,5,2,3],'Café skin preview; spool cost tile','Show the actual decoration benefit with a compact spool cost and selected unlock action.'],
 'wallet-history':[[1,2,3,1,3],'Ledger; transaction type icons; readable receipts','Replace hash columns with compact receipt cards; retain full hashes and explorer links in details.'],
 'wallet-style':[[2,3,8,2,3],'Large cosmetic preview; painted swatches','Show an enlarged own-art cosmetic preview and three illustrated palette swatches.'],
 'wallet-ornament-forge':[[2,3,8,2,3],'Workshop art; input items; visible output','Replace generic orbit line art with a forge preview, ingredient tiles and deterministic costs.'],
 'wallet-offline':[[2,3,8,2,3],'Consistent error state; compact rail','Keep retry visible in a clear error banner while retaining the selected on-chain action.'],
};
const references={home:'f0509',dialog:'f1229',formation:'f0317',hero:'f1949',bag:'f0185',forge:'f1349',gacha:'f0869',season:'f2309',economy:'f2309',guide:'f1709',settings:'f1949',quest:'f0749',map:'f0113',result:'f0209',error:'f0509',wallet:'f2309',market:'f1709'};
const stateReferences={'landing':'f0005','battle-prep':'f0221','bag-item-detail':'f0137','bag-manage':'f1229','bag-materials':'f0125','bag-consumables':'f0125','hero-level-star':'f1949','hero-awakening':'f1469'};
const raw=[read('UI-AUDIT-RAW.json'),read('UI-AUDIT-CHAIN-RAW.json')];
if(raw.some(r=>r.errors.length))throw Error('Capture errors must be resolved before publishing the audit');
const screens=raw.flatMap(r=>r.screens).map(r=>{
 const [scores,missing,fix]=judgments[r.id]??(()=>{throw Error(`Unreviewed state ${r.id}`)})();
 return {...r,scores:Object.fromEntries(dimensions.map((d,i)=>[d,scores[i]])),averageScore:scores.reduce((a,b)=>a+b)/5,
  missingElements:missing.split('; '),fixes:[fix,...(r.visibleWords>25?[`Reduce visible words from ${r.visibleWords} to at most 25 without hiding required costs or odds.`]:[]),...(r.plainTextButtons>2?[`Replace ${r.plainTextButtons} plain buttons with illustrated controls; at most two remain.`]:[])],
  referenceFrames:[`/Users/bao/tools/omg-ref-2026-11-12/v1/${stateReferences[r.id]??references[r.family]}.jpg`],comparisonSheet:`/Users/bao/tools/omg-ref-2026-11-12/compare/b2-ui-review/${r.id}.jpg`};
});
const result={capturedAt:'2026-11-13',viewport:{width:1280,height:720},method:'Actual rendered local screens, settled lazy content; visible DOM text with numeric runs excluded and overlay occlusion checked. Scores are explicit visual judgments, not an automated quality claim. Local account fixtures and Anvil only. No reference pixels enter the repository.',screens,
 absentOrCombined:['Hero information/level/star share the collection Growth panel; recorded as cats-list and hero-level-star rather than invented separate screens.','Batch-use quantity dialog is absent; bag-manage records the existing destination and the missing control.','Market item preview/listing/confirmation are embedded or absent; market-browse/list/buy record the actual destinations.','Season track/countdown/edition supply share one panel; the track is a placeholder.','Settings has no language selector.','Events currently routes to daily gifts.','No separate reward/level-up overlay exists in the owned result flow; victory records the existing wrapper.'],
 pendingAcceptance:'U1 is a baseline audit. No screen is claimed rebuilt or accepted by U3.'};
writeFileSync(`${dir}/UI-AUDIT.json`,JSON.stringify(result,null,2)+'\n');
writeFileSync(`${dir}/UI-AUDIT.md`,'# Non-battle UI baseline audit\n\n'+result.method+'\n\n'+screens.length+' states inspected. Reference comparisons are private files outside git. The home artwork is strongest; collection, bag dialogs, receipts and the nested Fuji rails need structural work. Several help dialogs have pale text on pale panels. A short word count alone does not imply legibility.\n\n## Missing or combined surfaces\n\n'+result.absentOrCombined.map(x=>'- '+x).join('\n')+'\n\n## Per-state measurements and fixes\n\nScores below are art / hierarchy / text / game feel / consistency, each out of ten. Counts exclude numeric runs; literal transaction hashes can still contribute letter tokens.\n\n| State | Words | Plain / icon controls | Scores | Missing elements and fix |\n|---|---:|---:|---|---|\n'+screens.map(r=>`| ${r.id} | ${r.visibleWords} | ${r.plainTextButtons} / ${r.iconTiles} | ${Object.values(r.scores).join(' / ')} | ${r.missingElements.join('; ')}. ${r.fixes.join(' ')} |`).join('\n')+'\n\nAll original captures are in shots/ui-before. UI-AUDIT.json records each screenshot hash, measured text, controls, fonts, notes, fixes and private comparison path. The replacement kit must be generated from text and our own images only.\n');
console.log(`${screens.length} audited states; ${screens.filter(r=>r.visibleWords>25).length} exceed word budget; ${screens.filter(r=>r.plainTextButtons>2).length} exceed button budget.`);
