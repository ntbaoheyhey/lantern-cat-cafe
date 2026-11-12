import {writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadModules,root} from './local.mjs';
const m=await loadModules();
try {
const origin=new URL(JSON.parse(readFileSync(resolve(root,'apps/web/public/relics/3.json'),'utf8')).image).origin;
for(const r of m.TRADE_RULES.filter(r=>r.tokenId>=10000)){
 const metadata={name:r.name,description:'Testnet — no real value. Sealed game item on Avalanche Fuji. Ownership grants no combat premium.',image:`${origin}/chain/${r.kind==='material'?'star-thread':'sealed-gear'}.svg`,attributes:[{trait_type:'Rarity',value:r.rarity},{trait_type:'Type',value:r.kind},{trait_type:'Chain',value:'Avalanche Fuji 43113'}]};
 for(const id of [String(r.tokenId),r.tokenId.toString(16).padStart(64,'0')])writeFileSync(resolve(root,`apps/web/public/relics/${id}.json`),JSON.stringify(metadata,null,2)+'\n');
}
writeFileSync(resolve(root,'docs/design/chain/TRADE-RULES.md'),`# Item trading — Fuji only
Testnet — no real value. Sources: [research, Item trading](TOKENOMICS-RESEARCH.md#item-trading--ten-read-sources).

## Policy
Sale fee 5% (500 bps): 40% of the fee to burn/native sink, 60% treasury. YARN seal burns 10% of fixed reference value. These are prototype hypotheses, benchmarked in T1–T5, not market valuations. No floor, ceiling, deposit or volume rewards. Fee rate is immutable at deployment (max 10%); cancellation costs only gas. Integer math rounds down the total fee and burned share; treasury gets the remainder. V1 and direct transfers can bypass V2 fees.

Three seals per account/UTC day, level 2 from authoritative progression, 10-minute V2 relisting delay after purchase. These limit issuance velocity and casual cycling; wallets and shared faucet funding are not human identity. No listing deposit: friction is already supplied by the seal burn and gas. Suspicious same-pair round trips, self-funded transfers, new-wallet clusters and abnormally concentrated volume should be reviewed, never automatically punished based only on price or common sponsor (T6–T8). No trading-volume rewards to farm.

The fixed server-run boss grants one original Star Thread/account and authoritative level 2. Its 20-YARN reference makes a seal cost 2 YARN. Ordinary offline campaign saves, localStorage edits and imported saves never create transferable inventory. The boss-proof achievement stays bound. Existing Epic/Legendary templates are catalog-eligible, but campaign issuance awaits C2 server authority; no client inventory can seal them today. Depth seals normalize to an unenhanced template with minimum affix rolls and the same set/unique effects. Normalization requires explicit disclosure before a future authority adapter consumes rolled gear. All 64 Epic+ templates are checked against reachable same-tier gear at levels 1/10/30 within 5% Power; the current chain Treasure slot is cosmetic with zero combat effect (stronger than the <=3pp requirement).

## Ownership and recovery
Reserve locks one inventory row under a transaction lock and daily cap. YARN.seal burns once per player/intent. The server checks the immutable on-chain amount, consumes the source row and signs an ERC-1155 voucher. Renewals always use the same nonce; crash/retry cannot mint twice. Consumed means removed from off-chain inventory even before mint. No unsealing. Browser loss can recover the intent with the same SIWE wallet; guest-key loss cannot be recovered by the server. The chain bag reads balanceOfBatch on load and Transfer events; escrow, sales and direct transfers remove usable ownership. RelicNFT has no burn API: future forge item sinks must use irrecoverable custody and be tracked separately from token supply.

## Reserved ID ranges
1–4 existing Relics; 10000–19999 materials (10001 Star Thread); 20000–29999 gear. Stable gear IDs encode explicit set codes 0–7, rarity and slot; the original 20020–20233 IDs remain unchanged. The union covers all 128 Depth templates and the 48 overlapping legacy templates exactly once; unknown sets fail closed. Rarity indexes are 0 common, 1 rare, 2 epic, 3 legendary. No new NFT contract. Original game resources remain off chain.

## Complete catalog decision table
| Item ID · name | Class | Token ID | Reference YARN | Reason |
|---|---|---:|---:|---|
${m.TRADE_RULES.map(r=>`| ${r.id} · ${r.name} | ${r.tradable?'TRADABLE':'BOUND'} | ${r.tokenId??'—'} | ${r.tradable?r.referenceYarn:'—'} | ${r.reason} |`).join('\n')}

Generated from packages/game-rules/src/cardrpg/trade.ts by tools/chain/trade-doc.mjs. Every current gear, stack item, cat and soft resource is classified; unknown IDs are bound by default. C2 owns stats/drop tables. Research T9 informs filters and visible fee/proceeds.
`);
} finally {await m.close();}
