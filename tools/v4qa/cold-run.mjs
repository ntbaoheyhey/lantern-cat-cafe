import {runJourneys} from './journey.mjs';
const label=process.argv[2]??'q1-cold-1';
const {report}=await runJourneys({url:'http://127.0.0.1:6200',allowGuestTx:true,label});
process.exitCode=report.runs.some(r=>r.verdict==='FAIL')?1:0;
