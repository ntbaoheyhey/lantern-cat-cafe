import {expect,it} from 'vitest';
import {keccak256,toBytes} from 'viem';
import {readSealPolicy,sealPrice} from '@taskbar-hero/chain';
import {TRADE_RULES,sealCost} from '@taskbar-hero/game-rules/cardrpg';
import {displayedSealCost,displayedForgeBudget,validateSealQuote,type SealInventory} from './seal-quote';
const id='11111111-1111-4111-8111-111111111111',inventory='22222222-2222-4222-8222-222222222222';
const item:SealInventory={id:inventory,item_id:'star-thread',state:'available',seal:null};
const hash=keccak256(toBytes(`taskbar-hero:seal:v1:${id}`));
const fixture=()=>({intent:{id,inventory_id:inventory,item_id:item.item_id,token_id:10001,rarity:1,cost:'2000000000000000000'},hash});
it('preserves every standard catalog quote and halves only the explicit trial',()=>{
  expect(readSealPolicy(undefined)).toBe('standard-v1');
  for(const r of TRADE_RULES.filter(r=>r.tradable)){
    expect(sealPrice(r.referenceYarn)).toBe(sealCost(r.id));
    expect(sealPrice(r.referenceYarn,'basket-trial-v1')*2n).toBe(sealCost(r.id));
  }
  for(const v of [null,500,'5%',{},'toString','__proto__'])expect(()=>readSealPolicy(v)).toThrow('Quote changed');
});
it('displays pending prices unchanged across both trial activation and rollback',()=>{
  expect(displayedSealCost(item,'basket-trial-v1')).toBe(10n**18n);
  expect(displayedSealCost({...item,seal:{id,cost:'2000000000000000000'}},'basket-trial-v1')).toBe(2n*10n**18n);
  expect(displayedSealCost({...item,seal:{id,cost:'1000000000000000000'}},'standard-v1')).toBe(10n**18n);
  for(const cost of ['0','-1','3','1e18','2000000000000000001'])expect(()=>displayedSealCost({...item,seal:{id,cost}},'standard-v1')).toThrow();
});
it('binds the payment to exactly the displayed item, price, reservation and hash',()=>{
  expect(validateSealQuote(fixture(),item,2n*10n**18n)).toEqual({id,hash,cost:2n*10n**18n});
  for(const change of [{id:inventory},{inventory_id:id},{item_id:'boss-proof'},{token_id:20020},{rarity:3},
    {cost:'1000000000000000000'},{cost:'3000000000000000000'},{cost:2000000000000000000}]){
    const q=fixture();Object.assign(q.intent,change);
    expect(()=>validateSealQuote(q,item,2n*10n**18n)).toThrow('Quote changed');
  }
  expect(()=>validateSealQuote({...fixture(),hash:'0x'+'a'.repeat(64)},item,2n*10n**18n)).toThrow();
  expect(()=>validateSealQuote(fixture(),{...item,seal:{id:inventory,cost:'2000000000000000000'}},2n*10n**18n)).toThrow();
});
it('full recipe cost includes older reserved inputs while excluding consumed or non-Epic sources',()=>{
  const epic:SealInventory={...item,item_id:'hearthloom-weapon-epic',state:'reserved',seal:{id,cost:'10000000000000000000'}};
  const second={...epic,id,seal:null,state:'available'};
  expect(displayedForgeBudget(0n,[epic,second,item],'basket-trial-v1').total).toBe(18n*10n**18n);
  expect(displayedForgeBudget(0n,[{...epic,state:'consumed'},second],'basket-trial-v1').total).toBe(13n*10n**18n);
  expect(displayedForgeBudget(2n,[epic],'basket-trial-v1').total).toBe(3n*10n**18n);
  expect(displayedForgeBudget(0n,[],'standard-v1').total).toBe(23n*10n**18n);
});
