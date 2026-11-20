import {CATS, ENEMIES, STATUS_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {EQUIPMENT_SLOTS,CURRENCY_IDS} from '@taskbar-hero/game-rules/src/cardrpg/contract';
import {CUE_ALIASES,type Bus} from './cues';

/** Authoring plan, not proof of shipped assets or connected controls. S3/S6 supply those. */
export const SOUND_SCREENS = [
  'landing', 'sign-in', 'home', 'team', 'cats', 'hero-info', 'hero-level', 'hero-star', 'hero-gear',
  'bag', 'item-detail', 'batch-use', 'forge-enhance', 'forge-fusion', 'invitations', 'gacha-rates',
  'gacha-reveal', 'gacha-results', 'market', 'market-item', 'market-list', 'market-buy', 'my-listings',
  'season', 'season-supply', 'economy', 'field-guide', 'coach', 'settings', 'wallet', 'deed',
  'withdraw', 'seal', 'chain-fusion', 'spool', 'history', 'chapter-map', 'stage-select', 'battle-prep',
  'battle', 'boss', 'victory', 'defeat', 'reward', 'level-up', 'quests', 'events', 'error', 'offline',
] as const;
export type SoundScreen = typeof SOUND_SCREENS[number];
export type LayerRole = 'transient'|'body'|'tail'|'sweetener'|'foley'|'voice-grain'|'consonant'|'ambience'|'music';
export interface LayerPlan {
  role: LayerRole;
  pool: string;
  variants: number;
  offsetMs: number;
  eq: 'flat'|'high-pass-1800'|'low-shelf-180'|'high-pass-80';
}
export interface SoundMapRow {
  screen: SoundScreen;
  event: string;
  cueId: string;
  bus: Exclude<Bus,'master'>;
  layers: readonly LayerPlan[];
  variantCount: number;
  pitchRange: readonly [number,number];
  /** Random gain in dB, before the bus mixer. */
  volumeRange: readonly [number,number];
  cooldownMs: number;
  priority: number;
  ducking: null | {bus:'music';db:-8;attackMs:120;releaseMs:400};
  loop: boolean;
  owner: 'A'|'B';
}
export const SOUND_CURRENCIES = [...new Set([...CURRENCY_IDS,'thread','bell','boss-seal','yarn','spool','star-thread','dawn-thread','favour','motes','shards','xp'])];
export const SOUND_RARITIES = ['common','rare','epic','legendary','mythic'] as const;
export const SOUND_SLOTS = EQUIPMENT_SLOTS;
export const SOUND_ELEMENTS = ['magic','slash','heavy','fire','ice','nature','arcane','holy','shadow','lightning','hearth','moon','garden','tide','ember'] as const;
export const SOUND_STATUSES = [...new Set([...Object.keys(STATUS_BY_ID),'burn','freeze','poison','bleed','stun','shield'])];
export const SOUND_UNITS = [...CATS,...ENEMIES].map(c=>c.id);
export const SOUND_PHASES = ['charge','release','impact','tail'] as const;
export const LEGACY_VOICE_EVENTS = ['select','attack','skill','ult','hit','death','victory'] as const;

function plan(cueId:string): Omit<SoundMapRow,'screen'|'event'|'owner'> {
  const voice=cueId.startsWith('voice.'), music=cueId.startsWith('music.'), ambience=cueId.startsWith('ambience.');
  const hit=cueId.startsWith('hit.')||cueId.endsWith('.impact');
  const ultimate=cueId.startsWith('ult.')||/\.ult(?:\.|$)/.test(cueId);
  const ui=cueId.startsWith('ui.')||cueId==='count.tick';
  const sting=music&&/\.(victory|defeat|reveal|level-up|quest-complete)$/.test(cueId);
  const roles:LayerRole[]=voice?['consonant','voice-grain','foley','tail']:music?['music']:ambience?['ambience']:
    hit?['transient','body','tail','sweetener']:ui?['transient','sweetener']:['transient','body','tail'];
  const variantCount=voice?(ultimate?2:3):music||ambience?1:hit?4:ui?3:4;
  return {
    cueId, bus:voice?'voice':music?'music':ambience?'ambience':ui?'ui':'sfx',
    layers:roles.map((role,i)=>({role,pool:`${CUE_ALIASES[cueId]??cueId}/${role}`,variants:variantCount,
      offsetMs:music||voice||ambience?0:[0,7,18,23][i]!,
      eq:role==='sweetener'?'high-pass-1800':role==='body'?'low-shelf-180':role==='foley'?'high-pass-80':'flat'})),
    variantCount, pitchRange:voice||music||ambience?[1,1]:hit?[.94,1.06]:[.97,1.03],
    volumeRange:voice||music||ambience?[0,0]:[-1.5,1.5],
    cooldownMs:cueId==='count.tick'?50:/hover|scroll|slider/.test(cueId)?80:ambience||music?0:voice?300:30,
    priority:ultimate?100:voice?(cueId.includes('.skill')?90:cueId.endsWith('.death')?80:40):sting?80:hit?60:ui?20:0,
    ducking:voice||ultimate?{bus:'music',db:-8,attackMs:120,releaseMs:400}:null,
    loop:ambience||(music&&!sting)||cueId==='tx.pending',
  };
}
const rows:SoundMapRow[]=[];
const add=(screen:SoundScreen,event:string,cueId:string,owner:'A'|'B'='B')=>rows.push({screen,event,...plan(cueId),owner});
const events=(screens:readonly SoundScreen[],pairs:Readonly<Record<string,string>>)=>{
  for(const screen of screens)for(const [event,cue] of Object.entries(pairs))add(screen,event,cue);
};

// Input feedback is assigned per screen so the S6 crawler can report missing controls by location.
const common={hover:'ui.hover',press:'ui.click',release:'ui.release',open:'ui.open',close:'ui.close',
  'scroll-step':'ui.scroll',denied:'ui.denied',error:'ui.fail',confirm:'ui.confirm','number-step':'count.tick'};
for(const screen of SOUND_SCREENS){
  events([screen],common);
  add(screen,'ambience-enter',`ambience.${screen}`);
  add(screen,'music-enter',`music.${screen==='landing'||screen==='sign-in'?'landing':screen==='battle'?'battle':screen==='boss'?'boss':screen.startsWith('forge-')||screen==='chain-fusion'?'forge':['chapter-map','stage-select','battle-prep'].includes(screen)?'map':screen==='victory'?'victory':screen==='defeat'?'defeat':'home'}`);
}
events(['hero-info','hero-level','hero-star','hero-gear','team','bag','market','wallet','season','settings'],{'tab-switch':'ui.tab'});
events(['settings','team','batch-use','market-list','battle-prep'],{toggle:'ui.toggle','slider-step':'ui.slider'});
events(['landing','sign-in'],{'guest-enter':'ui.enter','wallet-prompt':'tx.wallet','signature-declined':'tx.failed','network-switch':'ui.tab'});
events(['home'],{'idle-chatter':'voice.guide.idle','quest-ready':'ui.quest-ready','daily-reset':'ui.daily-ready','event-red-dot':'ui.notice'});
events(['cats','team'],{'cat-select':'ui.select','drag-start':'ui.grab','slot-snap':'ui.slot','formation-saved':'ui.confirm','power-step':'count.tick'});
events(['hero-level','level-up'],{'level-confirm':'ui.level-up','xp-transfer':'ui.xp','level-title':'music.level-up'});
events(['hero-star'],{'star-node':'ui.star-node','star-up':'ui.star-up','shards-consumed':'ui.consume'});
for(const slot of SOUND_SLOTS)events(['hero-gear','team'],{[`equip-${slot}`]:`ui.equip.${slot}`,[`unequip-${slot}`]:`ui.unequip.${slot}`});
events(['bag','item-detail','batch-use'],{'item-select':'ui.select','quantity-step':'ui.quantity','use-item':'ui.use','batch-confirm':'ui.batch','item-discard':'ui.consume'});
events(['bag','item-detail'],{'gear-comment':'voice.mochi.gear'});
events(['forge-enhance'],{'forge-comment':'voice.mochi.forge'});
events(['forge-enhance'],{'enhance-hammer':'ui.forge.hammer','enhance-success':'ui.forge.success','enhance-fail':'ui.forge.fail','blessing-gain':'ui.blessing','cost-paid':'ui.consume'});
events(['forge-fusion','chain-fusion'],{'input-slot':'ui.slot','inputs-consumed':'fusion.consume','fusion-charge':'fusion.charge','fusion-reveal':'fusion.reveal','fusion-success-legacy':'ui.forge-success'});
events(['invitations','gacha-reveal','gacha-results'],{'draw-charge':'gacha.charge','card-flip':'gacha.flip','pity-milestone':'gacha.pity','pull-confirm':'ui.confirm','skip-reveal':'ui.close'});
events(['gacha-rates'],{'pity-details':'ui.open','rates-close':'ui.close'});
for(const [i,rarity] of SOUND_RARITIES.entries()){
  for(const screen of ['gacha-reveal','gacha-results','invitations'] as const){add(screen,`rarity-reveal-${i+1}-${rarity}`,`ui.reveal.${rarity}`);}
  for(const screen of ['bag','reward','victory','forge-enhance','forge-fusion','market-item'] as const)add(screen,`item-land-${rarity}`,`item.land.${rarity}`);
}
for(const currency of SOUND_CURRENCIES)for(const screen of ['home','reward','victory','wallet','quests','events','season'] as const){
  add(screen,`currency-gain-${currency}`,`currency.${currency}.gain`);
  add(screen,`reward-flight-${currency}`,'ui.reward-fly');
}
events(['market','market-item','market-list','market-buy','my-listings'],{'filter-change':'ui.tab','price-change':'ui.quantity','listing-select':'ui.select','listing-saved':'market.list','purchase-complete':'market.buy','listing-cancel':'market.cancel'});
events(['wallet','deed','withdraw','seal','chain-fusion','spool','history','market-list','market-buy','my-listings'],{
  'wallet-prompt':'tx.wallet','tx-pending-start':'tx.pending','tx-confirmed-stop-pending':'tx.confirmed','tx-failed-stop-pending':'tx.failed','wallet-rejected-stop-pending':'tx.failed',
});
events(['deed'],{'mint-press':'deed.mint','mint-reveal':'deed.reveal'});
events(['withdraw'],{'withdraw-pour':'withdraw.pour','fee-preview':'ui.open'});
events(['seal'],{'seal-press':'seal.press','seal-release':'seal.release'});
events(['spool'],{'spool-unwind':'spool.unwind','style-unlocked':'ui.reward'});
events(['history','economy'],{'live-refresh':'ui.refresh','read-failed':'ui.fail','chart-select':'ui.select','detail-open':'ui.open'});
events(['season','season-supply'],{'track-scroll':'ui.scroll','reward-claim':'ui.reward','countdown-boundary':'ui.notice','edition-unlocked':'ui.star-up'});
events(['field-guide','coach'],{'page-turn':'ui.page','coach-next':'ui.coach-next','coach-skip':'ui.close','lesson-complete':'ui.confirm'});
events(['settings'],{'mute-on':'ui.toggle','mute-off':'ui.toggle','language-change':'ui.tab','tutorial-reset':'ui.confirm'});
events(['chapter-map','stage-select','battle-prep'],{'chapter-open':'map.unfold','node-select':'map.node','stage-unlock':'ui.reward','sweep-ten':'ui.batch','supply-select':'ui.select','ready':'battle.ready'});
events(['quests','events'],{'quest-complete':'music.quest-complete','quest-claim':'ui.reward','event-open':'ui.open'});
events(['victory','defeat','reward','level-up'],{'result-title':'ui.result','reward-flight':'ui.reward-fly','continue':'ui.confirm','retry':'ui.click'});
events(['error','offline'],{retry:'ui.refresh','reconnected':'ui.confirm','offline-enter':'ui.denied'});

for(const screen of ['battle','boss'] as const){
  const battleEvents={
    'turn-start':'battle.turn','round-start':'battle.round','turn-legacy':'ui.turn','round-legacy':'ui.turn',
    crit:'ui.crit',block:'ui.block',dodge:'dodge',miss:'miss','rage-full':'rage.full',death:'ui.death',
    'heal-legacy':'ui.heal','wave-clear':'ui.reward',loot:'ui.coin','victory-sting':'music.victory','defeat-sting':'music.defeat',
    'buff-on':'buff.on','debuff-on':'debuff.on','supply-use':'ui.use','cut-dip':'battle.cut','boss-enrage':'boss.enrage','elite-wave-music':'music.elite',
    'heal-small':'heal.small','heal-medium':'heal.medium','heal-large':'heal.large','cleanse':'status.shield.off',
  };
  for(const [event,cue] of Object.entries(battleEvents))add(screen,event,cue,'A');
  for(const kind of ['blunt','slash','magic','heavy'])add(screen,`hit-${kind}`,`hit.${kind}`,'A');
  for(const role of new Set([...CATS,...ENEMIES].map(c=>c.role)))add(screen,`move-${role}`,`move.${role}.whoosh`,'A');
  for(const status of SOUND_STATUSES)for(const phase of ['on','off','tick'])add(screen,`status-${status}-${phase}`,`status.${status}.${phase}`,'A');
  for(const element of SOUND_ELEMENTS)for(const phase of SOUND_PHASES)add(screen,`element-${element}-${phase}`,`kit.${element}.${phase}`,'A');
  for(const unit of SOUND_UNITS){
    for(const phase of SOUND_PHASES)add(screen,`ultimate-${unit}-${phase}`,`ult.${unit}.${phase}`,'A');
    const cat=CATS.find(c=>c.id===unit);
    // Enemy catalogues have a basic and a signature mechanic, rather than Cat.skills.
    const skills=cat?cat.skills.filter(s=>s.type!=='ultimate').map(s=>Number(s.id.split('-').at(-1))):[1,2];
    for(const n of skills){
      for(const phase of ['cast','impact'])add(screen,`skill-${unit}-${n}-${phase}`,`skill.${unit}.${n}.${phase}`,'A');
      const skillId=cat?`${unit}-${n}`:n===1?`enemy:${unit}:basic`:`enemy:${unit}`;
      add(screen,`skill-callout-${unit}-${n}`,`voice.${unit}.skill.${skillId}`,'A');
      if(!cat)add(screen,`legacy-skill-callout-${unit}-${n}`,`voice.${unit}.skill.${unit}-${n}`,'A');
    }
    for(const phase of ['charge','release'])add(screen,`ultimate-callout-${unit}-${phase}`,`voice.${unit}.ult.${phase}`,'A');
    for(const event of LEGACY_VOICE_EVENTS)add(screen,`voice-${unit}-${event}`,`voice.${unit}.${event}`,'A');
  }
}
events(['cats'],{'legacy-voice-demo':'voice.meow'});
events(['home'],{'legacy-cafe-bed':'ambience.cafe'});
events(['chapter-map','battle-prep','battle'],{'chapter-one':'ambience.chapter-1','chapter-two':'ambience.chapter-2','chapter-three':'ambience.chapter-3'});
events(['boss'],{'dawn-harmonics':'music.boss.dawn'});
events(['boss'],{'boss-intro-yarn-giant':'ui.boss-intro.yarn-giant','boss-intro-rain-spool':'ui.boss-intro.rain-spool','boss-intro-pantry-crown':'ui.boss-intro.pantry-crown'});
events(['gacha-reveal'],{'legacy-reveal-sting':'music.reveal'});
events(['invitations','gacha-rates','gacha-reveal','gacha-results'],{'invitation-score':'music.gacha'});
events(['forge-enhance'],{'legacy-forge-fail':'ui.forge-fail'});
events(['battle'],{'critical-accent':'crit','block-accent':'block'});

export const SOUND_MAP: readonly SoundMapRow[] = rows;
export const SOUND_CUES: ReadonlyMap<string,SoundMapRow> = new Map(rows.map(row=>[row.cueId,row]));
export function mappedCue(id:string):SoundMapRow|undefined {return SOUND_CUES.get(id);}
