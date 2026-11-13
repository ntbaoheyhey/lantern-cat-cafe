export type CampaignRewardKind='weekly-boss'|'season-rank';
export interface CampaignRewardQuote {
  chainId:43113;contract:string;wallet:string;kind:CampaignRewardKind;
  period:number;season:number;nonce:string;amount:string;used:boolean;
}
