import {applyCommand,createStarterAccount,finishBattle,startBattle,abandonBattle,FIXTURES,type AccountState,type Command,type Reward,type Result} from '@taskbar-hero/game-rules/cardrpg';
import {TurnController} from '../squad/turn3d/controller';
export type Screen='hub'|'collection'|'detail'|'inventory'|'forge'|'gacha'|'quests'|'codex'|'relics'|'rewards'|'evidence';
/** One in-memory rules client. No storage adapter, wallet, purchase or networking path. */
export class CardRpgModel{
 state:AccountState=createStarterAccount(11);screen:Screen='hub';cardId=this.state.cards[0]!.id;itemId=this.state.inventory.items[0]!.id;
 battle:TurnController|null=null;reward:Reward|null=null;notice='Welcome to the cafe. Your first patrol is waiting.';error=false;lastResult:unknown;private revision=0;private listeners=new Set<()=>void>();private drawSeed=101;
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>this.listeners.delete(fn)};snapshot=()=>this.revision;
 notify(){this.revision++;for(const f of this.listeners)f()}
 go(screen:Screen){this.screen=screen;this.notify()}
 accept<T>(result:Result<T>,message='Done. Your local cafe has been updated.'){
  this.state=result.state;this.error=!result.ok;this.notice=result.ok?message:result.error.message;this.lastResult=result.ok?result.value:null;this.notify();return result.ok;
 }
 command(command:Command,message?:string){return this.accept(applyCommand(this.state,command),message)}
 draw(bannerId:string,count=1){return this.command({type:'pull',bannerId,count,seed:this.drawSeed++},'Your invitation has arrived. Every result is bound to this local account.')}
 start(){const result=startBattle(this.state,2);if(this.accept(result)&&result.ok){this.battle=new TurnController(result.value.options,result.value.battle);this.notify()}}
 finish(){if(!this.battle)return;const result=finishBattle(this.state,this.battle.battle);if(this.accept(result,'Patrol rewards received.')&&result.ok){this.reward=result.value;this.battle=null;this.screen='rewards';this.notify()}}
 abandon(){if(this.accept(abandonBattle(this.state),'Patrol ended. No completion rewards claimed.')){this.battle=null;this.notify()}}
 fixture(id:'starter'|'midgame'|'nearHard'){this.state=id==='starter'?createStarterAccount(11):structuredClone(FIXTURES[id]);this.cardId=this.state.cards[0]!.id;this.itemId=this.state.inventory.items[0]!.id;this.screen='hub';this.battle=null;this.reward=null;this.notice=`Loaded ${id} preview. All progress is unsaved.`;this.error=false;this.notify()}
}
