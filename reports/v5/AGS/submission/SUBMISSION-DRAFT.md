# Submission Draft (Taskbar Hero)

## One-liner
Taskbar Hero: A cosy desktop cat card RPG.

## Description
Taskbar Hero is a cosy desktop cat card-RPG: arrange a four-cat crew, defend a lantern-lit café, collect equipment and improve the team. The demo plays locally without a wallet or test tokens. Optional Avalanche Fuji integration exists for signed-voucher item ownership, trading, and transaction receipts, but the battle rewards do not establish an on-chain mint or public deployment.

## Tech Stack
* Vite + React + TypeScript + Three/Spine
* Off-chain data: Supabase

## Judge Quick-Start
1. Open [the demo URL](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3).
2. Choose Play free → Fight → Fight and read the battle guide.
3. Observe the battle result; it explicitly says no transaction was sent.

## Known Limits
* Demo currently operates locally. No transaction is sent to the Avalanche Fuji testnet in this guest demo.
* Cold battle transfer remains above 8 MB for wave3. Do not claim a sub-8-MB build, fixed 60 fps, guaranteed zero gas cost, or that every battle settles on-chain.

## Team
AGS (Sound & QA), CXI (Integration), CXV (VFX), AGV (Art).
