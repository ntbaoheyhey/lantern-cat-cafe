import type { TodayRelic } from '../api/GameApi';
import { relicImageUrl } from '../market/marketText';
import { capitalize } from './forgeText';

export const txUrl = (hash: string) => `https://testnet.snowtrace.io/tx/${hash}`;

/** Today's forged Relic: its art, rarity and whether it reached the wallet. */
export function TodayRelicCard({ today, mintable }: { today: TodayRelic; mintable: boolean }) {
  return (
    <div className="forge-today" data-testid="forge-today">
      <img src={relicImageUrl(BigInt(today.relicId))} alt="" width={48} height={48} />
      <div>
        <p className="forge-today-title">
          Today's Relic: <strong className={`rarity-${today.rarityName}`}>{capitalize(today.rarityName)}</strong>
        </p>
        <p className="forge-today-status" data-testid="forge-today-status">
          {today.minted ? (
            <>
              In your wallet
              {today.txHash && (
                <>
                  {' · '}
                  <a href={txUrl(today.txHash)} target="_blank" rel="noopener noreferrer">View on Snowtrace</a>
                </>
              )}
            </>
          ) : mintable ? (
            'Mint it to your wallet'
          ) : (
            'Not minted yet. The voucher expired; forge again tomorrow.'
          )}
        </p>
      </div>
    </div>
  );
}
