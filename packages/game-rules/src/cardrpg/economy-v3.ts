/** Published v3 policy. Currency amounts are integers; all chances are basis points. */
export const ECONOMY_V3={
 version:3,
 rewards:{"weeklySpool":1.05,"chapterSpool":0,"seasonRankMax":2,"weeklyStarThread":1,"starThreadBankCap":1},
 season:{"days":28,"epoch":1794528000000,"editionSupply":600},
 deed:{"firstId":30001,"lastId":33000,"supply":3000,"level":15,"demoLevel":5},
 spool:{"feeBp":1500,"minAgeDays":7,"cooldownDays":7,"weeklyNetCap":6,"skinCost":11},
 cat:{"odds":{"common":5500,"rare":3300,"epic":1100,"legendary":100},"soft":50,"hard":70,"stepBp":600,"featuredBp":5000},
 gear:{"odds":{"common":5000,"rare":3500,"epic":1420,"legendary":80},"soft":40,"hard":60,"stepBp":600},
 shards:{"common":5,"rare":10,"epic":20,"legendary":40},
 starShards:[10,20,40,80],
 selector:120,
 enhancement:{"max":10,"successBp":[10000,10000,10000,10000,10000,8000,7000,6000,5000,4000],"blessingBp":1000,"fishBase":30,"growth":1.35},
 fusion:{"rare":{"count":4,"input":"common","starThread":0,"yarn":0},"epic":{"count":3,"input":"rare","starThread":0,"yarn":0},"legendary":{"count":3,"input":"epic","starThread":1,"yarn":18},"successBp":10000},
 seal:{"level":15,"demoLevel":5,"perDay":3,"deedExtra":1,"bossSeals":1,"feeBp":1300,"relistMinutes":10,"reference":{"epic":100,"legendary":300,"mythic":900,"starThread":20}},
 quality:[{"name":"Worn","floorBp":0,"offset":0},{"name":"Fine","floorBp":4000,"offset":1000},{"name":"Perfect","floorBp":8500,"offset":2000}],
 drops:{"full":6,"halfUntil":18,"halfBp":5000,"battle":{"chanceBp":3000,"odds":{"common":6500,"rare":3000,"epic":500,"legendary":0}},"elite":{"chanceBp":6000,"odds":{"common":0,"rare":7200,"epic":2790,"legendary":10}},"boss":{"chanceBp":10000,"odds":{"common":0,"rare":3000,"epic":6970,"legendary":30}},"firstBoss":{"chanceBp":10000,"odds":{"common":0,"rare":0,"epic":9700,"legendary":300}},"tower":{"chanceBp":10000,"odds":{"common":0,"rare":0,"epic":9150,"legendary":850}}},
 allocation:{"players":35,"team":15,"treasury":12,"investors":12,"ecosystem":10,"earlyTesters":6,"liquidity":5,"advisors":3,"partners":2},
 market:{"feeBp":500,"burnBp":200,"treasuryBp":300},
 tailoring:{"legendary":{"fish":100,"threads":300,"essence":45,"materials":160,"seals":7}},
 craft:{"rebateBp":9500,"weeklySpoolCap":5},
} as const;
export function v3Season(now=Date.now()){const {epoch,days}=ECONOMY_V3.season,length=days*86400000,number=Math.max(1,Math.floor((now-epoch)/length)+1),ends=epoch+number*length;return {number,ends,days:Math.min(days,Math.max(0,Math.ceil((ends-now)/86400000)))};}
export function withdrawalQuote(gross:bigint){if(gross<=0n)throw new Error('Positive Spool amount required');const retained=gross*BigInt(ECONOMY_V3.spool.feeBp)/10000n;return {gross,retained,net:gross-retained,burned:0n};}
/** Largest gross withdrawal whose rounded net fits the public weekly cap. */
export function withdrawableSpool(balance:bigint){
 if(balance<0n)throw new Error('Invalid Spool balance');
 const cap=BigInt(ECONOMY_V3.spool.weeklyNetCap)*10n**18n*10000n/BigInt(10000-ECONOMY_V3.spool.feeBp);
 return balance<cap?balance:cap;
}
/** Pause new bound Thread grants when the bank is full; never erase old stock. */
export function weeklyStarThreadGrant(current:number){if(!Number.isSafeInteger(current)||current<0)throw new Error('Invalid Star Thread balance');return Math.min(ECONOMY_V3.rewards.weeklyStarThread,Math.max(0,ECONOMY_V3.rewards.starThreadBankCap-current));}
/** Confirmed deterministic crafts can return a bounded amount of Spool.
 * The gross rebate stays below the burn; no random purchase qualifies. */
export function craftSpoolRebate(paid:bigint,claimed=0n){
 const {rebateBp,weeklySpoolCap}=ECONOMY_V3.craft;
 if(paid<0n||claimed<0n||!Number.isInteger(rebateBp)||rebateBp<0||rebateBp>=10000||!Number.isInteger(weeklySpoolCap)||weeklySpoolCap<0)throw new Error('Invalid craft rebate');
 const room=BigInt(weeklySpoolCap)*10n**18n-claimed,quote=paid*BigInt(rebateBp)/10000n;
 return room<=0n?0n:quote<room?quote:room;
}
export function enhancementQuote(level:number,blessingBp=0){if(!Number.isInteger(level)||level<0||level>=10||!Number.isInteger(blessingBp)||blessingBp<0||blessingBp>10000)throw new Error('Invalid enhancement');return {fish:Math.ceil(ECONOMY_V3.enhancement.fishBase*ECONOMY_V3.enhancement.growth**level),chanceBp:Math.min(10000,ECONOMY_V3.enhancement.successBp[level]!+blessingBp)};}
export function dropMultiplierBp(dropsToday:number){if(!Number.isSafeInteger(dropsToday)||dropsToday<0)throw new Error('Invalid drop count');return dropsToday<6?10000:dropsToday<18?5000:0;}
export function qualityBucket(rollBp:number){if(!Number.isInteger(rollBp)||rollBp<0||rollBp>10000)throw new Error('Invalid quality');return ECONOMY_V3.quality[rollBp>=8500?2:rollBp>=4000?1:0]!;}
export function tradability(kind:string,rarity?:string){return kind==='deed'||kind==='relic'?'tradable':kind==='star-thread'||kind==='gear'&&['epic','legendary','mythic'].includes(rarity??'')?'sealable':'bound';}
