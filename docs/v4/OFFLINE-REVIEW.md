# V4 offline review preparation

The local review package opens directly from `work/v4ship-prep/S10-offline-4/index.html`; keep its `assets/` folder beside it. It is a 261,404,426-byte folder, retained locally rather than committed. It is preparation for the scheduled R2, not the submission build or public-chain evidence.

All chain actions are explicitly mocked. No wallet is connected, no private key is created and no transaction is sent. The seven-step interface and original game assets/audio remain present. Both trial battles use the real server `judgeTrial(true)` rules. Mock ledger records use `mock-01` IDs and cannot link to Snowtrace transactions. The permanent mock label stays outside the battle controls.

Open `index.html` in current desktop Chrome/Edge, choose **Play free**, then follow the trial, reward, workshop and boss buttons. The wallet button explains offline mode. Reloading during the workshop retains progress. **Restart offline journey** clears only this review's journey and mock ledger. Every displayed chain value is illustrative; this package does not measure G-FUNNEL, G-PROOF or G-REHEARSAL.

To reproduce from the repository, use a new numeric build and check ID; the tools refuse to overwrite prior evidence:

```sh
node tools/v4ship-lab/offline/build.mjs 5
node tools/v4ship-lab/offline/check.mjs 5 3
```

The check blocks HTTP and uses a clean browser profile for each desktop size. It verifies every restored asset against its original SHA-256, completes both real battles and all mock actions, reloads the workshop, checks the ledger and resets it. Screenshot collection is opt-in and the S10 preparation has already used its eight-image allowance; leave it disabled.

[Functional check](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S10/offline-check-2.json) passed at 1280×720 and1440×900 with zero errors, missing/broken assets, HTTP attempts or CSP violations. All1,614asset hashes matched in each profile. [Final layout check](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S10/offline-layout-1.json) verifies that build4 has exactly the same JavaScript modules and packed asset bytes as the exercised build3, with a CSS-only label/counter correction. Its two layouts pass visibility, viewport and control-overlap checks. The full repository regression retains the seven known ART test failures and the unapproved class-baseline gate.

[Preparation evidence](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S10/preparation-check-1.json). Preserve the first failed package check: an escaped inline regular expression raised a bootstrap error. The packer now compiles every executable inline script before accepting a build. A strict metadata comparison also initially failed because concurrent imports changed asset insertion order; the follow-up compares the same unique keys, byte lengths, MIME types and hashes in sorted order, while the packed files and JavaScript remain byte-identical.
