// REFERENCE: PROMPT-A5 H0. Local IPC only; the parent owns one persistent headless page.
import { connect } from 'node:net';
const socket=connect(process.argv[2]);let response='';
socket.on('connect',()=>socket.write('run\n'));
socket.on('data',chunk=>response+=chunk);
socket.on('error',error=>{console.error(error);process.exitCode=1;});
socket.on('end',()=>{console.log(response.trim());try{process.exitCode=JSON.parse(response).code;}catch{process.exitCode=1;}});
