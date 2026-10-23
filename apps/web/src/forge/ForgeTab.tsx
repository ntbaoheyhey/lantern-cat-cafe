import { CONFIG } from '@taskbar-hero/game-rules';
import { useEffect, useRef, useState } from 'react';
import { GameApiError, type ForgeResult, type GameApi, type RelicVoucher } from '../api/GameApi';
import type { GameLoop } from '../game/gameState';
import { getGameApi, getGameLoop, useGameMode, useGameSnapshot } from '../game/store';
import { LABELS } from '../theme/labels';
import { blockText, oddsRows, relicName } from './forgeText';
import { MintPanel } from './MintPanel';
import { loadUnreported, type UnreportedMint } from './mintStore';
import { reportMint } from './report';
import { relicImageUrl } from '../market/marketText';
import { TodayRelicCard, txUrl } from './TodayRelicCard';
import './forge.css';

export const REVEAL_MS = 1500;

export interface ForgeTabProps {
  api?: GameApi;
  loop?: GameLoop;
  /** Demo mode (mock API); defaults to the app's mode. */
  demo?: boolean;
  revealMs?: number;
}

/** Forge a Relic from shards and a Boss Key, reveal its rarity, and mint it to the wallet. */
export function ForgeTab({ api = getGameApi(), loop = getGameLoop(), demo, revealMs = REVEAL_MS }: ForgeTabProps) {
  const { server } = useGameSnapshot(loop);
  const mode = useGameMode();
  const isDemo = demo ?? mode.demo;
  const [voucher, setVoucher] = useState<RelicVoucher | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [pendingForge, setPendingForge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreported, setUnreported] = useState<UnreportedMint | null>(() => (isDemo ? null : loadUnreported()));
  const [minted, setMinted] = useState<UnreportedMint | null>(null);
  const [checking, setChecking] = useState(false);
  // The forge's new state waits for the reveal, like BossTab's fight result.
  const unapplied = useRef<ForgeResult | null>(null);

  const apply = () => {
    if (unapplied.current) loop.adopt(unapplied.current.state);
    unapplied.current = null;
  };

  useEffect(() => {
    if (!revealing) return;
    const t = setTimeout(() => {
      setRevealing(false);
      apply();
    }, revealMs);
    return () => clearTimeout(t);
  }, [revealing, revealMs]);

  useEffect(() => apply, []); // leaving the tab mid-reveal still applies the result

  // A mint whose report never reached the server (closed tab): report it now.
  useEffect(() => {
    if (isDemo) return;
    const m = loadUnreported();
    if (!m) return;
    let live = true;
    void reportMint(api, loop, m).then((outcome) => {
      if (!live) return;
      if (outcome === 'ok') setMinted(m);
      if (outcome !== 'retry') setUnreported(null);
    });
    return () => {
      live = false;
    };
  }, [api, loop, isDemo]);

  if (!server) return <p>Loading the forge…</p>;
  const { shards, bossKeys, forge } = server;
  const toMint = voucher ?? forge.pending;

  const doForge = async () => {
    setPendingForge(true);
    setError(null);
    setMinted(null);
    try {
      const result = await api.forgeRelic();
      unapplied.current = result;
      setVoucher(result.voucher);
      setRevealing(true);
    } catch (e) {
      setError(
        e instanceof GameApiError && e.code === 'forge_blocked'
          ? 'You cannot forge right now.'
          : 'The forge failed. Please try again.',
      );
    } finally {
      setPendingForge(false);
    }
  };

  const onMinted = (m: UnreportedMint, confirmed: boolean) => {
    if (confirmed) {
      setVoucher(null);
      setMinted(m);
    } else {
      setUnreported(m);
    }
  };

  const checkAgain = async () => {
    if (!unreported) return;
    setChecking(true);
    const outcome = await reportMint(api, loop, unreported);
    setChecking(false);
    if (outcome === 'ok') {
      setVoucher(null);
      setMinted(unreported);
    }
    if (outcome !== 'retry') setUnreported(null);
  };

  return (
    <div className="forge">
      <div className="forge-top">
        <dl className="stats forge-stats">
          <dt>Cost</dt>
          <dd>{CONFIG.relic.shardCost} {LABELS.shards} + {CONFIG.relic.bossKeyCost} {LABELS.bossKey}</dd>
          <dt>{LABELS.shards}</dt>
          <dd data-testid="forge-shards">{shards.toLocaleString('en-US')}</dd>
          <dt>{LABELS.bossKey}s</dt>
          <dd data-testid="forge-keys">{bossKeys}</dd>
        </dl>
        <ul className="forge-odds" aria-label="Relic odds">
          {oddsRows().map(({ rarity, percent }) => (
            <li key={rarity}>
              <span className={`rarity-${rarity}`}>{LABELS.rarities[rarity]}</span> {percent}
            </li>
          ))}
        </ul>
      </div>

      {forge.today && !revealing && !unreported && <TodayRelicCard today={forge.today} mintable={!!toMint} canReissue={forge.blockedBy === null} />}

      {revealing ? (
        <p className="forge-reveal forging" aria-live="polite">Forging…</p>
      ) : unreported ? (
        <div className="forge-result">
          <p>
            Your Relic is minted (<a href={txUrl(unreported.hash)} target="_blank" rel="noreferrer">view on Snowtrace</a>).
            Waiting for the game to confirm it.
          </p>
          <button type="button" className="forge-btn" disabled={checking} onClick={() => void checkAgain()}>
            {checking ? 'Checking…' : 'Check again'}
          </button>
        </div>
      ) : toMint ? (
        <div className="forge-result" aria-live="polite">
          <div className={`relic-tile rarity-${toMint.rarityName}${voucher ? ' reveal' : ''}`}>
            <img src={relicImageUrl(BigInt(toMint.relicId))} alt="" width={64} height={64} />
          </div>
          {voucher ? (
            <p className="forge-reveal" data-testid="forge-rarity">
              You forged a <strong className={`rarity-${toMint.rarityName}`}>{relicName(toMint.rarityName)}</strong>!{' '}
              <span className={`forge-tag rarity-${toMint.rarityName}`}>{LABELS.rarities[toMint.rarityName]}</span>
            </p>
          ) : (
            <p data-testid="forge-pending">
              You have an unminted <strong className={`rarity-${toMint.rarityName}`}>{relicName(toMint.rarityName)}</strong>.{' '}
              <span className={`forge-tag rarity-${toMint.rarityName}`}>{LABELS.rarities[toMint.rarityName]}</span>
            </p>
          )}
          <MintPanel voucher={toMint} api={api} loop={loop} onMinted={onMinted} />
        </div>
      ) : forge.today && (forge.today.minted || forge.blockedBy !== null) ? null : forge.today ? (
        // Unminted with no voucher but forging allowed: the server re-signs the same Relic.
        <div className="forge-actions">
          <button type="button" className="forge-btn" disabled={pendingForge} onClick={() => void doForge()}>
            {pendingForge ? 'Getting a voucher…' : 'Get a new voucher'}
          </button>
        </div>
      ) : (
        <div className="forge-actions">
          <button
            type="button"
            className="forge-btn forge-go"
            disabled={pendingForge || forge.blockedBy !== null}
            onClick={() => void doForge()}
          >
            {pendingForge ? 'Forging…' : 'Forge'}
          </button>
          {forge.blockedBy && (
            <p className="forge-note" data-testid="forge-blocked">{blockText(forge.blockedBy, shards)}</p>
          )}
        </div>
      )}

      {minted && (
        <p className="forge-done" role="status" data-testid="forge-minted">
          Relic minted. In your wallet! <a href={txUrl(minted.hash)} target="_blank" rel="noreferrer">View on Snowtrace</a>
        </p>
      )}
      {error && <p role="alert" className="forge-error">{error}</p>}
    </div>
  );
}
