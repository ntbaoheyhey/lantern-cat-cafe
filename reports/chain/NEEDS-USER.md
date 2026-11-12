# User actions (no secrets in this file)
1. DONE: user chose real YARN on Fuji, testnet only, no value.
2. DONE: funded Fuji wallet and Supabase secret exist. User deploys guest-drip when ready.
3. Deploy V2 using USER-DEPLOY-VI.md; paste public addresses into INBOX.md.
4. Run bot-seller and fuji-smoke after deployment; share FUJI-SMOKE.md.
5. C2 OUTBOX currently has no weekly Epic+/rare-material supply. Simulation will label provisional inputs until supplied.
6. Before enabling drip, apply 20261112010000_guest_drip.sql and deploy guest-drip yourself. Set GUEST_DRIP_ENABLED=1. Existing VOUCHER_SIGNER_PRIVATE_KEY is the default sponsor; SPONSOR_PRIVATE_KEY is an optional dedicated override. Never paste either key into chat or reports.
7. Confirm the hosted gateway appends a trustworthy final x-forwarded-for hop; if that guarantee is absent, keep drip disabled until a trusted gateway is configured. Shared/absent IPs share the three-per-day bucket.
8. Apply 20261112020000_chain_judge.sql and deploy chain-judge; enable CHAIN_JUDGE_ENABLED=1 only for the testnet demo. It reuses VOUCHER_SIGNER_PRIVATE_KEY and the fixed existing Fuji NFT address. Validate trusted gateway IP handling as for the drip.
9. Ordinary offline campaign saves cannot authorize mintable drops. The chain demo uses a server-run, fixed starter boss; extending live campaign issuance requires an authoritative campaign save/replay protocol with C2.
