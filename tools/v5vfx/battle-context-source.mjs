/** Isolated battle recovery candidate; the application source remains unchanged. */
import assert from 'node:assert/strict';
export const battleModule='apps/web/src/game/cardrpg/spine/scene.ts';
function once(source,before,after){assert.equal(source.split(before).length,2,'Expected one source marker: '+before);return source.replace(before,after);}
export function battleContextSource(source){
 let s=once(source," private lost=(event:Event)=>{event.preventDefault();this.onFailure('The cafe canvas needs a reload. Battle controls remain available.');};",` private contextLost=false;private restoringContext=false;private failureMessage='';
 private reportFailure(message:string){if(this.disposed)return;this.failureMessage=message;this.onFailure(message);}
 private contextChanged(lost:boolean){
  if(this.disposed)return;
  this.contextLost=lost;this.restoringContext=!lost;
  if(lost)this.onFailure('The cafe canvas needs a reload. Battle controls remain available.');else this.invalidate();
 }
 private finishContextRecovery(){
  if(this.disposed||this.contextLost||!this.restoringContext||this.renderer.getContext().isContextLost())return;
  this.restoringContext=false;this.onFailure(this.failureMessage);
 }
 private lost=(event:Event)=>{if(this.disposed)return;event.preventDefault();this.contextChanged(true);};
 private restored=()=>this.contextChanged(false);`);
 s=once(s,"this.renderer.domElement.addEventListener('webglcontextlost',this.lost);","this.renderer.domElement.addEventListener('webglcontextlost',this.lost);this.renderer.domElement.addEventListener('webglcontextrestored',this.restored);");
 s=once(s,'this.onFailure(`Could not prepare battle effects: ${String(error)}`);','this.reportFailure(`Could not prepare battle effects: ${String(error)}`);');
 s=once(s,'this.onFailure(`Could not prepare ${asset}: ${String(error)}`);','this.reportFailure(`Could not prepare ${asset}: ${String(error)}`);');
 s=once(s,"this.postFx.render(plan,frame?.elapsed??0,delta,view.quality??'high',view.reducedMotion,plan?this.actors.get(plan.actorId)?.actor.root:undefined,plan?this.actors.get(plan.targetIds[0]??plan.actorId)?.actor.root.position:undefined);",`$RENDER$\n  if(this.restoringContext)this.finishContextRecovery();`.replace('$RENDER$',"this.postFx.render(plan,frame?.elapsed??0,delta,view.quality??'high',view.reducedMotion,plan?this.actors.get(plan.actorId)?.actor.root:undefined,plan?this.actors.get(plan.targetIds[0]??plan.actorId)?.actor.root.position:undefined);"));
 s=once(s,"this.renderer.domElement.removeEventListener('webglcontextlost',this.lost);","this.renderer.domElement.removeEventListener('webglcontextlost',this.lost);this.renderer.domElement.removeEventListener('webglcontextrestored',this.restored);");
 return s;
}
