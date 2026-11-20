from pathlib import Path
import hashlib, json
root=Path('/tmp/cardrpg-a5-c1-prep')
manifest=json.loads((root/'source.json').read_text())
def stage(path, transform):
    source=Path(path)
    text=source.read_text()
    manifest[path]=hashlib.sha256(source.read_bytes()).hexdigest()
    destination=root/path
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(transform(text))

def app(text):
    text=text.replace("import { CollectionJournalV4 }", "import { developerView } from './developer-view';\nimport { CollectionJournalV4 }")
    text=text.replace('  const app = useRef', '  const playerView = activeGameplayV4(m.state) && !developerView();\n  const app = useRef')
    text=text.replace('data-battle-active={m.showBattle}', 'data-battle-active={m.showBattle} data-player-view={playerView}')
    text=text.replace("navigation.filter(([id])=>id!=='journal'||activeGameplayV4(m.state))", "navigation.filter(([id])=>(id!=='journal'||activeGameplayV4(m.state)) && (id!=='evidence'||!playerView))")
    text=text.replace('{offline && <FeelLab', '{offline && !playerView && <FeelLab')
    text=text.replace('{offline && m.labPerformance', '{offline && !playerView && m.labPerformance')
    return text
stage('apps/web/src/game/cardrpg/depth/App.tsx',app)

def offline(text):
    text=text.replace("import DepthApp from", "import { developerView } from '../../apps/web/src/game/cardrpg/depth/developer-view';\nimport DepthApp from")
    text=text.replace('  const lookV2 =', "  const showTools = !(typeof __GAMEPLAY_V4__ !== 'undefined' && __GAMEPLAY_V4__) || developerView();\n  const lookV2 =")
    text=text.replace('{header && createPortal', '{showTools && header && createPortal')
    text=text.replace('{meter && <FrameMeter', '{showTools && meter && <FrameMeter')
    text=text.replace('{panel && createPortal', '{showTools && panel && createPortal')
    return text
stage('tools/cardrpg-big/offline.tsx',offline)

def encounter(text):
    text=text.replace("import { portraitProps }", "import { developerView } from './developer-view';\nimport { portraitProps }")
    text=text.replace(' · seed ${battle.seed}', "${!battle.v4 || developerView() ? ` · seed ${battle.seed}` : ''}")
    text=text.replace('Your companions choose their actions. Watch, then improve your team.', 'Your crew takes it from here.')
    text=text.replace('Enemy health and attack are fixed for this route band. Your equipment never raises enemy stats. Lower completed bands remain available for easier routes.', 'Choose a higher band for a harder evening. Your equipment never strengthens enemies.')
    text=text.replace('The boss changes its signature at half health. Defeating it retires its linked helpers together; there is no helpers-only cleanup.', 'At half health, the boss changes its pattern. Its helpers leave when it falls.')
    return text
stage('apps/web/src/game/cardrpg/depth/Encounter.tsx',encounter)

def runmap(text):
    text=text.replace("import { PageTitle }", "import { developerView } from './developer-view';\nimport { PageTitle }")
    text=text.replace(' · seed ${run.seed}', "${!run.gameplayV4 || developerView() ? ` · seed ${run.seed}` : ''}")
    return text
stage('apps/web/src/game/cardrpg/depth/RunMap.tsx',runmap)
(root/'source.json').write_text(json.dumps(manifest,indent=2))
p=root/'apps/web/src/game/cardrpg/depth/developer-view.ts'
p.write_text("/** Reviewer tools are explicit; player builds keep the cafe clear. */\nexport function developerView(): boolean {\n  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1';\n}\n")
(root/'player-shell.css').write_text('''\n/* A-owned shell hides the B battle's existing lab controls without editing Battle.tsx. */
.dp-app[data-player-view="true"] .dp-feel-lab { display: none; }
.dp-v4-cat-picker,.dp-v4-plan { display:flex; flex-wrap:wrap; gap:10px; margin:12px 0; }
.dp-v4-cat-picker button { display:grid; grid-template-columns:48px 1fr; column-gap:10px; text-align:left; align-items:center; min-width:160px; }
.dp-v4-cat-picker img { grid-row:span 2; width:48px; height:48px; object-fit:contain; }
.dp-v4-table-row { margin:12px 0; padding:12px; border:1px solid var(--cr-border); border-radius:14px; }
.dp-v4-table-row button { min-height:58px; display:grid; gap:4px; text-align:left; }
.dp-v4-prepare button[aria-pressed="true"] { outline:2px solid currentColor; outline-offset:2px; }
.dp-v4-prepare button:focus-visible { outline:3px solid currentColor; outline-offset:3px; }
''')
