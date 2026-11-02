import { FUJI_CHAIN_ID } from '@taskbar-hero/chain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { PROOF_CACHE_MS, PROOF_CONTRACTS, contractProofUrl, readCachedFujiProof, transactionProofUrl, type ReadFact } from './fujiProof';
import './fujiProof.css';

const short = (value: string) => `${value.slice(0, 8)}…${value.slice(-6)}`;
const codeText = (fact: ReadFact<number> | undefined) => !fact || fact.status === 'unavailable' ? 'Unavailable' : fact.value > 0 ? `${fact.value.toLocaleString('en-US')} bytes of deployed code` : 'No code at this block';
export function FujiProofPanel({ enabled }: { enabled: boolean }) {
  const client = usePublicClient({ chainId: FUJI_CHAIN_ID });
  const cache = useQueryClient();
  const options = {
    queryKey: ['fuji-proof', FUJI_CHAIN_ID, PROOF_CONTRACTS.RelicNFT, PROOF_CONTRACTS.RelicMarket],
    queryFn: () => { if (!client) throw new Error('Fuji client unavailable'); return readCachedFujiProof(client); },
    staleTime: PROOF_CACHE_MS,
  };
  const query = useQuery({ ...options, enabled: enabled && Boolean(client), retry: false, refetchOnWindowFocus: false });
  const proof = query.data;
  const linked = proof?.linkedNft;
  const matches = linked?.status === 'verified' && linked.value.toLowerCase() === PROOF_CONTRACTS.RelicNFT?.toLowerCase();
  return <section className="fuji-proof" aria-label="Avalanche Fuji on-chain proof">
    <header className="fuji-proof-header"><div><h3>Avalanche Fuji proof</h3><p>Chain {FUJI_CHAIN_ID} · testnet · read-only · no wallet required</p></div>
      <button type="button" className="pixel-btn" disabled={!enabled || !client || query.isFetching} onClick={() => { void cache.fetchQuery(options).catch(() => {}); }}>Refresh proof</button></header>
    <p className="fuji-proof-cache">Reads are cached for 30 seconds, including failed reads. Refresh uses the cached result until it expires.</p>
    {query.isFetching && <p role="status">Reading Fuji…</p>}
    {(!client || query.isError) && <p role="alert">Fuji proof is unavailable right now. Try Refresh after 30 seconds. Contract links remain available.</p>}
    {proof && <p className="fuji-proof-snapshot" data-testid="proof-snapshot">Snapshot at block <strong>{proof.block.toString()}</strong> · checked {new Date(proof.checkedAt).toISOString()}{query.isError && ' · previous snapshot'}</p>}
    <div className="fuji-proof-contracts">
      {([{ name: 'RelicNFT', address: PROOF_CONTRACTS.RelicNFT, code: proof?.nftCodeBytes }, { name: 'RelicMarket', address: PROOF_CONTRACTS.RelicMarket, code: proof?.marketCodeBytes }]).map(contract =>
        <article className="fuji-proof-card" key={contract.name}><h4>{contract.name}</h4>
          {contract.address ? <a href={contractProofUrl(contract.address)} target="_blank" rel="noopener noreferrer">{contract.address}</a> : <p>Address unavailable</p>}
          <p data-testid={`proof-code-${contract.name}`}>{proof ? codeText(contract.code) : 'Waiting for a Fuji snapshot'}</p>
        </article>)}
    </div>
    {proof && <dl className="fuji-proof-facts">
      <div><dt>Block hash</dt><dd>{proof.blockHash.status === 'verified' ? <span title={proof.blockHash.value}>{short(proof.blockHash.value)}</span> : 'Unavailable'}</dd></div>
      <div><dt>Market → RelicNFT</dt><dd data-testid="proof-linkage">{linked?.status !== 'verified' ? 'Unavailable' : matches ? 'Matches the contract above' : 'Mismatch — market points to another NFT'}</dd></div>
      <div><dt>Active listings at this block</dt><dd>{proof.activeListings.status === 'verified' ? proof.activeListings.value.toString() : 'Unavailable'}</dd></div>
      <div><dt>Lifetime minted total</dt><dd>Not exposed by this NFT contract</dd></div>
    </dl>}
    <section className="fuji-proof-events" aria-label="Recent Fuji contract events"><h4>Recent contract activity</h4>
      <p>{proof ? `Blocks ${proof.fromBlock}–${proof.block}` : 'Latest 100 blocks'} · up to 10 events · this is a limited window, not lifetime history.</p>
      {!proof ? <p>Waiting for a Fuji snapshot</p> : proof.events.status === 'unavailable' ? <p role="status">Recent events unavailable. The contract facts above are independent reads.</p> : proof.events.value.length === 0 ? <p>No events found in this window.</p> :
        <ul>{proof.events.value.map((event, index) => <li key={`${event.transaction}-${index}`}><span>{event.event}</span><span>Block {event.block.toString()}</span><a href={transactionProofUrl(event.transaction)} target="_blank" rel="noopener noreferrer" title={event.transaction}>View transaction {short(event.transaction)}</a></li>)}</ul>}
    </section>
    <p className="fuji-proof-limit">Public chain reads show the contracts and recent activity. They do not verify server signer custody, backend deployment identity or a complete mint/list/buy journey.</p>
  </section>;
}
