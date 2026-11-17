/** Keep legacy miniature rendering out of the shell's static import graph. */
let sceneModule:Promise<typeof import('../../squad/turn3d/scene')>|undefined;
let assetModule:Promise<typeof import('../../squad/turn3d/assets')>|undefined;

export async function loadPreviewScene(){
 const module=await (sceneModule??=import('../../squad/turn3d/scene').catch(error=>{sceneModule=undefined;throw error;}));
 return module.TurnScene;
}
export async function loadPreviewModel(id:string){
 const module=await (assetModule??=import('../../squad/turn3d/assets').catch(error=>{assetModule=undefined;throw error;}));
 return module.loadModel(id);
}
