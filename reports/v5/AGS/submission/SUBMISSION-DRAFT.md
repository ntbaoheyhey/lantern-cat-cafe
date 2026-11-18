# Submission Draft (Taskbar Hero)

## One-liner
Taskbar Hero: A cosy desktop cat card RPG.

## Description
Taskbar Hero is a cosy desktop cat card-RPG: arrange a four-cat crew, defend a lantern-lit café, collect equipment and improve the team. The demo plays locally in the browser. Signed-voucher item ownership, trading, and transaction receipts are supported on Avalanche Fuji, but the battle rewards do not establish an on-chain mint.

## Tech Stack
* Vite + React + TypeScript + Three/Spine
* Off-chain data: Supabase

## Judge Quick-Start
1. Open [the demo URL](http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3).
2. Choose Play free → Fight → Fight and read the battle guide.
3. Observe the battle result; it explicitly says no transaction was sent.

## Known Limits
* Demo operates locally in the browser; local battle rewards do not establish an on-chain mint.
* Cold battle transfer remains above 8 MB for wave3. Do not claim a sub-8-MB build, fixed 60 fps, or that every battle settles on-chain.

## Team
AGS (Sound & QA), CXI (Integration), CXV (VFX), AGV (Art).
