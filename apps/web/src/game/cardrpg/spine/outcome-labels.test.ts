import {it,expect} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {galleryFixture} from '../depth/feel-lab';
import {presentationEvents} from '../depth/battle-presentation';
import {createCardActionPlan} from '../depth/card-action-plan';
import {statusPresentation,statusImpactLabels} from '../../squad/turn3d/card-status-beats';
import {puppetNumberRows} from '../../squad/turn3d/look-puppet-numbers';
import {visibleImpactLabel} from '../../squad/turn3d/impact-labels';
import {numberLaneWidth} from '../../squad/turn3d/card-number-lane';

it('keeps real resisted and immune outcomes readable without a false zero-damage number',()=>{
 const battle=R.createBattle(galleryFixture('marigold-1').battle.initial);
 const source=battle.actors.find(a=>a.catalogId==='marigold')!,target=battle.actors.find(a=>a.side==='enemy')!;
 target.effectResist=100000;
 R.applyStatus(battle,source,target,'scald');R.applyStatus(battle,source,target,'crumb');
 target.bonuses.controlImmuneUntil=battle.round;
 R.applyStatus(battle,source,target,'drowsy');R.applyStatus(battle,source,target,'hush');
 expect(battle.log.map(e=>e.kind)).toEqual(['resist','resist','immune','immune']);
 const plan=createCardActionPlan(presentationEvents(battle.log,battle,'marigold-3'),'marigold-3');
 expect(plan.targetIds).toEqual([target.id]);
 const before=JSON.stringify({battle,plan}),presentation=statusPresentation(plan,battle.log);
 const labels=statusImpactLabels(plan,target.id,presentation).filter(visibleImpactLabel);
 const canvas=puppetNumberRows(plan,presentation);
 expect(labels.map(e=>e.note)).toEqual(['Resisted','Immune']);
 expect(canvas).toHaveLength(1);expect(canvas[0]!.labels.map(e=>e.text)).toEqual(['Resisted','Immune']);
 expect(puppetNumberRows(plan)[0]!.labels.map(e=>e.text)).toEqual(['Resisted','Immune']);
 expect(canvas[0]!.labels.length).toBe(labels.length);expect(numberLaneWidth(labels)).toBe(92);
 expect(labels.every(e=>e.type==='fizzle'&&e.amount===0)).toBe(true);
 expect(presentation.beats).toEqual([]);expect(plan.events.some(e=>e.type==='damage')).toBe(false);
 expect(JSON.stringify({battle,plan})).toBe(before);
});

it('keeps damage totals, failed status and applied status as separate rows',()=>{
 const {plan}=galleryFixture('cinnamon-1'),damage=plan.events.find(e=>e.type==='damage')!;
 const target=damage.targetIds[0]!;
 plan.events.push({...damage,type:'fizzle',seq:900,amount:0,note:'Button Guard resisted Burn'});
 const labels=puppetNumberRows(plan).find(row=>row.id===target)!.labels;
 expect(labels.some(e=>e.type==='damage'&&e.text.startsWith('−'))).toBe(true);
 expect(labels.filter(e=>e.type==='fizzle').map(e=>e.text)).toEqual(['Resisted']);
 expect(labels.some(e=>e.type==='status_apply')).toBe(true);
});
