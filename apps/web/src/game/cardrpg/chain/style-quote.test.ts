import {describe,it,expect} from 'vitest';
import {keccak256,toBytes,type Address} from 'viem';
import {YARN_STYLES,cosmeticIntentText} from '@taskbar-hero/chain';
import {validateStyleQuote} from './style-quote';
const wallet=('0x'+'1'.repeat(40)) as Address,token=('0x'+'2'.repeat(40)) as Address;
const order={id:'11111111-2222-3333-4444-555555555555',player_id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  wallet,token,sku:'fern' as const,cost:YARN_STYLES[0].cost,paid_at:null};
const quote={order,hash:keccak256(toBytes(cosmeticIntentText(token,order.id)))};
const context={wallet,token,sku:'fern' as const};
describe('cosmetic signing quote',()=>{
  it('accepts exactly the displayed catalog purchase and the same recovered intent',()=>{
    expect(validateStyleQuote(quote,context)).toEqual(quote);
    const recovered={...quote,order:{...order,paid_at:'2026-11-12T12:00:00Z'}};
    expect(validateStyleQuote(recovered,context)).toEqual(recovered);
  });
  it.each([{cost:'1'},{cost:'4000000000000000001'},{cost:4},{token:wallet},{wallet:token},
    {sku:'tide'},{id:'bad'},{player_id:'bad'},{paid_at:'bad'}])('rejects mismatched order %j before signing',patch=>{
    expect(()=>validateStyleQuote({...quote,order:{...order,...patch}},context)).toThrow('Quote changed. Retry.');
  });
  it('rejects sealing/foreign deployment hashes and malformed responses',()=>{
    for(const input of [null,[],{},'quote',{...quote,hash:keccak256(toBytes(order.id))},
      {...quote,hash:keccak256(toBytes(cosmeticIntentText(wallet,order.id)))}])
      expect(()=>validateStyleQuote(input,context)).toThrow('Quote changed. Retry.');
  });
});
