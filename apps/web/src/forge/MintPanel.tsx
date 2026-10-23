import { FUJI_CHAIN_ID, getAddresses, relicNftAbi } from '@taskbar-hero/chain';
import { useState } from 'react';
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi';
import type { GameApi, RelicVoucher } from '../api/GameApi';
import type { GameLoop } from '../game/gameState';
import { isDemoVoucher, isUserRejection, mintArgs } from './forgeText';
import { saveUnreported, type UnreportedMint } from './mintStore';
import { reportMint } from './report';

/** Refresh a voucher that expires within this many seconds before sending it to the wallet. */
const EXPIRY_MARGIN_S = 120;

type Status = 'idle' | 'preparing' | 'signing' | 'confirming' | 'reporting';

const BUSY: Record<Exclude<Status, 'idle'>, string> = {
  preparing: 'Preparing…',
  signing: 'Confirm in your wallet…',
  confirming: 'Minting on Fuji…',
  reporting: 'Saving…',
};

export interface MintPanelProps {
  voucher: RelicVoucher;
  api: GameApi;
  loop: GameLoop;
  /** Called after the tx succeeded on chain; `confirmed` once the server has recorded it too. */
  onMinted: (mint: UnreportedMint, confirmed: boolean) => void;
}

/** Sends a server-signed voucher to RelicNFT.mint from the player's wallet, then reports the tx. */
export function MintPanel({ voucher, api, loop, onMinted }: MintPanelProps) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient({ chainId: FUJI_CHAIN_ID });
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const relicNft = getAddresses(FUJI_CHAIN_ID).RelicNFT;

  if (isDemoVoucher(voucher)) {
    return <p className="forge-note" data-testid="forge-demo">This is a demo Relic. Sign in to mint on Fuji.</p>;
  }
  if (!relicNft) {
    return <p className="forge-note">The Relic contract is not deployed on Fuji yet, so minting is not available.</p>;
  }
  if (!isConnected) {
    return <p className="forge-note">Connect your wallet to mint this Relic.</p>;
  }
  if (chainId !== FUJI_CHAIN_ID) {
    return (
      <div className="forge-mint">
        <p className="forge-note" role="alert">Wrong network. Switch to Avalanche Fuji to mint.</p>
        <button type="button" className="forge-btn" disabled={switching} onClick={() => switchChain({ chainId: FUJI_CHAIN_ID })}>
          Switch to Fuji
        </button>
      </div>
    );
  }

  const mint = async () => {
    setMessage(null);
    setStatus('preparing');
    try {
      let v = voucher;
      if (v.expiry <= Date.now() / 1000 + EXPIRY_MARGIN_S) v = (await api.forgeRelic()).voucher; // re-signed, same Relic
      setStatus('signing');
      const hash = await writeContractAsync({
        address: relicNft,
        abi: relicNftAbi,
        functionName: 'mint',
        args: mintArgs(v),
        chainId: FUJI_CHAIN_ID,
      });
      saveUnreported({ nonce: v.nonce, hash }); // a closed tab still reports it next time
      setStatus('confirming');
      if (!client) throw new Error('No Fuji connection');
      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') {
        setMessage('The mint transaction failed on chain. Your Relic is safe, you can try again.');
        return;
      }
      setStatus('reporting');
      const m = { nonce: v.nonce, hash };
      onMinted(m, (await reportMint(api, loop, m)) !== 'retry');
    } catch (e) {
      setMessage(
        isUserRejection(e)
          ? 'Mint cancelled, you can try again.'
          : 'Mint failed. Your Relic is safe, you can try again.',
      );
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="forge-mint">
      <button type="button" className="forge-btn" disabled={status !== 'idle'} onClick={() => void mint()}>
        {status === 'idle' ? 'Mint to wallet' : BUSY[status]}
      </button>
      {message && <p className="forge-note" role="status" data-testid="mint-message">{message}</p>}
    </div>
  );
}
