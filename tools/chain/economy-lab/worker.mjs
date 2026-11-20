import {parentPort,workerData} from 'node:worker_threads';
import {pathToFileURL} from 'node:url';
import {gearAccount} from './cohort.mjs';
const runtime=await import(pathToFileURL(workerData.runtimePath));
parentPort.on('message',job=>{
 try{const at=performance.now(),report=gearAccount(runtime,runtime.ECONOMY_LAB,job.seed,runtime.ECONOMY_LAB.profiles.find(p=>p.id===job.profile));parentPort.postMessage({report,elapsedSeconds:(performance.now()-at)/1000});}
 catch(error){parentPort.postMessage({error:error.stack,job});}
});
