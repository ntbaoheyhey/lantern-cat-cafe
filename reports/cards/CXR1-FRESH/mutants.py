from pathlib import Path
import sys,subprocess,json,os,hashlib,re
root=Path(sys.argv[1]);out=Path(sys.argv[2]);which=sys.argv[3];port=int(sys.argv[4]);(out/'logs').mkdir(parents=True,exist_ok=True)
web=root/'apps/web';pnpm=['npx','-y','pnpm@10.28.0']; env={**os.environ,'E2E_PORT_CLASSIC':str(port),'E2E_PORT_V2':str(port+1),'E2E_PORT_SERVER':str(port+2),'E2E_PORT_API':str(port+3),'SCREENSHOTS':'0','VITE_FUJI_RPC_URL':'https://api.avax-test.network/ext/bc/C/rpc'}
unit=pnpm+['exec','vitest','run','src/theme.contrast.test.ts','src/layout/metrics.test.ts','src/layout/home/Home.test.tsx','src/layout/bag/BagPanel.test.tsx']
browser=pnpm+['exec','playwright','test','e2e/ui/merged-redesign.spec.ts','--workers=1','--retries=0','--reporter=line']
results=[]
def run(name,cmd):
 with (out/'logs'/f'{name}.log').open('w') as f: result=subprocess.run(cmd,cwd=web,env=env,stdout=f,stderr=subprocess.STDOUT)
 (out/'logs'/f'{name}.exit').write_text(str(result.returncode)+'\n');return result.returncode
for name,cmd in [('unit-control',unit),('browser-control',browser)]:
 assert run(name,cmd)==0, name+' not green'
A=[
 ('danger-AA','src/theme.css','--bad: #ff9696;','--bad: #ff6b6b;',unit),
 ('sidebar-sizing','src/layout/metrics.ts','width - 92 - 32 - 320 - 14 - 4','width - 92 - 32 - 280 - 14 - 4',unit),
 ('invented-mint','src/layout/bag/BagPanel.tsx','Mint proof unavailable','#1042 · minted',unit),
 ('wrong-NFT-standard','src/layout/LandingHero.tsx','ERC-1155','ERC-721',unit),
 ('wrong-market-contract','src/layout/LandingHero.tsx','0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93','0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D',unit),
 ('fixed-bag-columns','src/layout/bag/bag.css','repeat(8, minmax(0, 1fr))','repeat(8, 56px)',browser),
 ('short-class-cards','src/layout/classpicker/ClassPicker.css','.screen-class .class-picker__cards { flex: 1;','.screen-class .class-picker__cards { flex: 0;',browser),
 ('strip-landing-scene','src/layout/LandingHero.tsx','width={sceneWidth} scale={sceneScale}','width={640} scale={1}',browser),
]
B=[
 ('warning-surface-contrast','src/theme.css','--surface-3: #4a3a5e;','--surface-3: #746188;',unit),
 ('fractional-desktop-zoom','src/layout/metrics.ts','const zoom = Math.max(2, Math.min(maxZoomW, maxZoomH));','const zoom = .5 + Math.max(2, Math.min(maxZoomW, maxZoomH));',unit),
 ('wrong-canvas-width','src/layout/metrics.ts','width: logicalWidth * zoom','width: logicalWidth * zoom + 1',unit),
 ('false-guest-claim','src/layout/LandingHero.tsx','Guest play is local','Server-checked fights',unit),
 ('private-source-link','src/layout/LandingHero.tsx','https://testnet.routescan.io/address/0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93/contract','https://github.com/ntbaoheyhey/taskbar-hero',unit),
 ('fixed-empty-slots','src/layout/bag/bag.css',None,'\n@media(min-width:1024px){.bag .bag-tile.empty-tile{width:56px;height:56px}}\n',browser),
 ('left-start-action','src/layout/classpicker/ClassPicker.css','.screen-class .class-picker__footer { align-self: flex-end;','.screen-class .class-picker__footer { align-self: flex-start;',browser),
 ('reversed-home-columns','src/layout/home/home.css',None,'\n.home-col--right{grid-row:1;grid-column:1}.home-col--center{grid-row:1;grid-column:2}\n',browser),
]
phone=pnpm+['exec','playwright','test','e2e/layout/stage-layout.spec.ts','--grep','stage layout at 320px','--workers=1','--retries=0','--reporter=line']
button=pnpm+['exec','playwright','test','e2e/ui/u1-tokens.spec.ts','e2e/ui/u4-character-bag.spec.ts','--workers=1','--retries=0','--reporter=line']
A += [
 ('phone-gutter-regression','src/layout/layout.css','@media (min-width: 1024px) {\n  .shell-panel-view.screen-home','@media (min-width: 0px) {\n  .shell-panel-view.screen-home',phone),
 ('wrong-body-size','src/theme.css','font-size: var(--fs-sm, .875rem);\n  line-height: 1.5;','font-size: 16px;\n  line-height: 1.5;',browser),
]
B += [
 ('lost-shared-button','src/layout/bag/BagPanel.tsx','className="pixel-btn pixel-btn--secondary bag-equip-best"','className="pixel-btn--secondary bag-equip-best"',button),
 ('competing-primary-action','src/layout/bag/bag.css','.bag .bag-equip-best { background: var(--surface-2);','.bag .bag-equip-best { background: var(--accent);',button),
]
for name,rel,old,new,cmd in (A if which=='a' else B):
 p=web/rel;original=p.read_bytes();source=original.decode();assert old is None or source.count(old)==1,(name,'nonunique anchor')
 try:
  p.write_text(source+new if old is None else source.replace(old,new,1));rc=run(name,cmd);log=(out/'logs'/f'{name}.log').read_text();killed=rc!=0 and bool(re.search(r'AssertionError|expect\(|TestingLibraryElementError',log)) and 'error during build' not in log
  results.append(dict(name=name,file=rel,exit=rc,killed=killed,originalSha256=hashlib.sha256(original).hexdigest(),log='logs/'+name+'.log'))
  (out/'results.json').write_text(json.dumps(dict(head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),passName=which,controls='PASS',results=results),indent=2)+'\n');print(name,'KILLED' if killed else 'NOT_KILLED',flush=True)
  assert killed,name+' survived or failed for infrastructure reasons'
 finally:p.write_bytes(original)
subprocess.run(['git','diff','--exit-code'],cwd=root,check=True,stdout=subprocess.DEVNULL)
