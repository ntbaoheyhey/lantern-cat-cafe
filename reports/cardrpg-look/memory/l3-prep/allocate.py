from pathlib import Path
p=Path('apps/web/src/game/squad/turn3d/scene.ts');s=p.read_text()
s=s.replace('decorateStage?: (stage: T.Group) => void;', 'decorateStage?: (stage: T.Group) => void | Promise<void>;')
for field in ['glow: T.Texture','post:CafePost','spells:SpellVfx','activeRing: T.Mesh<T.RingGeometry,T.MeshBasicMaterial>','aura: T.PointLight','bossBackdrop: T.Group','blobMaterial: T.MeshBasicMaterial']:
 s=s.replace('private '+field+';', 'private '+field.replace(':','!:',1)+';')
start=s.index('    if(this.view().autoBattle)this.cardSurfaces=new CardSurfaces(this.renderer);')
end=s.index('    this.warming = this.warmModels();',start)
body=s[start:end]
# Register each owned slice before yielding; cancellation cannot strand partial objects.
register='    this.ownSceneResources();\n    await loadingFrame();if(this.disposed)return;\n'
body=body.replace('    this.bossBackdrop=new T.Group();',register+'    this.bossBackdrop=new T.Group();')
body=body.replace('    const makeRing=',register+'    const makeRing=')
body=body.replace('    this.spells=new SpellVfx',register+'    this.spells=new SpellVfx')
body=body.replace('this.renderer.info.autoReset=false;', 'this.renderer.info.autoReset=false;this.post.resize(this.width,this.height);')
s=s[:start]+s[end:]
reg_start=s.index('    this.scene.traverse(o=>{if(o.parent===this.bossAtmosphere?.root)return;')
reg_end=s.index('\n',reg_start)
reg=s[reg_start:reg_end]
s=s[:reg_start]+s[reg_end:]
insert='  private ownSceneResources(){\n'+reg+'\n  }\n\n  private async preparePresentation(){\n'+body+'    this.ownSceneResources();\n  }\n\n'
s=s.replace('  private async warmModels(){',insert+'  private async warmModels(){')
s=s.replace('      if(this.view().autoBattle && !this.lookStageEnabled){','      await this.preparePresentation();if(this.disposed)return;\n      await loadingFrame();if(this.disposed)return;\n      if(this.view().autoBattle && !this.lookStageEnabled){',1)
s=s.replace('}else this.stage=this.makeStage();','}else {for(const step of this.makeStage()){this.stage=step;this.ownStageResources();await loadingFrame();if(this.disposed)return;}}')
s=s.replace('      this.view().decorateStage?.(this.stage);this.scene.add(this.stage);','      await this.view().decorateStage?.(this.stage);this.ownStageResources();if(this.disposed)return;this.scene.add(this.stage);')
# Keep stage ownership available during cancellation; completed registered sets deduplicate.
s=s.replace('  private makeStage(): T.Group {','  private ownStageResources(){\n    this.stage.traverse(object=>{if(object instanceof T.Mesh||object instanceof T.Line||object instanceof T.Points){this.geometryOwned.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])this.materialOwned.add(material);}if(object instanceof T.Sprite)this.materialOwned.add(object.material);});\n  }\n  private *makeStage(): Generator<T.Group> {')
for marker in ['    const cup=', '    mesh(new T.CylinderGeometry(.16,.19,.55,16)', '    // Dark cafe backdrop']:
 s=s.replace(marker,'    yield group;\n'+marker)
s=s.replace('    return group;\n  }\n  private resizeToHost()', '    yield group;\n  }\n  private resizeToHost()')
s=s.replace('this.post.resize(width,height);','this.post?.resize(width,height);')
s=s.replace('this.resize=new ResizeObserver(()=>this.resizeToHost());this.resize.observe(host);this.resizeToHost();', 'this.resize=new ResizeObserver(()=>this.scheduleResize());this.resize.observe(host);')
s=s.replace('  private resizeToHost(){', '  private resizing=false;\n  private scheduleResize(){if(this.resizing||this.disposed)return;this.resizing=true;void loadingFrame().then(()=>{this.resizing=false;if(!this.disposed)this.resizeToHost();});}\n  private resizeToHost(){')
s=s.replace('      await this.preparePresentation();', '      this.resizeToHost();await loadingFrame();if(this.disposed)return;\n      await this.preparePresentation();')
for name in ['glow','blobMaterial','spells','post']:
 s=s.replace('this.'+name+'.dispose();','this.'+name+'?.dispose();')
p.write_text(s)
p=Path('apps/web/src/game/cardrpg/depth/chapter-stage.ts');s=p.read_text()
s=s.replace("import * as T from 'three';", "import * as T from 'three';\nimport { loadingFrame } from '../../squad/turn3d/loading';")
s=s.replace('export function decorateChapterStage(stage: T.Group) {','export async function decorateChapterStage(stage: T.Group) {')
s=s.replace('    // Bake fixed decorations', '    await loadingFrame();\n    // Bake fixed decorations')
s=s.replace('    addCardStageLife(group, index + 1);','    await loadingFrame();\n    addCardStageLife(group, index + 1);')
s=s.replace('    group.userData.ambient = { dust, steam, critters } satisfies AmbientStage;','    group.userData.ambient = { dust, steam, critters } satisfies AmbientStage;\n    await loadingFrame();')
p.write_text(s)
