/** Required Node entry point; identical NumPy analysis for sources and renders. */
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const result=spawnSync('python3',[resolve(import.meta.dirname,'voice-distinct.py'),...process.argv.slice(2)],{stdio:'inherit'});
process.exitCode=result.status??1;
