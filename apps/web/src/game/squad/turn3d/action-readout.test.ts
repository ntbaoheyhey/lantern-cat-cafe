import {it,expect} from 'vitest';
import {actionSentences} from './ActionReadout';
import {createEffectFixture} from './fixtures';
import {createActionPlan} from './effects';
it('reads resolved actions as sentences and preserves exact HP values',()=>{
 const f=createEffectFixture('shieldBash');const lines=actionSentences(f.events,f.battle.actors);
 expect(lines.some(x=>x.text.includes('Mochi used Shield Bash'))).toBe(true);
 for(const e of f.events.filter(e=>e.type==='damage'&&e.amount))expect(lines.some(x=>x.text.includes(`lost ${e.amount} HP`))).toBe(true);
});
it('reserves at least 600ms anticipation for every player and enemy action',()=>{
 for(const id of ['guardianBasic','shieldBash','rally','hearthwall','witchBasic','threadSnare','emberOrb','lanternstorm','alchemistBasic','milkFlask','mossFlask','nineLives','guardAttack','flankerAttack','rangerAttack','chargerAttack','eliteAttack','yarnAttack']){
  const plan=createActionPlan(createEffectFixture(id).events);expect(plan.beats[0]!.duration,id).toBeGreaterThanOrEqual(600);
 }
});
