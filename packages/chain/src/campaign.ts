/** Public campaign protocol. Seeds, full saves and future drops stay on the server. */
export type CampaignCommand =
  | {type:'start';chapter:number}
  | {type:'enter';node:string}
  | {type:'fight'|'abandon'|'idle'}
  | {type:'reward';choice:string}
  | {type:'resolve';choice:string;target?:string}
  | {type:'level';cat:string}
  | {type:'equip';cat:string;instance:string|null;slot:'weapon'|'outfit'|'charm'|'relic'}
  | {type:'salvage';instance:string}
  | {type:'export';instance:string;normalization:'depth-min-roll-v1'};
export interface CampaignRequest {id:string;revision:number;command:CampaignCommand}
export interface CampaignView {
  revision:number;rules:string;day:number;remaining:number;chapter:number;
  phase:'home'|'route'|'fight'|'reward'|'event'|'won'|'lost';
  steps:number;points:number;
  choices:{label:string;hint?:string;command:CampaignCommand}[];
  crew:{id:string;level:number}[];
  gear:{instance:string;item:string;eligible:boolean;equipped:boolean}[];
}
export interface CampaignResponse {
  view:CampaignView;
  receipt:{id:string;revision:number;inventory:string|null}|null;
}
