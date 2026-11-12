import {expect,it} from 'vitest';
import {generatePrivateKey} from 'viem/accounts';
import {getAddress} from 'viem';
import {migratedDb} from './game-db';
import {createItems,type ItemStore,type SealIntent,type ChainInventory} from '../../functions/_shared/chain-items';
import {voucherSigner} from '../../functions/_shared/relic';
it('new quotes use the trial; atomic reservations preserve original costs on activation and rollback',async()=>{
  const db=await migratedDb();
  try{
    const one=async<T>(sql:string,args:unknown[]=[]) => (await db.query<{r:T}>(sql,args)).rows[0]!.r;
    const wallet=getAddress('0x'+'4'.repeat(40)),nft=getAddress('0x'+'5'.repeat(40));
    const player=await one<string>('select public.upsert_player_by_wallet($1) r',[wallet.toLowerCase()]);
    const store:ItemStore={inventory:(p,w)=>one<ChainInventory[]>('select public.chain_item_inventory($1,$2) r',[p,w]),
      reserve:(p,w,i,t,r,c)=>one<SealIntent>('select public.chain_seal_reserve($1,$2,$3,$4,$5,$6) r',[p,w,i,t,r,c]),
      finalize:(p,i)=>one<SealIntent>('select public.chain_seal_finalize($1,$2) r',[p,i])};
    let payment=0n;
    const deps={store,signer:voucherSigner(generatePrivateKey(),nft),paid:async()=>payment,nonceUsed:async()=>false};
    const standard=createItems(deps),trial=createItems({...deps,sealPolicy:'basket-trial-v1'});
    const add=async(source:string)=>one<string>("insert into chain_inventory(player_id,item_id,source,earned_level) values($1,'hearthloom-weapon-epic',$2,2) returning id r",[player,source]);
    const first={action:'reserve',inventory:await add('first')};
    const old=await standard(player,wallet,first);
    expect(old.intent?.cost).toBe('10000000000000000000');
    expect(await trial(player,wallet,first)).toEqual(old);
    const second={action:'reserve',inventory:await add('second')};
    const fresh=await trial(player,wallet,second);
    expect(fresh.intent?.cost).toBe('5000000000000000000');
    expect(await standard(player,wallet,second)).toEqual(fresh);
    expect((await trial(player,wallet,{action:'inventory'})).sealPolicy).toBe('basket-trial-v1');
    expect((await standard(player,wallet,{action:'inventory'})).sealPolicy).toBe('standard-v1');
    payment=5n*10n**18n;
    await expect(trial(player,wallet,{action:'finalize',intent:old.intent!.id})).rejects.toThrow('seal_unpaid');
    expect((await standard(player,wallet,{action:'finalize',intent:fresh.intent!.id})).voucher?.relicId).toBe(20020n);
    payment=10n*10n**18n;
    expect((await trial(player,wallet,{action:'finalize',intent:old.intent!.id})).voucher?.relicId).toBe(20020n);
    expect((await store.inventory(player,wallet.toLowerCase())).every(i=>i.state==='consumed')).toBe(true);
  }finally{await db.close();}
});
