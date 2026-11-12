import {describe,it,expect} from 'vitest';
import {ITEMS,STACK_ITEMS,RECIPES,CARDS,SCARCITY} from './catalog';
import {TRADE_RULES,TRADE_BY_ID,CHAIN_ITEM_IDS,sealedEquipment,sealCost} from './trade';
import {powerScoreA6} from './depth/power-a6';
const power=(i:typeof ITEMS[number],card:typeof CARDS[number])=>{const stats={...card.baseStats};for(const a of [i.main,...i.affixes])stats[a.stat]+=a.value;return powerScoreA6(stats);};
describe('Fuji trading policy',()=>{
  it('classifies every catalog item and cat and assigns unique immutable token IDs',()=>{
    for(const i of [...ITEMS,...STACK_ITEMS])expect(TRADE_RULES.filter(r=>r.id===i.id)).toHaveLength(1);
    for(const relic of SCARCITY)expect(TRADE_BY_ID[relic.id]?.tokenId).toBe(relic.relicId);
    for(const c of CARDS)expect(TRADE_BY_ID[`cat:${c.id}`]?.tradable).toBe(false);
    expect(new Set(CHAIN_ITEM_IDS).size).toBe(CHAIN_ITEM_IDS.length);
    expect(TRADE_BY_ID['star-thread']?.tokenId).toBe(10001);
    expect(TRADE_BY_ID['hearthloom-weapon-epic']?.tokenId).toBe(20020);
  });
  it('keeps farmable resources, achievement proof, XP and ordinary gear bound',()=>{
    for(const id of ['fish','threads','essence','stamps','xp','boss-proof','pantry-key','milk-tonic'])expect(()=>sealCost(id)).toThrow('Bound');
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
});
