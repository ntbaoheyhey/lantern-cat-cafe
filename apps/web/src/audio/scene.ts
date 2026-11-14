export type SoundScene='landing'|'home'|'battle'|'boss'|'map'|'gacha';
/** Music follows visible play state, including replays and encounter returns. */
export function soundScene(screen:string,showBattle:boolean,boss:boolean):SoundScene {
 if(showBattle)return boss?'boss':'battle';
 if(screen==='gacha')return 'gacha';
 if(screen==='map'||screen==='prepare')return 'map';
 return 'home';
}
export function ambienceScene(screen:string,showBattle:boolean,boss:boolean):string {
 if(showBattle)return boss?'boss':'battle';
 return ({hub:'home',inventory:'bag',gacha:'invitations',collection:'cats',journal:'cats',save:'settings',map:'chapter-map',prepare:'battle-prep',codex:'field-guide',result:'reward'} as Record<string,string>)[screen]??'home';
}
