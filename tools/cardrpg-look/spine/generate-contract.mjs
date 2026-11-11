/** Derive the designer registry from the live rules and accepted B scale standard. */
import { createRequire } from 'node:module';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../../..');
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const dir = 'assets/cardrpg-look/spine';
const config = await json(`${dir}/config.json`);
const scale = await json('assets/cardrpg-look/v3-real/manifest.json');
const require = createRequire(resolve(root, 'apps/web/package.json'));
const { build } = await import(require.resolve('vite'));
const temp = await mkdtemp('/tmp/cardrpg-c-contract-');
try {
  const entry = resolve(temp, 'entry.ts');
  await writeFile(entry, [
    ['R', 'packages/game-rules/src/cardrpg/depth/catalog.ts'],
    ['K', 'packages/game-rules/src/cardrpg/depth/skills-v5/kits.ts'],
    ['E', 'packages/game-rules/src/cardrpg/depth/skills-v5/enemies.ts'],
    ['S', 'packages/game-rules/src/cardrpg/depth/skills-v5/statuses.ts'],
  ].map(([name, file]) => `export * as ${name} from ${JSON.stringify(resolve(root, file))};`).join('\n'));
  await build({ configFile:false, root, envDir:false, publicDir:false, logLevel:'silent', build:{ emptyOutDir:false, outDir:temp, minify:false, lib:{entry, formats:['es'], fileName:()=> 'catalog.mjs'} } });
  const { R, K, E, S } = await import(pathToFileURL(resolve(temp, 'catalog.mjs')).href);
  const previous = await json(`${dir}/slots.json`).catch(() => ({units:[]}));
  const units = [...R.CATS, ...R.ENEMIES].map(unit => {
    const cat = !!unit.skills, size = scale.units.find(row => row.id === unit.id);
    if (!size) throw Error(`Missing size standard ${unit.id}`);
    const tier = cat ? 'cat' : size.kind;
    const range = tier === 'cat' ? [512,512] : tier === 'boss' ? [870,998] : tier === 'small' ? [410,512] : [563,666];
    const folder = `${dir}/${unit.id}`;
    const skills = cat ? unit.skills.map(K.kitSkillV5).map((skill, index) => ({
      id:skill.id, name:skill.name, animation:index===3?'ult':index===0?'attack':'skill', shape:skill.shape,
      effects:skill.effects.map(e=>e.status ?? e.kind),
    })) : [
      {id:`enemy:${unit.id}:basic`,name:`${unit.name} basic`,animation:'attack',effects:['hit']},
      {id:`enemy:${unit.id}`,name:E.ENEMY_MECHANICS_V5[unit.id]?.mechanic ?? unit.intent,animation:tier==='boss'?'ult':'skill',effects:[unit.mechanic,unit.status].filter(Boolean)},
    ];
    for (const skill of skills) {
      skill.vfx = { registryId:skill.id, origin:'main-hand', cast:'vfx-origin', impact:'vfx-origin', ground:'root', events:config.animations[skill.animation].events };
      // ':' is retained in the runtime identity; use a portable folder on every OS.
      skill.designerVfx = `assets/cardrpg-look/vfx-designer/${skill.id.replaceAll(':','-')}/`;
    }
    return {
      id:unit.id, name:unit.name, side:cat?'party':'enemy', role:unit.role, tier, combatTier:cat?'cat':unit.tier,
      targetHeight:Math.round(size.height*512), heightRange:range, maxWidth:tier==='boss'?1126.4:null,
      facing:'right', flipInGame:!cat, folder:`${folder}/`,
      files:{json:`${unit.id}.json`,binary:`${unit.id}.skel`,atlas:`${unit.id}.atlas`,png:`${unit.id}.png`},
      requiredBones:config.requiredBones, sockets:config.sockets,
      animations:Object.keys(config.animations).filter(name=>!config.animations[name].bossOnly||tier==='boss'),
      budgets:{bones:tier==='boss'?80:40,meshVertices:tier==='boss'?800:400,clipping:1,atlasPage:config.atlasMax},
      skills, concept:`assets/source/look-v3/concepts/${unit.id}.png`,
      psd:unit.id==='mochi'?'/Users/bao/Desktop/TaskbarHero-PSD-cho-designer-2026-11-11/01-PILOT-mochi/mochi-3-4.psd':`/Users/bao/Desktop/TaskbarHero-PSD-cho-designer-2026-11-11/<published-wave>/${unit.id}-3-4.psd`,
      placeholder:{skeleton:`${folder}/placeholder/${unit.id}.json`,atlas:`${folder}/placeholder/${unit.id}.atlas`,scale:1},
      designer:previous.units.find(row=>row.id===unit.id)?.designer ?? null,
      sequence:previous.units.find(row=>row.id===unit.id)?.sequence ?? null,
      sequencePath:`${folder}/sequence/sequence.json`,
    };
  });
  const statuses = [...new Map([...R.STATUSES,...S.CORE_STATUS_RULES_V5].map(s=>[s.id,s])).values()].map(s=>({id:s.id,name:s.name,kind:s.kind,socket:s.id==='drowsy'?'head':'vfx-origin'}));
  await writeFile(resolve(root,`${dir}/slots.json`),JSON.stringify({schemaVersion:1,config:'config.json',units,statuses},null,2)+'\n');
  const wave = id => id==='mochi'?'Pilot': ['soot','clover','button-guard','sock-skipper','yarn-giant'].includes(id)?'1':R.CAT_BY_ID[id]?'2':'3';
  for (const unit of units) await mkdir(resolve(root,unit.folder),{recursive:true});
  await writeFile(resolve(root,'reports/cardrpg-c/ASSET-SLOTS.md'), `# Asset slots\n\nGenerated from the live catalog by tools/cardrpg-look/spine/generate-contract.mjs. The executable contract is assets/cardrpg-look/spine/{config,slots}.json. Accepted export or sequence metadata changes require no TypeScript edits. Runtime identities stay exact; enemy VFX folders replace colon with hyphen.\n\n| Unit | Side / role | Size / height | Animations | Skills shown |\n|---|---|---|---|---|\n`+units.map(u=>`| ${u.id} | ${u.side} / ${u.role} | ${u.tier} / ${u.targetHeight} (${u.heightRange.join('–')}) | ${u.animations.join(', ')} | ${u.skills.map(s=>`${s.id}: ${s.name}`).join('; ')} |`).join('\n')+`\n\nEach unit folder is assets/cardrpg-look/spine/<id>/. Deliver <id>.json OR <id>.skel, <id>.atlas and its named PNG pages; the initial page is <id>.png. Placeholders live in placeholder/. Per-unit sequence/sequence.json is the license/tool fallback.\n\nShared required bones: ${config.requiredBones.join(', ')}. Sockets: ${Object.entries(config.sockets).map(([a,b])=>`${a} ← ${b}`).join('; ')}.\n\nEvery skill launches from main-hand or vfx-origin, impacts the target vfx-origin and places rings at root. Cast/impact/cut-in event fractions, optional designer VFX folders, budgets and exact clip lists are in slots.json. The runtime flips enemies; art always faces right. Boss width is at most 1126.4 Spine units. See DESIGNER-SPEC for delivery, validation and acceptance.\n`);
  const table = units.map(u=>`| ${wave(u.id)} | ${u.id} | ${u.role} | ${u.tier} / ${u.targetHeight} | ${u.concept} | ${u.psd} | ${u.skills.map(s=>s.name).join('; ')} |`).join('\n');
  const header = '| Wave | Unit | Role | Size / height | Original concept | PSD (read-only) | Skills shown |\n|---|---|---|---|---|---|---|\n';
  await writeFile(resolve(root,'reports/cardrpg-c/DESIGNER-QUEUE.md'),'# Designer queue\n\nPilot: Mochi. Wave 1: Soot, Clover, Button Guard, Sock Skipper, Yarn Giant. Wave 2: remaining cats. Wave 3: remaining enemies/bosses. Only the Mochi PSD path is published at this checkpoint; <published-wave> is explicitly pending, not an existing file. Do not wait to animate the pilot. Existing soft-painted original concepts remain the character style.\n\n'+header+table+'\n');
  await writeFile(resolve(root,'reports/cardrpg-c/DESIGNER-QUEUE-VI.md'),'# Thứ tự bàn giao cho designer\n\nThử trước Mochi. Đợt 1: Soot, Clover, Button Guard, Sock Skipper, Yarn Giant. Đợt 2: các mèo còn lại. Đợt 3: quái/boss còn lại. Chỉ PSD Mochi đã có; <published-wave> là đường dẫn dự kiến, chưa có file. Giữ nét mềm, ấm của concept gốc. Mèo luôn cùng chiều cao; không đổi theo độ hiếm. Dùng góc 3/4 nhìn sang phải, game tự lật quái.\n\n'+header+table+'\n\nXem DESIGNER-SPEC.md để đặt tên xương/animation/event và xuất file. Gửi vào /Users/bao/art/designer-inbox/<id>/export/. Codex làm toàn bộ hiệu ứng skill; designer chỉ cần animation nhân vật.\n');
  console.log(JSON.stringify({units:units.length,skills:units.reduce((n,u)=>n+u.skills.length,0),statuses:statuses.length}));
} finally { await rm(temp,{recursive:true,force:true}); }
