import {TurnScene,type SceneView} from '../../apps/web/src/game/squad/turn3d/scene';
import {setLookV2} from '../../apps/web/src/game/squad/turn3d/look-v2';
import {decorateChapterStage,animateChapterStage} from '../../apps/web/src/game/cardrpg/depth/chapter-stage';
setLookV2(true);
const view={actors:[],warmModelIds:[],currentId:null,frame:null,targetIds:[],legalIds:[],reducedMotion:true,paused:true,suspended:false,boss:false,autoBattle:true,tableau:true,chapter:1,quality:'high',decorateStage:decorateChapterStage,animateStage:animateChapterStage} as SceneView;
(window as any).__uiPoster=new TurnScene(document.getElementById('stage')!,()=>view,()=>{},()=>{},message=>console.error(message));
