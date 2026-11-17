# Verified submission language — local desktop build

This is preparation for the owner, not a submitted form or public deployment. Validated release tag: **v5-m1.10**. Use the current [desktop evidence](I-C.md), [review footage](REVIEW-VI.md) and [owner runbook](NEEDS-USER-VI.md) when updating this draft.

## Short description

Taskbar Hero is a cosy desktop cat card RPG: arrange a four-cat crew, defend a lantern-lit café, collect equipment and improve the team. Its optional Avalanche Fuji integration supports signed-voucher item ownership, trading and transaction receipts. The current browser demo plays locally without a wallet; its battle rewards do not establish an on-chain mint.

## What the current evidence supports

| Claim | Evidence and boundary |
| --- | --- |
| Playable desktop battle | Ordinary fresh guest journey at 1280×720; first visible hit in 20.595 seconds including 17.7 seconds reading eight tutorial cards. No saved progress or speed change. [I-C](I-C.md) |
| Real gameplay footage | Three 30-second wave1/wave3/boss films at 1× with actual browser audio. These use labelled review fixtures, separate from the ordinary guest journey. [Review](REVIEW-VI.md) |
| Avalanche contract presence | Five versioned Fuji registry addresses returned bytecode in the recorded public read-only check. This does not prove a completed player transaction or verified source equivalence. [Public check](PUBLIC-FUJI.json) |
| Honest result screen | A local battle explicitly says no transaction was sent and links the deployed Fuji items contract. Confirmed chain actions have a separate receipt path for hash, fee, payer, network and explorer URL. [Architecture](../../../docs/ARCHITECTURE.md) |
| Guest-wallet implementation | Configured chain mode uses an ordinary EOA and SIWE; sponsor test-AVAX funding and subsequent guest-paid gas are separate actions. There is no ERC-4337/paymaster implementation. [README](../../../README.md) |
| Local proof tooling | The isolated Anvil experiment completed in 516 ms. Its timing and fee are local measurements, not Fuji performance. [Owner runbook](NEEDS-USER-VI.md) |

## Three-minute review sequence

1. Open the full desktop URL: http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3. This is available only on the preview host; the owner must replace the origin with a verified public deployment while retaining the query string.
2. Choose **Play free → Fight → Fight** and read the battle guide. Show the actual battle and local result wording.
3. Show the deployed-contract link and explain which features require configured chain services. Show a public transaction only after an owner-run transaction has produced a verified hash.
4. Open the README and labelled real gameplay clips. Any promotional title or mood shot must be identified separately from gameplay.

## Open facts before submission

- Public hosting of this release and a funded Fuji transaction remain owner-only work; no public transaction hash is currently supplied by this evidence.
- Cold battle transfer remains above 8 MB for wave3 (8,228,615 bytes); wave1 and boss pass, with 256,935 bytes of boss headroom. Do not claim a sub-8-MB build, fixed 60 fps, guaranteed zero gas cost or that every battle settles on-chain.
- RelicForge has no public address in the versioned Fuji registry; do not present it as a proven public deployment.
- Current combat presentation uses React with Three/Spine and authored artwork; older Phaser paths also remain in the repository.
- Team names, eligibility and submission account details require the owner's factual input. Agent lane IDs are not verified human team identities.
