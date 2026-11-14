import {parentPort,workerData} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {evaluate} from './search-core.mjs';
import {sha} from './runtime.mjs';
const runtime=await import(pathToFileURL(workerData.runtimePath));
const readBank=path=>gunzipSync(readFileSync(path)).toString().trim().split('\n').map(x=>JSON.parse(x));
let bankPath=workerData.bankPath,bank=readBank(bankPath);
parentPort.on('message',job=>{
 try{const at=performance.now();const nextPath=job.bankPath??workerData.bankPath;
  if(job.bankHash&&sha(nextPath)!==job.bankHash)throw Error('Sensitivity bank hash mismatch');
  if(nextPath!==bankPath){bank=readBank(nextPath);bankPath=nextPath;}
  parentPort.postMessage({...evaluate(runtime,bank,job.config,job.seeds,job.firstSeed,job.scenarios),elapsedSeconds:(performance.now()-at)/1000,id:job.id});}
 catch(error){parentPort.postMessage({error:error.stack,id:job.id});}
});
