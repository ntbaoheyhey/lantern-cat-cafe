# Paired bare-item effects

Both modes use the same registered 20001–20500 block, 500 seeds per cell. This review reads complete retained outcomes only. It does not replay, retune or replace any sample. The original 128 templates × three carriers × two levels × three bosses yields 2,304 cells per mode. [Source hashes and every gate transition](pieces-attribution.json).

The unchanged cap is a gain of at most 12 percentage points in every cell. Fallback has 22/2,304 misses, worst 60.40pp; V5 has 36/2,304 misses, worst 47.80pp. 21 previous misses pass, while 35 previous passes fail; 1 fail in both.

Each group below contains 384 cells. Values are fallback / V5. Zero-win counts show fixture floors; they are retained in the original denominators.

|Level|Boss chapter|Misses|Zero wins without item|Zero wins with item|Largest gain|
|---|---|---:|---:|---:|---:|
|1|1|0 / 0|384 / 384|384 / 274|0.00 / 3.40pp|
|1|2|0 / 0|384 / 384|384 / 384|0.00 / 0.00pp|
|1|3|0 / 0|384 / 384|273 / 384|0.60 / 0.00pp|
|6|1|0 / 34|384 / 0|202 / 0|3.20 / 47.80pp|
|6|2|0 / 0|384 / 0|384 / 59|0.00 / 1.20pp|
|6|3|22 / 2|384 / 0|287 / 0|60.40 / 13.20pp|

|Mode|Largest-gain case|Without → with item wins|Gain|
|---|---|---:|---:|
|Fallback|bellsteel-charm-legendary; mochi; level 6; chapter 3|0 → 302 / 500|60.40pp|
|V5|rainlace-relic-legendary; mochi; level 6; chapter 1|89 → 328 / 500|47.80pp|

Bare-item effects and the [fourth-slot comparison](EQUIPMENT-REVIEW.md) answer different questions. Neither can replace the other. Adding one item to an otherwise bare team can cross survival thresholds; a small displayed power share does not bound that win-rate effect. These package comparisons do not isolate a particular new skill or helper as the cause.

Future TRAIN work should isolate one failing interaction while retaining the fixture floors, losses and negative pairs. A changed candidate requires a newly registered 30001–30500 block.
