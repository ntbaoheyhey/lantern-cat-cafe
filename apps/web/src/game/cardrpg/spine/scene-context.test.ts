import {expect,it,vi} from 'vitest';
import {SpineScene} from './scene';

interface RecoveryScene {
 disposed:boolean;contextLost:boolean;restoringContext:boolean;failureMessage:string;dirty:boolean;
 contextChanged:(lost:boolean)=>void;finishContextRecovery:()=>void;reportFailure:(message:string)=>void;
}
function fixture(){
 let gpuLost=false;const onFailure=vi.fn(),getContext=vi.fn(()=>({isContextLost:()=>gpuLost}));
 const scene=Object.assign(Object.create(SpineScene.prototype),{disposed:false,contextLost:false,restoringContext:false,failureMessage:'',dirty:false,onFailure,renderer:{getContext}}) as RecoveryScene;
 return{scene,onFailure,getContext,loseGpu:()=>{gpuLost=true;},restoreGpu:()=>{gpuLost=false;}};
}
it('keeps the loss notice until a restored draw succeeds',()=>{
 const {scene,onFailure}=fixture();scene.contextChanged(true);expect(onFailure).toHaveBeenLastCalledWith(expect.stringContaining('canvas needs a reload'));
 scene.contextChanged(false);expect(scene.dirty).toBe(true);expect(onFailure).toHaveBeenCalledTimes(1);
 scene.finishContextRecovery();expect(onFailure).toHaveBeenLastCalledWith('');expect(scene.restoringContext).toBe(false);
});
it('does not clear the notice if the GPU is lost again before the event arrives',()=>{
 const {scene,onFailure,loseGpu,restoreGpu}=fixture();scene.contextChanged(true);scene.contextChanged(false);loseGpu();scene.finishContextRecovery();
 expect(scene.restoringContext).toBe(true);expect(onFailure).toHaveBeenCalledTimes(1);restoreGpu();scene.finishContextRecovery();expect(onFailure).toHaveBeenLastCalledWith('');
});
it('cancels a queued recovery when a second loss occurs',()=>{
 const {scene,onFailure,getContext}=fixture();scene.contextChanged(true);scene.contextChanged(false);scene.contextChanged(true);scene.finishContextRecovery();
 expect(scene.contextLost).toBe(true);expect(scene.restoringContext).toBe(false);expect(getContext).not.toHaveBeenCalled();expect(onFailure).toHaveBeenCalledTimes(2);
});
it('restores an asset failure that already existed before context loss',()=>{
 const {scene,onFailure}=fixture();scene.reportFailure('Could not prepare mochi');scene.contextChanged(true);scene.contextChanged(false);scene.finishContextRecovery();
 expect(onFailure).toHaveBeenLastCalledWith('Could not prepare mochi');
});
it('retains a late asset failure received while the context is lost',()=>{
 const {scene,onFailure}=fixture();scene.contextChanged(true);scene.reportFailure('Could not prepare battle effects');scene.contextChanged(false);scene.finishContextRecovery();
 expect(onFailure).toHaveBeenLastCalledWith('Could not prepare battle effects');
});
it('retains a newer asset failure arriving after restoration but before drawing',()=>{
 const {scene,onFailure}=fixture();scene.contextChanged(true);scene.contextChanged(false);scene.reportFailure('Could not prepare panko');scene.finishContextRecovery();
 expect(onFailure).toHaveBeenLastCalledWith('Could not prepare panko');
});
it('rejects loss, restore, late failures and queued draws after disposal',()=>{
 const {scene,onFailure,getContext}=fixture();scene.contextChanged(true);scene.contextChanged(false);onFailure.mockClear();scene.dirty=false;scene.disposed=true;
 scene.contextChanged(true);scene.contextChanged(false);scene.reportFailure('late');scene.finishContextRecovery();expect(onFailure).not.toHaveBeenCalled();expect(getContext).not.toHaveBeenCalled();expect(scene.dirty).toBe(false);
});
it('does not query the GPU or notify errors during ordinary frames',()=>{
 const {scene,onFailure,getContext}=fixture();for(let i=0;i<20;i++)scene.finishContextRecovery();expect(getContext).not.toHaveBeenCalled();expect(onFailure).not.toHaveBeenCalled();
});
it('supports repeated recovery and only clears once per successful restored draw',()=>{
 const {scene,onFailure}=fixture();for(let i=0;i<3;i++){scene.contextChanged(true);scene.contextChanged(false);scene.finishContextRecovery();scene.finishContextRecovery();}
 expect(onFailure.mock.calls.map(([message])=>message)).toEqual([expect.stringContaining('reload'),'',expect.stringContaining('reload'),'',expect.stringContaining('reload'),'']);
});
