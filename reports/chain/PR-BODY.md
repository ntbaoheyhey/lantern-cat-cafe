Adds a Fuji-only guest wallet to the card RPG behind build flags. Guests keep a browser-local key and sign the existing SIWE flow. Export requires an explicit warning; asset moves cancel escrow, transfer tokens, then sweep gas. Existing Fuji deployments stay unchanged.

Draft progress: H0 and H1 base complete; H2–H9 ongoing. No deployment or real-key broadcast. Complete asset-move receipt coverage follows the Anvil harness and YARN/V2 contracts.

Validation: 2,386 web tests, 96 contract tests, typecheck, and a browser test that signs in twice with the same address and checks request bodies for key leakage. Screenshot: reports/chain/shots/H1-guest.png.

Scope and handoff: reports/chain/PROMPT.txt and HANDOFF.md.
