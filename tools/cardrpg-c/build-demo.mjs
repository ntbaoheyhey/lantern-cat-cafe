/** Reproducible C10 review bundle. Gameplay recordings come only from earned x1 fights. */
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'docs/cardrpg-c');
mkdirSync(out,{recursive:true});
const report=JSON.parse(readFileSync(resolve(root,'reports/cardrpg-c/first-session.json'),'utf8'));
const recordings=[];
for(const kind of ['normal','boss']){
 const fight=report.encounters.find(e=>!e.tutorial&&!!e.boss===(kind==='boss')&&e.result==='party'&&e.speed===1&&!e.pausedDuring&&!e.crossedLease);
 if(!fight)throw Error(`No earned ${kind} fight recorded yet`);
 if(process.argv.includes('--videos')){
  if(!report.endedAt||!report.video?.path)throw Error('Wait for the live run to finish before encoding');
  const from=Math.max(0,fight.at+report.video.startOffsetSeconds-.6),duration=fight.seconds+1.2;
  execFileSync('nice',['-n','10','ffmpeg','-hide_banner','-loglevel','error','-y','-ss',String(from),'-i',report.video.path,'-t',String(duration),'-vf','fps=30,scale=1280:720:flags=lanczos','-an','-c:v','libx264','-crf','25','-preset','fast','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',join(out,kind+'.mp4')],{stdio:'inherit'});
  const poster=`/tmp/cardrpg-c-demo-${kind}.png`;
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(Math.min(4,duration/3)),'-i',join(out,kind+'.mp4'),'-frames:v','1',poster],{stdio:'inherit'});
  execFileSync('cwebp',['-quiet','-q','88',poster,'-o',join(out,kind+'.webp')],{stdio:'inherit'});
 }
 recordings.push({kind,seed:fight.seed,chapter:fight.chapter,at:fight.at,seconds:fight.seconds,speed:1,result:fight.result,file:kind+'.mp4'});
}
copyFileSync(resolve(root,'reports/cardrpg-c/shots/c9/mochi-4-1440.webp'),join(out,'stage.webp'));
if(!existsSync(join(out,'lineup.webp')))copyFileSync(resolve(root,'reports/cardrpg-c/spine/lineup.webp'),join(out,'lineup.webp'));
const notes=`1. Mở index.html bằng Chrome hoặc Edge mới; giữ nguyên các tệp trong cùng thư mục.\n2. Watch: xem trọn một trận thường và một trận boss kiếm được từ tài khoản mới, đều ở ×1.\n3. Characters: chọn bất kỳ 25 nhân vật và 206 animation; dùng Pause/Restart hoặc ×2/×3.\n4. Skill effects: xem 74 skill và 18 status; bật Reduced motion khi cần.\n5. Tất cả nhân vật hiện là placeholder; Mochi có pilot PSD, chưa có export designer cuối.\n6. Trong repo: pnpm --filter @taskbar-hero/web dev --host 127.0.0.1 --port 5970\n7. Mở http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1 để chơi.\n8. Bản review offline không cần mạng; game chạy cục bộ không deploy hay đổi server.\n`;
writeFileSync(join(out,'CHAY-DEMO.md'),notes);
let template=readFileSync(resolve(root,'tools/cardrpg-c/demo.html'),'utf8').replace('{{NORMAL_SECONDS}}',String(Math.round(recordings[0].seconds))).replace('{{BOSS_SECONDS}}',String(Math.round(recordings[1].seconds)));
const files=()=>readdirSync(out).filter(name=>statSync(join(out,name)).isFile()).map(name=>({name,bytes:statSync(join(out,name)).size}));
const estimate=files().filter(f=>!['index.html','build.json'].includes(f.name)).reduce((n,f)=>n+f.bytes,0)+Buffer.byteLength(template)+5000;
template=template.replace('{{DEMO_MB}}',(estimate/1e6).toFixed(1));writeFileSync(join(out,'index.html'),template);
const manifest={builtAt:new Date().toISOString(),sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),designerFinal:0,placeholderUnits:25,clips:206,skills:74,statuses:18,recordings,files:files().filter(f=>f.name!=='build.json'),complete:recordings.every(r=>existsSync(join(out,r.file))),note:'Video cut to fight boundaries only; no speed changes. Galleries embed original art. Source evidence remains in reports/cardrpg-c.'};
manifest.bytes=manifest.files.reduce((n,f)=>n+f.bytes,0);
writeFileSync(join(out,'build.json'),JSON.stringify(manifest,null,2)+'\n');
const bytes=files().reduce((n,f)=>n+f.bytes,0);if(bytes>40_000_000)throw Error(`Demo exceeds 40 MB: ${bytes}`);
console.log(JSON.stringify({bytes,complete:manifest.complete,recordings}));
