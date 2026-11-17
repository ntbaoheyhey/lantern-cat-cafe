# Initial cold-run interpretation
The initial driver is preserved in raw results and was already loaded by its running Node process before later harness corrections.
- Six reported offscreen inputs correspond to the six audio sliders inside a closed details element. Native closed-details rendering was not excluded by the initial geometry filter. A separate read-only open/closed probe is prepared in post-cold.mjs; do not file clipping solely from the raw flag.
- The initial wallet-proof screenshot was captured when its heading appeared, before the wallet fetch completed. The initial driver did not assert data-wallet-proof-complete. Future journeys now await that attribute and record rendered holdings/history.
- Initial production fixture omitted the unchanged package metadata postbuild. Preserve initial results; post-cold.mjs records runtime/index hashes and representative metadata HTTP responses after repair.
- Battle transfer was sampled after battle visibility and an image-readiness query; it is a battle-entry checkpoint, not an exact scene-ready timestamp. Local Vite preview compression can differ from a hosted CDN.
- Public explorer success is not asserted for local Anvil hashes. Timings are shared-machine, indicative; no FPS/audio gate verdict is supplied.
