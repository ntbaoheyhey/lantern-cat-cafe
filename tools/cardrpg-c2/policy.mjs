import {fraction} from './runtime.mjs';
/** One prospective policy shared by the click driver and simulation. Decisions
 * inspect visible state/public transaction previews; no rewards or stats are added.
 * Skip 20% of optional training visits, 15% of gifts, and 20% of eligible replays.
 */
export function chooseAction(R,s,v,memory){
 const run=s.run,active=!!run&&!run.complete,key=String(s.nextRunId),seed=s.account.seed;
 const intro=R.introductionA6(s).guide;
 const action=(type,extra={})=>({type,...extra});
 if(v.watching)return v.canSkip&&fraction(seed,`skip:${run?.id}:${run?.current}`)<.2?action('skip'):null;
 if(v.screen==='prepare')return action('fight');
 if(v.screen==='result')return action('finish');
 if(v.screen==='gacha')return !s.freeInvite?action('welcome'):v.revealDone?action('meet'):null;
 if(v.tipsOpen){
  if(!R.idleChestA6(s,v.now,true).reason&&!memory.fast?.[key])return action('fast');
  if(!R.idleChestA6(s,v.now).reason&&!memory.tips?.[key])return action('tips');
  return action('close-tips');
 }
 if(v.eventsOpen){
  const board=R.dailyBoardA6(s,v.now);
  if(v.eventTab==='login'&&!board.login.reason)return action('login');
  if(v.eventTab==='login')return action('tab',{tab:'tasks'});
  if(v.eventTab==='tasks'){
   const task=board.tasks.find(t=>!t.reason);
   return task?action('task',{id:task.id,label:'Collect '+task.name}):action('tab',{tab:'weekly'});
  }
  const gift=board.weekly.find(w=>!w.reason);
  return gift?action('weekly',{points:gift.points}):action('close-events');
 }
 if(v.screen==='collection'||v.screen==='team'){
  if(intro==='upgrade')return action('first-level',{cardId:s.account.cards.find(c=>c.cardId===v.cardId)?.id});
  if(memory.training===key){
   if(!memory.equipped?.[key]&&R.autoEquipA6(s).ok)return action('equip');
   if(!memory.upgraded?.[key]&&R.upgradeOptionsA6(s).length)return action('upgrade');
  }
  return action('close');
 }
 if(v.screen==='hub'){
  if(intro==='patrol')return action('patrol');
  if(!active&&intro==='recruit')return action('open-recruit');
  if(!active&&intro==='upgrade')return action('open-cats');
  if(!active){
   if(!memory.gifts?.[key]&&fraction(seed,`gifts:${key}`)>=.15)return action('open-events');
   if(!memory.fast?.[key]&&!R.idleChestA6(s,v.now,true).reason)return action('open-tips');
   if(!memory.visited?.[key]&&fraction(seed,`train:${key}`)>=.2)return action('open-team');
  }
  return action('patrol');
 }
 if(v.screen==='map'){
  if(!run||run.complete)return action('close');
  if(run.rewardChoices.length){const id=run.rewardChoices.find(id=>R.chooseReward(s,id).ok);return id?action('reward',{id,label:'Choose '+(id.startsWith('skill:')?R.skillById(id.slice(6),!!run.skillsV5).name:R.boonForMode(id,!!run.gameplayV4).name)}):null;}
  const node=run.nodes.find(n=>n.id===run.current);
  if(node&&!node.enemies.length&&!run.visited.includes(node.id)){
   if(node.kind==='campfire')return action('resolve',{id:'heal',label:'Heal the crew'});
   if(node.kind==='shop')return action('resolve',{id:'leave',label:'→ Leave'});
   if(node.kind==='treasure')return action('resolve',{id:'charm',label:'Charm'});
   if(node.kind==='event'){
    const choices=R.EVENTS.find(e=>e.id===node.eventId).choices;
    const c=[...choices].filter(c=>R.resolveNode(s,c.id).ok).sort((a,b)=>b.heal-a.heal)[0];
    return c?action('resolve',{id:c.id,label:c.label}):null;
   }
  }
  const next=R.availableNodes(run)[0];return next?action('enter',{id:next.id}):null;
 }
 return action('close');
}
export function remember(m,a,s){
 const key=String(s.nextRunId),put=field=>{(m[field]??={})[key]=true;};
 if(a.type==='open-team'){put('visited');m.training=key;}
 if(a.type==='equip')put('equipped');
 if(a.type==='upgrade'||a.type==='first-level')put('upgraded');
 if(a.type==='close'){m.training=null;}
 if(a.type==='fast')put('fast');
 if(a.type==='tips')put('tips');
 if(a.type==='close-events')put('gifts');
}
export function executeModelAction(R,m,v,a){
 const apply=result=>{if(!m.apply(result))throw Error(`${a.type}: ${m.notice}`);};
 switch(a.type){
  case 'patrol': {
   if(m.battle){m.go(m.battle.result?'result':'prepare');break;}
   if(m.state.tutorial<3){m.tutorial();break;}
   if(!m.state.run||m.state.run.complete){const p=R.patrolDefaultsA6(m.state);m.start(p.chapter,'campaign',p.band);}
   const r=m.state.run;if(r&&!r.complete&&!r.rewardChoices.length){const n=R.availableNodes(r)[0];if(n)m.enter(n.id);}
   if(!m.battle)m.go('map');break;
  }
  case 'fight':m.fight();break;
  case 'skip':m.skip();break;
  case 'finish':{const tutorial=!!m.tutorialBattle;m.finish();if(!tutorial)m.go('hub');break;}
  case 'welcome':m.invite(true);v.revealDone=true;break;
  case 'meet':m.go('collection');break;
  case 'open-recruit':m.go('gacha');break;
  case 'open-cats':m.go('collection');break;
  case 'open-team':m.go('team');break;
  case 'first-level':m.command({type:'level',cardId:a.cardId});break;
  case 'equip':apply(R.autoEquipA6(m.state));break;
  case 'upgrade':{const b=R.upgradeOptionsA6(m.state)[0];apply(R.applyUpgradeA6(m.state,b.change,b.expectedBuild));break;}
  case 'open-tips':v.tipsOpen=true;break;
  case 'close-tips':v.tipsOpen=false;break;
  case 'fast':case 'tips':apply(R.claimIdleA6(m.state,v.now,a.type==='fast'));break;
  case 'open-events':v.eventsOpen=true;v.eventTab='login';break;
  case 'tab':v.eventTab=a.tab;break;
  case 'login':apply(R.claimDailyA6(m.state,v.now,'login'));break;
  case 'task':apply(R.claimDailyA6(m.state,v.now,'task',a.id));break;
  case 'weekly':apply(R.claimDailyA6(m.state,v.now,'weekly',a.points));break;
  case 'close-events':v.eventsOpen=false;m.go('hub');break;
  case 'reward':apply(R.chooseReward(m.state,a.id));break;
  case 'resolve':apply(R.resolveNode(m.state,a.id));break;
  case 'enter':m.enter(a.id);break;
  case 'close':m.go('hub');break;
  default:throw Error('Unknown action '+a.type);
 }
 if(m.error)throw Error(`${a.type}: ${m.notice}`);
}
