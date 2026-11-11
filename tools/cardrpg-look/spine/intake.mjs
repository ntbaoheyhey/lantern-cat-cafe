/** Copies only validated runtime exports. Designer source directories are never modified. */
import { mkdir, readFile, writeFile, readdir, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { ROOT, readSlots, safeRead, validateDelivery } from './validate.mjs';

export async function intake({id,folder,root=ROOT,install=false,scale}) {
  const slotsFile=resolve(root,'assets/cardrpg-look/spine/slots.json');
  const slots=JSON.parse(await readFile(slotsFile,'utf8')),unit=slots.units.find(u=>u.id===id);
  if (!unit) throw Error(`Unknown unit ${id}`);
  const report=await validateDelivery(folder,unit,{scale});
  report.source=resolve(folder);report.installed=false;
  const evidence=resolve(root,'reports/cardrpg-c/spine',id);await mkdir(evidence,{recursive:true});
  const files=new Map(),hash=createHash('sha256');
  if (report.accepted) for (const name of [...new Set(report.files)].sort()) {
    const bytes=await safeRead(folder,name);files.set(name,bytes);hash.update(name+'\0');hash.update(bytes);
  }
  if (report.accepted) {
    report.digest=hash.digest('hex');
    // Immutable revision folders keep the currently accepted asset intact on copy failure.
    if (install) {
      const relative=`${unit.folder}${report.format==='sequence'?'sequence':'accepted'}/${report.digest.slice(0,16)}`;
      const target=resolve(root,relative);await mkdir(target,{recursive:true});
      for (const [name,bytes] of files) {const dest=resolve(target,name);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,bytes);}
      const accepted={format:report.format,scale:report.scale??1,revision:report.digest,acceptedAt:new Date().toISOString()};
      if (report.format==='sequence') unit.sequence={...accepted,manifest:`${relative}/sequence.json`};
      else unit.designer={...accepted,skeleton:`${relative}/${report.skeletonFile}`,atlas:`${relative}/${report.atlasFile}`};
      await writeFile(slotsFile+'.tmp',JSON.stringify(slots,null,2)+'\n');await rename(slotsFile+'.tmp',slotsFile);report.installed=true;
    }
  }
  if (report.cubism) {
    const path=resolve(root,'reports/cardrpg-c/NEEDS-USER.md');const old=await readFile(path,'utf8').catch(()=> '');
    const note=`- ${id}: nhận Live2D Cubism; cần xác nhận công cụ/phiên bản và PNG sequence. Spine placeholder vẫn chạy.`;
    if (!old.includes(note)) await writeFile(path,old+'\n'+note+'\n');
  }
  await writeFile(resolve(evidence,'validation.json'),JSON.stringify(report,null,2)+'\n');
  const feedback=`# ${id}: ${report.verdict}\n\n${report.accepted?'PASS — cấu trúc xuất hợp lệ. '+(report.installed?'Đã cài bản runtime, giữ nguyên file gốc.':'Chưa cài; đây là kiểm tra đọc-only.'):'FIX — giữ bản đã nghiệm thu hoặc placeholder hiện tại; cần sửa các mục dưới.'}\n\n`+
    report.issues.map(i=>`- ${i.severity}: ${i.message}`).join('\n')+`\n\nScale manifest: ${report.scale??1}. Không sửa PSD, .spine hoặc source.\nVisual QA: ${report.installed?'PENDING filmstrip + battle 1280×720/1440×900; chạy acceptance.mjs trước khi duyệt mỹ thuật.':'chưa chạy; chưa xác nhận chất lượng hình ảnh.'}\n`;
  await writeFile(resolve(evidence,'PASS-FIX-VI.md'),feedback);
  return report;
}
if (process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  const args=process.argv.slice(2),install=args.includes('--install');
  if (args.includes('--scan')) {
    const inbox='/Users/bao/art/designer-inbox';const {units}=await readSlots();
    for (const unit of units) {
      const folder=resolve(inbox,unit.id,'export'),names=await readdir(folder).catch(()=>[]);
      if (!names.length) continue;
      const result=await intake({id:unit.id,folder,install});console.log(`${unit.id}: ${result.verdict}, installed=${result.installed}`);
    }
  } else {
    const [id,folder]=args.filter(a=>!a.startsWith('--'));
    if (!id||!folder) throw Error('Usage: intake.mjs <id> <export-folder> [--install] OR --scan [--install]');
    const result=await intake({id,folder:resolve(folder),install});console.log(JSON.stringify(result,null,2));process.exitCode=result.accepted?0:1;
  }
}
