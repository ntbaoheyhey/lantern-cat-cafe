// Preserve the R0 screenshots; historical comparisons explicitly disclose HUD differences.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const root='reports/cardrpg-look/art-rebuild',out=root+'/p10';await mkdir(out,{recursive:true});
for(const [name,before,after,impact] of [['roster','r0/before/1440-hero.webp','p7/after/enemy-button-guard-1440.webp',false],['soot-ultimate','r0/before/1440-soot.webp','p7/casts/soot-4.webp',true]]){
 const a=await sharp(root+'/'+before).resize(720,450).toBuffer();
 let image=sharp(root+'/'+after);image=impact?image.extract({left:0,top:510,width:720,height:450}):image.resize(720,450);
 const b=await image.toBuffer(),label=Buffer.from('<svg width="1440" height="555"><g fill="#f6ead1" font-size="22" font-family="Arial"><text x="16" y="31">R0 | original native baseline</text><text x="736" y="31">NOW | illustrated puppets in current A6 shell</text></g><text x="16" y="532" fill="#d0cfbe" font-size="17" font-family="Arial">Historical comparison: different battle/HUD. Original screenshots retained; no same-frame timing claim.</text></svg>');
 await sharp({create:{width:1440,height:555,channels:3,background:'#173039'}}).composite([{input:a,left:0,top:48},{input:b,left:720,top:48},{input:label,left:0,top:0}]).webp({quality:88}).toFile(out+'/r0-vs-puppet-'+name+'.webp');
}
console.log('Two historical comparison posters written');
