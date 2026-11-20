/** Decode every audio frame; streaming WebM may omit its duration header. */
import {spawnSync} from 'node:child_process';

export function decodedDuration(path){
 const result=spawnSync('ffprobe',['-v','error','-select_streams','a:0','-show_frames',
  '-show_entries','frame=best_effort_timestamp_time,nb_samples:stream=sample_rate:format=duration',
  '-of','json',path],{encoding:'utf8',maxBuffer:32*1024*1024});
 if(result.status!==0||result.stderr.trim())throw Error('Recording did not decode cleanly');
 const probe=JSON.parse(result.stdout),rate=Number(probe.streams?.[0]?.sample_rate),frames=probe.frames;
 if(!Number.isFinite(rate)||rate<=0||!Array.isArray(frames)||!frames.length)throw Error('Missing decoded audio');
 let samples=0,first=null,lastStart=null,lastEnd=null,maxGap=0,minGap=0;
 for(const frame of frames){
  const start=Number(frame.best_effort_timestamp_time),count=frame.nb_samples;
  if(!Number.isFinite(start)||!Number.isSafeInteger(count)||count<=0)throw Error('Invalid decoded audio frame');
  if(lastStart!==null&&start<lastStart)throw Error('Nonmonotonic audio timestamps');
  if(lastEnd!==null){const gap=start-lastEnd;maxGap=Math.max(maxGap,gap);minGap=Math.min(minGap,gap);}
  first??=start;lastStart=start;lastEnd=start+count/rate;samples+=count;
 }
 const header=Number(probe.format?.duration);
 return {method:'Decoded frame sample count and timestamp span',sampleRate:rate,frames:frames.length,
  encodedSeconds:samples/rate,timestampSpanSeconds:lastEnd-first,
  headerSeconds:Number.isFinite(header)?header:null,maximumTimestampGapMs:maxGap*1000,minimumTimestampGapMs:minGap*1000};
}
