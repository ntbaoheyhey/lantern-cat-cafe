import type { TodayRelic } from '../api/GameApi';
import { relicImageUrl } from '../market/marketText';
import { LABELS } from '../theme/labels';
import { relicName } from './forgeText';

export const txUrl = (hash: string) => /^0x[0-9a-fA-F]{64}$/.test(hash) ? `https://testnet.snowtrace.io/tx/${hash}` : undefined;

/** Today's forged Relic: its art, rarity and whether it reached the wallet. */
export function TodayRelicCard({ today, mintable, canReissue }: { today: TodayRelic; mintable: boolean; canReissue: boolean }) {
  const url = today.txHash ? txUrl(today.txHash) : undefined;
  return (
    <div className="forge-today" data-testid="forge-today">
      <img src={relicImageUrl(BigInt(today.relicId))} alt="" width={48} height={48} />
      <div>
        <p className="forge-today-title">
          Today's Relic: <strong className={`rarity-${today.rarityName}`}>{relicName(today.rarityName)}</strong>{' '}
          <span className={`forge-tag rarity-${today.rarityName}`}>{LABELS.rarities[today.rarityName] ?? today.rarityName}</span>
        </p>
        <p className="forge-today-status" data-testid="forge-today-status">
          {today.minted ? (
            <>
              In your wallet
              {url && (
                <>
                  {' · '}
                  <a href={url} target="_blank" rel="noopener noreferrer">View on Snowtrace</a>
                </>
              )}
            </>
          ) : mintable ? (
            'Mint it to your wallet'
          ) : canReissue ? (
            'Voucher expired. Get a new one to mint it.'
          ) : (
            'Not minted yet. The voucher expired; forge again tomorrow.'
          )}
        </p>
      </div>
    </div>
  );
}
