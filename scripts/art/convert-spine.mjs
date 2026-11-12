import {importSkeleton} from './import-spine.mjs';
{
 const {readFile,mkdir,writeFile}=await import('node:fs/promises');const {dirname,resolve}=await import('node:path');
 const [input,atlas,output]=process.argv.slice(2);if(!input||!atlas||!output)throw Error('Usage: node scripts/art/import-spine.mjs skeleton.json page.atlas output.json');
 const data=importSkeleton(JSON.parse(await readFile(input,'utf8')),await readFile(atlas,'utf8'));await mkdir(dirname(resolve(output)),{recursive:true});await writeFile(output,JSON.stringify(data)+'\n');console.log(`${data.nodes.length} nodes, ${data.parts.length} parts, ${Object.keys(data.clips).length} clips -> ${output}`);
}
