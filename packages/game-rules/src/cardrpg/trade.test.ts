import {describe,it,expect} from 'vitest';
import {ITEMS,STACK_ITEMS,RECIPES,CARDS,SCARCITY} from './catalog';
import {TRADE_RULES,TRADE_BY_ID,CHAIN_ITEM_IDS,sealedEquipment,sealedDepthEquipment,sealedGearInstance,equipmentTokenId,sealCost} from './trade';
import {powerScoreA6} from './depth/power-a6';
import {GEAR,makeGear,AFFIX_BY_ID} from './depth/equipment';
import {createDepthAccount} from './depth/state';
import {setGameplayA6} from './depth/gameplay-a6';
import {powerV4} from './depth/equipment-v4';
const power=(i:typeof ITEMS[number],card:typeof CARDS[number])=>{const stats={...card.baseStats};for(const a of [i.main,...i.affixes])stats[a.stat]+=a.value;return powerScoreA6(stats);};
describe('Fuji trading policy',()=>{
  it('classifies every catalog item and cat and assigns unique immutable token IDs',()=>{
    for(const i of [...ITEMS,...GEAR,...STACK_ITEMS])expect(TRADE_RULES.filter(r=>r.id===i.id)).toHaveLength(1);
    expect(new Set(TRADE_RULES.map(r=>r.id)).size).toBe(TRADE_RULES.length);
    for(const relic of SCARCITY)expect(TRADE_BY_ID[relic.id]?.tokenId).toBe(relic.relicId);
    for(const c of CARDS)expect(TRADE_BY_ID[`cat:${c.id}`]?.tradable).toBe(false);
    expect(new Set(CHAIN_ITEM_IDS).size).toBe(CHAIN_ITEM_IDS.length);
    expect(TRADE_BY_ID['star-thread']?.tokenId).toBe(10001);
    expect(TRADE_BY_ID['hearthloom-weapon-epic']?.tokenId).toBe(20020);
    expect(TRADE_BY_ID['mossbrew-relic-legendary']?.tokenId).toBe(20233);
    expect(TRADE_BY_ID['velvetrim-relic-legendary']?.tokenId).toBe(20733);
    for(const i of GEAR)expect(TRADE_BY_ID[i.id]?.tradable).toBe(['epic','legendary'].includes(i.rarity));
    expect(equipmentTokenId({...GEAR[0]!,id:'invented-weapon-epic',setId:'invented',rarity:'epic'})).toBeUndefined();
    expect(equipmentTokenId({...GEAR[0]!,id:'forged-id',rarity:'epic'})).toBeUndefined();
  });
  it('keeps farmable resources, achievement proof, XP and ordinary gear bound',()=>{
    for(const id of ['fish','threads','essence','stamps','xp','boss-proof','pantry-key','milk-tonic','materials','seals','selector-marks','route-points'])expect(()=>sealCost(id)).toThrow('Bound');
    expect(()=>sealCost('invented-client-drop')).toThrow('Bound');
    for(const i of ITEMS)expect(TRADE_BY_ID[i.id]?.tradable).toBe(['epic','legendary'].includes(i.rarity));
    expect(sealCost('star-thread')).toBe(2n*10n**18n);
  });
  it('sealed gear stays within 5% Power of a same-tier grindable catalog alternative',()=>{
    // All templates are available through earned-stamp equipment pulls; Epic also has deterministic recipes.
    for(const id of CHAIN_ITEM_IDS){const item=sealedEquipment(Number(id));if(!item)continue;
      const alternatives=ITEMS.filter(x=>x.rarity===item.rarity&&x.slot===item.slot&&x.fit.some(role=>item.fit.includes(role)));
      for(const card of CARDS.filter(c=>item.fit.includes(c.role))){const best=Math.max(...alternatives.filter(x=>x.fit.includes(card.role)).map(x=>power(x,card)));expect(power(item,card)).toBeLessThanOrEqual(best*1.05);}
      expect(item).toEqual(ITEMS.find(x=>x.id===item.id));
      if(item.rarity==='epic')expect(RECIPES.some(r=>r.outputItemId===item.id)).toBe(true);
    }
    expect(sealedEquipment(999999)).toBeUndefined();
  });
  it('all 64 Depth Epic+ templates normalize below reachable same-tier gear without changing unique effects',()=>{
    const ids=CHAIN_ITEM_IDS.filter(id=>sealedDepthEquipment(Number(id)));
    expect(ids).toHaveLength(64);
    for(const id of ids){
      const template=sealedDepthEquipment(Number(id))!,sealed=sealedGearInstance(Number(id))!;
      expect(template).toEqual(GEAR.find(g=>g.id===sealed.templateId));
      expect(sealed.enhancement).toBe(0);
      for(const affix of sealed.affixes)expect(sealed.rolls[affix]).toBe(AFFIX_BY_ID[affix]!.tiers[sealed.tier-1]![0]);
      for(const level of [1,10,30]){
        const state=setGameplayA6(createDepthAccount(71),true);
        for(const card of state.account.cards)card.level=level;
        const earned=makeGear(state,template.id,117);
        for(const cat of state.team){
          const score=(gear:typeof earned)=>powerV4({...state,gear:[gear],equipment:{[cat]:{[template.slot]:gear.id}}},cat).total;
          expect(score(sealed)).toBeLessThanOrEqual(score(earned)*1.05);
        }
      }
    }
    expect(sealedGearInstance(10001)).toBeUndefined();
    expect(sealedDepthEquipment(999999)).toBeUndefined();
  });
});
