import {getAddresses} from '@taskbar-hero/chain';

/** Public deployment evidence stays distinct from a transaction receipt. */
export function DeploymentEvidence(){
 const address=getAddresses(43113).RelicNFT;
 if(!address)return null;
 return <aside className="a6-deployment-evidence" aria-label="Avalanche deployment">
  <strong>Avalanche Fuji testnet</strong>
  <small>Local battle · no transaction sent</small>
  <a href={`https://testnet.snowtrace.io/address/${address}`} target="_blank" rel="noreferrer">View deployed items contract ↗</a>
 </aside>;
}
