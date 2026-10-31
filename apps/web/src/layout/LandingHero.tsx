import React from 'react';
import { CatPortrait } from '../CatPortrait';
import { BackdropView } from '../art/backdrops/BackdropView';
import { backdropFor } from '../art/backdrops';
import { WalletButton } from '../wallet/WalletButton';
import './landing.css';

export interface LandingHeroProps {
  onStart?: () => void;
  onStartGuest?: () => void;
  onHelp?: () => void;
}

export function LandingHero({ onStart, onStartGuest, onHelp }: LandingHeroProps) {
  const handleGuest = onStartGuest ?? onStart ?? (() => {});

  return (
    <section className="landing" aria-labelledby="landing-title" data-testid="landing-hero">
      {/* Network pill */}
      <div className="landing__network-pill" data-testid="landing-network-pill">
        <span className="landing__network-dot" aria-hidden="true" />
        <span>Live on Avalanche Fuji</span>
      </div>

      {/* Hero Visual Scene */}
      <div className="landing__scene" aria-hidden="true">
        <BackdropView art={backdropFor(1)} className="landing__backdrop" />
        <div className="landing__cat-wrap">
          <CatPortrait size={96} />
        </div>
      </div>

      {/* Copy block */}
      <div className="landing__content">
        <h1 id="landing-title" className="landing__title">
          A cat RPG that plays itself
        </h1>
        <p className="landing__promise">
          Your cat lives in a thin strip above your taskbar. Collect fish, upgrade gear and beat the bosses.
        </p>

        {/* CTA buttons */}
        <div className="landing__actions">
          <button
            type="button"
            className="pixel-btn landing__guest-btn"
            onClick={handleGuest}
            data-testid="landing-start"
          >
            Play as guest
          </button>
          <div className="landing__wallet-btn-wrap" data-testid="landing-wallet">
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Proof strip */}
      <div className="landing__proof-strip" role="region" aria-label="Game guarantees and proof">
        <div className="landing__proof-item">
          <span className="landing__proof-pill">ERC-721</span>
          <span>Relic NFT</span>
        </div>

        <div className="landing__proof-divider" aria-hidden="true">·</div>

        <div className="landing__proof-item">
          <a
            className="landing__proof-link"
            href="https://testnet.routescan.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D/contract"
            target="_blank"
            rel="noreferrer"
          >
            Verified on Routescan ↗
          </a>
        </div>

        <div className="landing__proof-divider" aria-hidden="true">·</div>

        <div className="landing__proof-item">
          <span className="landing__proof-check" aria-hidden="true">✓</span>
          <span>Server-checked fights</span>
        </div>

        <div className="landing__proof-divider" aria-hidden="true">·</div>

        <div className="landing__proof-item">
          <a
            className="landing__proof-link"
            href="https://github.com/ntbaoheyhey/taskbar-hero"
            target="_blank"
            rel="noreferrer"
          >
            Open source ↗
          </a>
        </div>

        {onHelp && (
          <>
            <div className="landing__proof-divider" aria-hidden="true">·</div>
            <div className="landing__proof-item">
              <button
                type="button"
                className="landing__proof-btn"
                onClick={onHelp}
                data-testid="landing-help-link"
              >
                Help & Guide
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
