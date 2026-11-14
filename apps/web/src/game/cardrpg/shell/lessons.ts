export interface Lesson{icon:string;text:string;target:string}
const at=(id:string)=>`[data-tutorial-id="${id}"]`;
export const LESSONS:Record<string,readonly Lesson[]>={
 battle:[
  {icon:'team',text:'Guardians hold front. Witches hit groups. Alchemists heal.',target:at('battle-roles')},
  {icon:'shield',text:'Front cats protect the back row.',target:at('battle-rows')},
  {icon:'clock',text:'These portraits show who acts next.',target:at('battle-order')},
  {icon:'debuff',text:'Read enemy intent. Choose targeting before battle.',target:at('battle-intent')},
  {icon:'buff',text:'Basics build rage. Full rage readies your Ultimate.',target:at('battle-rage')},
  {icon:'burn',text:'Status icons show shields, burns, and delays.',target:at('battle-statuses')},
  {icon:'potion',text:'Pack supplies before battle. Your packed treat appears here.',target:at('battle-supplies')},
  {icon:'settings',text:'Change speed here. Pause and Auto remain available.',target:at('battle-speed')},
 ],
 team:[{icon:'team',text:'Keep guardians in front and fragile cats behind.',target:at('team-rows')},{icon:'weapon',text:'Choose a gear slot to compare upgrades.',target:at('team-gear')},{icon:'outfit',text:'Save a crew for each activity.',target:at('team-tools')}],
 inventory:[{icon:'bag',text:'Select gear to compare stats and equip a cat.',target:at('bag-item')},{icon:'forge',text:'Enhance gear here. Review costs before confirming.',target:at('bag-enhance')},{icon:'star-thread',text:'Open the workshop to fuse matching gear.',target:at('bag-workshop')}],
 forge:[{icon:'forge',text:'Preview the next level before spending materials.',target:at('forge-preview')},{icon:'bell',text:'Check odds. Failed attempts add Blessing.',target:at('forge-odds')},{icon:'thread',text:'Review the material cost, then confirm.',target:at('forge-cost')}],
 gacha:[{icon:'bell',text:'Spend bound Bells. YARN never buys random outcomes.',target:at('invite-balance')},{icon:'invitations',text:'Open Odds before pulling. Pity increases your next chance.',target:at('invite-pity')},{icon:'cats',text:'Choose a banner. Featured guarantees carry between matching banners.',target:at('invite-banners')},{icon:'shard',text:'Duplicate cats give shards. Each invitation saves immediately.',target:at('invite-purchases')}],
 season:[{icon:'season',text:'Content seasons last four weeks. Check the countdown.',target:at('season-clock')},{icon:'bell',text:'Play weekly goals for bound rewards.',target:at('season-track')},{icon:'relic',text:'Edition supply shows verified counts, or Offline.',target:at('season-edition')}],
 wallet:[{icon:'wallet',text:'This is your Fuji wallet. Test tokens have no value.',target:at('wallet-title')},{icon:'yarn',text:'Check balances before signing. Test AVAX pays network gas.',target:at('wallet-balances')},{icon:'market',text:'Market opens your onchain items and Café.',target:at('wallet-actions')}],
 cafe:[{icon:'spool',text:'Earn bound Spool. Spend it at equal YARN value.',target:at('cafe-spool')},{icon:'deed',text:'A Deed unlocks withdrawals. Playing and earning stay free.',target:at('cafe-deed')},{icon:'yarn',text:'Review net YARN and the retained fee before signing.',target:at('cafe-withdraw')}],
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
