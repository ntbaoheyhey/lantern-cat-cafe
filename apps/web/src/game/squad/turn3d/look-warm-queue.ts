/** Shared across LOOK scenes so independent loaders cannot exhaust one frame.
 * A single driver operation cannot be preempted; its measured cost is retained. */
export class LookWarmQueue {
  private jobs:{name:string;run:()=>void;cancelled:()=>boolean;resolve:()=>void;reject:(error:unknown)=>void}[]=[];
  private scheduled=false;
  constructor(readonly budgetMs=32){}
  enqueue(name:string,run:()=>void,cancelled:()=>boolean=()=>false){
    return new Promise<void>((resolve,reject)=>{
      this.jobs.push({name,run,cancelled,resolve,reject});this.schedule();
    });
  }
  private schedule(){if(this.scheduled)return;this.scheduled=true;requestAnimationFrame(()=>setTimeout(()=>this.drain(),0));}
  private drain(){
    this.scheduled=false;const start=performance.now();
    // Reserve half of the 40ms envelope for a slow single driver operation.
    while(this.jobs.length&&performance.now()-start<this.budgetMs/2){
      const job=this.jobs.shift()!;
      if(job.cancelled()){job.resolve();continue;}
      const at=performance.now();
      try{job.run();job.resolve();}catch(error){job.reject(error);}
      performance.measure(`look-prewarm:${job.name}`,{start:at});
    }
    performance.measure('look-prewarm:queue-slice',{start});
    if(this.jobs.length)this.schedule();
  }
}
export const lookWarmQueue=new LookWarmQueue();
