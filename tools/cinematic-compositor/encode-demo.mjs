import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const run=(command,args)=>new Promise((yes,no)=>{
 const child=spawn(command,args,{stdio:['ignore','pipe','pipe']}),stdout=[],stderr=[];
 child.stdout.on('data',chunk=>stdout.push(chunk));child.stderr.on('data',chunk=>stderr.push(chunk));
 child.on('error',no);child.on('exit',code=>code===0?yes(Buffer.concat(stdout)):no(Error(Buffer.concat(stderr).toString().slice(-3000))));
});

/** Retry encoding without replaying or synthesizing the already captured journey. */
export async function encodeDemo(raw,audioPath,target){
 const metadata=JSON.parse((await run('ffprobe',['-v','error','-show_streams','-of','json',raw])).toString());
 const [n,d]=metadata.streams[0].avg_frame_rate.split('/').map(Number),fps=n/d;
 const markers=await run('ffmpeg',['-hide_banner','-loglevel','error','-i',raw,'-t','30','-vf','crop=16:8:0:0,format=gray','-f','rawvideo','-']);
 // Initial browser frames can be wholly white. The actual marker is white
 // only in its own 8px square, next to the already painted dark landing.
 let first=-1;for(let i=0;i<markers.length/128;i++){let left=0,right=0;for(let y=0;y<8;y++)for(let x=0;x<8;x++){left+=markers[i*128+y*16+x];right+=markers[i*128+y*16+x+8];}if(left/64>248&&right/64<235){first=i;break;}}
 assert.ok(first>=0,'Missing audio/video sync marker');
 await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(first/fps+.3),'-i',raw,'-ss','0.3','-i',audioPath,'-t','90','-map','0:v:0','-map','1:a:0','-vf','fps=30','-c:v','libvpx-vp9','-crf','34','-b:v','0','-row-mt','1','-cpu-used','5','-c:a','libopus','-b:a','112k',target]);
 const output=JSON.parse((await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',target])).toString());
 assert.ok(output.streams.some(s=>s.codec_type==='audio'),'Missing audio track');
 assert.ok(Math.abs(Number(output.format.duration)-90)<.1,'Demo is not 90 seconds');
 return {synchronizationFrameSeconds:1/fps,markerFrame:first,videoStartSeconds:first/fps+.3,seconds:Number(output.format.duration),bytes:Number(output.format.size),streams:output.streams.map(s=>({type:s.codec_type,codec:s.codec_name,width:s.width,height:s.height,rate:s.avg_frame_rate,sampleRate:s.sample_rate,channels:s.channels}))};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [raw,audioPath,target]=process.argv.slice(2);assert.ok(raw&&audioPath&&target,'Usage: encode-demo.mjs video.webm mix.webm output.webm');
 console.log(JSON.stringify(await encodeDemo(raw,audioPath,target),null,2));
}
