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
      {/* Full-bleed background scene */}
      <div className="landing__scene" aria-hidden="true">
        <BackdropView art={backdropFor(1)} width={640} className="landing__backdrop" />
      </div>

      {/* Hero content grid */}
      <div className="landing__hero">
        <div className="landing__hero-left">
          {/* Network pill */}
          <div className="landing__network-pill" data-testid="landing-network-pill">
            <span className="landing__network-dot" aria-hidden="true" />
            <span>Live on Avalanche Fuji</span>
          </div>

          {/* Title */}
          <div id="landing-title" className="landing__title" aria-hidden="true">
            Taskbar<br />Hero
          </div>

          {/* Promise copy */}
          <p className="landing__promise">
            A cozy idle RPG that lives in a strip of your browser. Your cat fights while you work. Rare gear can become a Relic you truly own.
          </p>

          {/* CTA buttons */}
          <div className="landing__actions">
            <button
              type="button"
              className="landing__guest-btn"
              onClick={handleGuest}
              data-testid="landing-start"
            >
              Play as guest
            </button>
            <div className="landing__wallet-btn-wrap" data-testid="landing-wallet">
              <WalletButton />
            </div>
          </div>

          {/* Footnote */}
          <p className="landing__footnote">
            No token. No fees to play. Wallet only needed to mint or trade Relics.
          </p>
        </div>

        <div className="landing__hero-right" aria-hidden="true">
          <div className="landing__cats-group">
            <div className="landing__cat-item landing__cat-item--primary">
              <CatPortrait size={160} />
            </div>
          </div>
        </div>
      </div>

      {/* Proof strip pinned to bottom */}
      <div className="landing__proof-strip" role="region" aria-label="Game guarantees and proof">
        <div className="landing__proof-item">
          <span className="landing__proof-pill">ERC-1155</span>
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
            Repository ↗
          </a>
        </div>

        {onHelp && (
          <>
            <div className="landing__proof-divider" aria-hidden="true">·</div>
            <div className="landing__proof-item landing__proof-item--help">
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
