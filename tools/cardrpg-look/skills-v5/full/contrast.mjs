import {readFile,writeFile} from 'node:fs/promises';import {gunzipSync} from 'node:zlib';
const d=JSON.parse(gunzipSync(await readFile(process.argv[2]))),rows=d.shots.map(r=>({id:r.id,width:r.width,contrast:r.contrast}));
const result={method:'Computed CSS foreground/background WCAG luminance including numeric labels, badges, reaction words.',min:Math.min(...rows.map(r=>r.contrast)),rows};
await writeFile(process.argv[3],JSON.stringify(result,null,2));console.log(JSON.stringify({min:result.min,pass:result.min>=4.5}));
