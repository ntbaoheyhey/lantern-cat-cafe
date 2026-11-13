import {GameIcon} from '../../../ui/GameIcon';
import {ECONOMY_V3 as E} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import type {ReactNode} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {CARD_RPG_CONFIG,emptyPity,RARITY_ORDER} from '@taskbar-hero/game-rules/cardrpg';
import {HelpC2} from './TextDietC2';
import {GearArtA6} from './KeepsakeArtA6';
import {artPropsA6} from './art-a6';

const icons:Record<string,string>={fish:'fish',threads:'thread',stamps:'bell',essence:'season',materials:'bag',seals:'boss-seal'};
const percent=(value:number)=>`${Number((value*100).toFixed(4))}%`;
export function OddsC2({source,children}:{source:string;children:ReactNode}){
 return <HelpC2 label={`${source} odds`} title="Odds" symbol={<><GameIcon name="season" size={20}/> %</>}><div className="c2-odds">{children}</div></HelpC2>;
}
function RarityRates({base,next}:{base:Record<string,number>;next:Record<string,number>}){
 return <table aria-label="Base and current rarity probabilities"><thead><tr><th aria-label="Rarity">Rarity</th><th aria-label="Base probability">Base</th><th aria-label="Current probability">Next</th></tr></thead><tbody>{RARITY_ORDER.map(rarity=><tr key={rarity}><th scope="row" aria-label={rarity}>{rarity}</th><td>{percent(base[rarity]!/10000)}</td><td>{percent(next[rarity]!/10000)}</td></tr>)}</tbody></table>;
}
function ExactRates({pool}:{pool:{id:string;probability:number}[]}){
 return <details><summary aria-label="Exact item probabilities"><GameIcon name="bag" size={18}/> %</summary><div className="c2-odds-pool">{pool.map(p=>{const g=R.GEAR_BY_ID[p.id],cat=R.CAT_BY_ID[p.id];return <figure key={p.id} title={g?.name??cat?.name??p.id} aria-label={`${g?.name??cat?.name??p.id}: ${percent(p.probability)}`}>{g?<GearArtA6 slot={g.slot} setId={g.setId}/>:<img {...artPropsA6(p.id,'face')} alt=""/>}<figcaption>{percent(p.probability)}</figcaption></figure>;})}</div></details>;
}
export function DropOddsC2({state,kind,chapter=state.run?.chapter??state.account.chapter}:{state:R.DepthAccount;kind?:'battle'|'elite'|'boss';chapter?:number}){
 const kinds=kind?[kind]:['battle','elite','boss'] as const;
 return <OddsC2 source="Encounter drops">{kinds.map(k=>{const q=R.gearDropPreview(state,k,chapter);return <section key={k} aria-label={`${k} gear drops`}><b aria-label={`${q.remaining} of ${q.cap} drops remain today`}>{({battle:'ATK',elite:'relic',boss:'Boss'})[k]} · {q.remaining}/{q.cap}</b><RarityRates base={q.base} next={q.odds}/><ExactRates pool={q.pool}/></section>;})}</OddsC2>;
}
export function RecruitOddsC2({state,bannerId}:{state:R.DepthAccount;bannerId:string}){
 const b=R.invitationBannerV4(bannerId,state),pity=state.account.pity[b.pityGroup]??emptyPity(),odds=R.invitationOddsV4(bannerId,pity,state);
 return <OddsC2 source="Invitation"><RarityRates base={b.oddsBp} next={odds}/><dl><div><dt aria-label="Price in stamps"><GameIcon name="bell" size={18}/>Cost</dt><dd>{b.cost.stamps}</dd></div><div><dt aria-label="Soft pity starts at draw">Soft pity</dt><dd>{b.softPity}</dd></div><div><dt aria-label="Legendary hard pity">Guaranteed</dt><dd>{Math.max(1,b.hardPity-pity.sinceLegendary)} / {b.hardPity}</dd></div>{b.featuredCardId&&<div><dt aria-label="Featured conditional chance on Legendary">Featured</dt><dd>{pity.featuredGuaranteed?'100%':'50%'}</dd></div>}{RARITY_ORDER.map(rarity=><div key={rarity}><dt aria-label={`${rarity} duplicate ${b.kind==='cat'?'shards':'salvage threads'}`}>{rarity} <GameIcon name="arrow" size={18}/> <GameIcon name={b.kind==='cat'?'shard':'thread'} size={18}/></dt><dd>{state.economyV3&&b.kind==='cat'?E.shards[rarity]:CARD_RPG_CONFIG.rarity[rarity][b.kind==='cat'?'shards':'salvage']}</dd></div>)}</dl><ExactRates pool={R.getDrawPoolV4(state,bannerId)}/></OddsC2>;
}
export function RewardOddsC2({source,reward}:{source:string;reward:Record<string,number>}){
 return <OddsC2 source={source}><b aria-label="Deterministic reward">100%</b><dl>{Object.entries(reward).map(([key,n])=><div key={key}><dt aria-label={key}><GameIcon name={icons[key]??'materials'} size={20}/></dt><dd>{n}</dd></div>)}</dl></OddsC2>;
}
export function CraftOddsC2({state,id}:{state:R.DepthAccount;id:string}){
 const g=R.GEAR_BY_ID[id]!,tier=Math.min(3,Math.max(1,Math.floor(g.level/10)+1));
 return <OddsC2 source="Tailoring"><b aria-label="Chosen template probability">100%</b><dl>{Object.entries({...R.gearCostV4(id,state),...(g.rarity==='legendary'?R.legendaryTailoringRequirements(state):{})}).map(([key,n])=><div key={key}><dt aria-label={key}><GameIcon name={icons[key]??'materials'} size={20}/></dt><dd>{n}</dd></div>)}{g.affixes.map(id=>{const a=R.AFFIX_BY_ID[id]!,[lo,hi]=a.tiers[tier-1]!;return <div key={id} title={a.name}><dt aria-label={`${a.name}: uniform integer roll`}><GameIcon name="season" size={18}/></dt><dd>{lo}–{hi} · {percent(1/(hi-lo+1))}</dd></div>;})}</dl></OddsC2>;
}
