from pathlib import Path
import hashlib,json
root=Path('/Users/bao/taskbar-hero-cardrpg-a4')
out=Path('/tmp/cardrpg-a5-b3-prep/reward-pilot-01')
files={}
def replace(path,changes):
    source=(root/path).read_text(); changed=source
    for before,after in changes:
        assert changed.count(before)==1,(path,before,changed.count(before))
        changed=changed.replace(before,after)
    target=out/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(changed)
    files[path]={'before':hashlib.sha256(source.encode()).hexdigest(),'candidate':hashlib.sha256(changed.encode()).hexdigest()}
replace('packages/game-rules/src/cardrpg/depth/state.ts',[
 ('export const DEPTH_CAPS = {fish:420,threads:90,stamps:180,essence:6};','export const DEPTH_CAPS = {fish:420,threads:90,stamps:180,essence:6};\nexport const DEPTH_CAPS_V4 = {...DEPTH_CAPS,stamps:360};\nexport const depthCaps = (state:DepthAccount) => gameplayV4(state) ? DEPTH_CAPS_V4 : DEPTH_CAPS;'),
 ('Math.min(amount,DEPTH_CAPS[id as keyof typeof DEPTH_CAPS]-state.account.daily.earned','Math.min(amount,depthCaps(state)[id as keyof typeof DEPTH_CAPS]-state.account.daily.earned'),
 ('s.account.daily.earned[id]-DEPTH_CAPS[id]','s.account.daily.earned[id]-depthCaps(s)[id]'),
])
replace('packages/game-rules/src/cardrpg/depth/meta-v4.ts',[
 ('import { DEPTH_CAPS, grantDepth','import { DEPTH_CAPS, depthCaps, grantDepth'),
 ('Math.min(n,DEPTH_CAPS[id as keyof typeof DEPTH_CAPS]-s.account.daily.earned','Math.min(n,depthCaps(s)[id as keyof typeof DEPTH_CAPS]-s.account.daily.earned'),
])
replace('packages/game-rules/src/cardrpg/depth/gacha-v4.ts',[
 ("import { RARITY_ORDER, type GachaResult }", "import { RARITY_ORDER, type GachaResult, type PityState }"),
 ("import { bannerById, emptyPity, getBannerOdds, getDrawPool, pull }", "import { bannerById, emptyPity, getBannerOdds }"),
 ('export const SELECTOR_COST_V4 = 60;', '''export const SELECTOR_COST_V4 = 24;
export const invitationBannerV4 = (id:string) => ({...bannerById(id),softPity:13,hardPity:24,softStepBp:700});
export function invitationOddsV4(id:string,pity:PityState=emptyPity()) {
 const banner=invitationBannerV4(id);
 // Old THC12 counters keep their earned credit: an over-threshold counter guarantees the next draw.
 return getBannerOdds(banner,{...pity,sinceLegendary:Math.min(pity.sinceLegendary,banner.hardPity-1)});
}'''),
 ("const b=bannerById(bannerId);let results:GachaResult[];", "const b=invitationBannerV4(bannerId);const results:GachaResult[]=[];"),
 (''' if(b.kind==='cat'){
  const r=pull(bannerId,s.account,seed,count);requireRule(r.ok,'INVALID_AMOUNT',r.ok?'':r.error.message);
  s.account=r.state;results=r.value;
 }else{
  requireRule(s.gear.length+count<=GEAR_CAP_V4,'MAX_LEVEL','Make room for the entire basket before spending.');''', ''' {
  requireRule(b.kind==='cat'||s.gear.length+count<=GEAR_CAP_V4,'MAX_LEVEL','Make room for the entire basket before spending.');'''),
 ("const pity=s.account.pity[b.pityGroup]??=emptyPity(),rng=new Rng(deriveSeed(seed,pity.totalPulls));results=[];", "const pity=s.account.pity[b.pityGroup]??=emptyPity(),rng=new Rng(deriveSeed(seed,pity.totalPulls));"),
 ("const oddsBp=getBannerOdds(b,pity),rarity=rng.weighted(oddsBp,RARITY_ORDER);", "const oddsBp=invitationOddsV4(bannerId,pity),rarity=rng.weighted(oddsBp,RARITY_ORDER);\n   if(b.kind==='cat'){\n    let pool=CARDS.filter(c=>c.rarity===rarity);\n    if(rarity==='legendary'&&b.featuredCardId){const featured=pity.featuredGuaranteed||rng.int(0,9999)<b.featuredRateBp;pool=pool.filter(c=>featured?c.id===b.featuredCardId:c.id!==b.featuredCardId);pity.featuredGuaranteed=!featured;}\n    const fresh=pool.filter(c=>!s.account.cards.some(o=>o.cardId===c.id));if(fresh.length)pool=fresh;\n    requireRule(pool.length>0,'NOT_READY','This banner has an empty rarity pool.');\n    const cat=pool[rng.int(0,pool.length-1)]!,owned=s.account.cards.find(o=>o.cardId===cat.id),shards=owned?C.rarity[rarity].shards:0;\n    if(owned)owned.shards=safeAdd(owned.shards,shards);else{s.account.cards.push({id:cat.id,cardId:cat.id,level:1,stars:1,shards:0,soulbound:true});s.account.loadouts[cat.id]={};}\n    const result:GachaResult={index:safeAdd(pity.totalPulls,1),bannerId,rarity,cardId:cat.id,duplicate:!!owned,shards,pityBefore:pity.sinceLegendary,oddsBp,soulbound:true,tradeable:false};\n    pity.totalPulls=result.index;pity.sinceLegendary=rarity==='legendary'?0:pity.sinceLegendary+1;s.account.daily.draws++;results.push(result);s.account.history.push(result);progress(s.account,'draws');continue;\n   }"),
 ("const b=bannerById(bannerId);if(b.kind==='cat')return getDrawPool(s.account,bannerId);\n const odds=getBannerOdds(b,s.account.pity[b.pityGroup]??emptyPity());", "const b=invitationBannerV4(bannerId),pity=s.account.pity[b.pityGroup]??emptyPity(),odds=invitationOddsV4(bannerId,pity);\n if(b.kind==='cat')return RARITY_ORDER.flatMap(rarity=>{\n  const rows=CARDS.filter(c=>c.rarity===rarity);\n  const group=(pool:typeof rows,chance:number)=>{const fresh=pool.filter(c=>!s.account.cards.some(o=>o.cardId===c.id)),actual=fresh.length?fresh:pool;return actual.map(c=>({id:c.id,rarity,probability:odds[rarity]/10000*chance/actual.length}));};\n  if(rarity==='legendary'&&b.featuredCardId){const chance=pity.featuredGuaranteed?1:b.featuredRateBp/10000;return [...group(rows.filter(c=>c.id===b.featuredCardId),chance),...group(rows.filter(c=>c.id!==b.featuredCardId),1-chance)];}\n  return group(rows,1);\n });"),
])
(out/'manifest.json').write_text(json.dumps({'status':'STAGED ONLY; not executed','files':files,'values':{'stampCapV4':360,'selectorCost':24,'softPity':13,'hardPity':24,'softStepBp':700},'base':'A4 P7 unchanged combat; reward-only hypothesis'},indent=2))
print(json.dumps({'staged':list(files),'sourceChanged':False}))
