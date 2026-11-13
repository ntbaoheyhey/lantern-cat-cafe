export interface Lesson{icon:string;text:string;target?:string}
export const LESSONS:Record<string,readonly Lesson[]>={
 battle:[
  {icon:'team',text:'Guardians hold front. Witches hit groups. Alchemists heal.',target:'.uv-battle-party'},
  {icon:'shield',text:'Front cats protect the back row.',target:'.dp-canvas'},
  {icon:'clock',text:'The turn bar shows who acts next.',target:'.dp-turn-order'},
  {icon:'debuff',text:'Read enemy intent. Change targeting in your preparation plan.',target:'.uv-enemy-rage'},
  {icon:'buff',text:'Full rage triggers ultimates. Tap a portrait for details.',target:'.uv-battle-party'},
  {icon:'burn',text:'Burn hurts. Freeze delays. Shields absorb damage.',target:'.dp-world-plate'},
  {icon:'potion',text:'Pack supplies before battle. Each use costs one cat action.',target:'.uv-battle-party'},
  {icon:'settings',text:'Change speed or pause auto. Your plan stays active.',target:'.uv-battle-actions'},
 ],
 team:[{icon:'team',text:'Keep guardians in front and fragile cats behind.',target:'.a6-formation-desk'},{icon:'weapon',text:'Equip gear, then compare the green stat changes.'},{icon:'outfit',text:'Matching sets unlock bonuses. Read each set before swapping.'}],
 inventory:[{icon:'bag',text:'Select gear to compare stats and equip a cat.',target:'.a6-inventory-detail'},{icon:'forge',text:'Check enhancement odds. Failed attempts add Blessing.'},{icon:'star-thread',text:'Fuse matching gear. Legendary fusion uses Star Thread and YARN.'}],
 gacha:[{icon:'bell',text:'Spend bound Bells. YARN never buys random outcomes.',target:'.uv-recruit-buttons'},{icon:'invitations',text:'Open Odds before pulling. Pity increases your next chance.'},{icon:'cats',text:'A featured miss guarantees your next featured Legendary.'},{icon:'shard',text:'Duplicate cats give shards. Pity carries between matching banners.'}],
 season:[{icon:'season',text:'Seasons last four weeks. Check the countdown.'},{icon:'bell',text:'Free rewards stay bound. Premium passes remain on the roadmap.'},{icon:'relic',text:'Edition supply is limited. Offline counters never imply availability.'}],
 wallet:[{icon:'spool',text:'Earn bound Spool. Spend it at equal YARN value.'},{icon:'deed',text:'A Deed unlocks withdrawals. Playing and earning stay free.'},{icon:'yarn',text:'Withdrawals retain 25 percent. Review net YARN before signing.'},{icon:'wallet',text:'Seal eligible items before trading. Cats and shards stay bound.'},{icon:'market',text:'Fuji is testnet. Items and tokens have no real value.'}],
};
export const GUIDE_PAGES=[
 {id:'roles',title:'Roles',icon:'team',text:'Guardians protect. Witches strike groups. Alchemists heal. Keep two cats forward.'},
 {id:'formation',title:'Rows',icon:'shield',text:'The front row protects fragile allies. Drag cats in Team.'},
 {id:'turns',title:'Turns',icon:'clock',text:'Turn order follows initiative. Read enemy intent before choosing your plan.'},
 {id:'rage',title:'Rage',icon:'buff',text:'Ultimates cast automatically at 100 rage, when the cat can act.'},
 {id:'statuses',title:'Statuses',icon:'burn',text:'Burn damages. Freeze delays. Shields absorb hits. Inspect duration and stacks.'},
 {id:'supplies',title:'Supplies',icon:'potion',text:'Pack supplies during preparation. Using one spends that cat’s action.'},
 {id:'speed',title:'Speed',icon:'settings',text:'Choose one, two, or three times speed. Pause auto anytime.'},
 {id:'gear',title:'Gear',icon:'weapon',text:'Compare green changes. Equip matching sets to unlock their bonuses.'},
 {id:'enhance',title:'Enhance',icon:'forge',text:'Check odds and Blessing. Failure keeps the level and increases Blessing.'},
 {id:'fusion',title:'Fusion',icon:'star-thread',text:'Matching inputs become stronger gear. Sealed inputs leave your wallet permanently.'},
 {id:'gacha',title:'Invitations',icon:'bell',text:'Bells buy invitations. Pity and featured guarantees carry. Duplicates give shards.'},
 {id:'rewards',title:'Rewards',icon:'spool',text:'Spool is bound. Deeds unlock withdrawal. Review the retained fee first.'},
 {id:'trade',title:'Trade',icon:'market',text:'Cats stay bound. Eligible gear and Star Thread become tradable after sealing.'},
 {id:'season',title:'Seasons',icon:'season',text:'Four-week seasons bring new goals. Limited editions show verified supply or Offline.'},
] as const;
