import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,evidenceRoot} from './check-gates.mjs';
const esc=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
/** Reference material is permitted only beside ours in private report sheets. */
export async function compareSheet(ours,reference,out,{label='Matched beat',height=360}={}){
  out=resolve(out);if(!out.startsWith(resolve(root,evidenceRoot)+'/'))throw Error('Comparison sheets belong only under reports/v3-battle/a2/');
  const rowHeight=Math.min(600,height),header=36,width=1280;
  const fit=async input=>sharp(input).resize(640,rowHeight,{fit:'contain',background:'#181923'}).png().toBuffer();
  const title=Buffer.from(`<svg width="1280" height="36"><rect width="1280" height="36" fill="#181923"/><g fill="white" font-family="sans-serif" font-size="15"><text x="12" y="23">OURS — ${esc(label)}</text><text x="652" y="23">REFERENCE — measurement only</text></g></svg>`);
  await mkdir(dirname(out),{recursive:true});
  await sharp({create:{width,height:rowHeight+header,channels:3,background:'#181923'}}).composite([{input:title,left:0,top:0},{input:await fit(ours),left:0,top:header},{input:await fit(reference),left:640,top:header}]).png().toFile(out);
  return out;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [ours,reference,out,label]=process.argv.slice(2);if(!ours||!reference||!out)throw Error('Usage: compare-sheet.mjs OURS REF reports/v3-battle/a2/CARD/compare-name.png [label]');
  console.log(await compareSheet(ours,reference,out,{label}));
}
