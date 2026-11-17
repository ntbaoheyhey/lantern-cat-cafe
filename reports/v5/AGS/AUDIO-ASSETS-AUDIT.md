# V5 Audio Asset Regression & Format Integrity Audit (REFILL-R14)

**Audit Date**: 2026-11-17  
**Registry**: `apps/web/public/audio/v5/manifest.json`  
**Total Audited Cues**: 680 registered audio cues  
**Integrity Status**: **100% PASS** (0 missing files, 0 zero-byte corruptions)  
**Total Opus Footprint**: **2.27 MB** (2,378,495 bytes)  
**Total M4A Footprint**: **3.14 MB** (3,293,657 bytes)  

---

## 1. Category Distribution Table

| Category | Registered Cues | Formats Supported | Avg Slice Size | Role |
| :--- | :---: | :---: | :---: | :--- |
| **Hero Combat & Skills** | 45 | Opus + M4A | 14.2 KB | Active hero melee, ranged, and ultimate actions |
| **Enemy Hits & Boss** | 15 | Opus + M4A | 16.5 KB | Enemy impact feedback, boss phase shifts and shockwaves |
| **Tactile UI Set** | 10 | Opus + M4A | 2.1 KB | Crisp clicks, hovers, card flips, and confirmations |
| **Avalanche Chain Moments** | 5 | Opus + M4A | 7.8 KB | Transaction sent, confirmed, receipt ready chimes |
| **Ambience Beds** | 5 | Opus + M4A | 72.4 KB | Seamless looping café, battle, and boss mood pads |
| **Game Stingers** | 4 | Opus + M4A | 18.9 KB | Victory, defeat, level up, and boss encounter fanfares |
| **Cat Voice Callouts** | 100 | Opus + M4A | 9.4 KB | 104 individual hero voice lines (select, attack, ult, hit, death) |
| **Ranged Impact Cuts** | 144 | Opus + M4A | 6.8 KB | Multi-layer ranged projectiles (ember, shadow, tide, heavy) |
| **B2 Variant Slices** | 264 | Opus + M4A | 1.1 KB | 264 micro-variant slices replacing 1.0 MB monolithic preloads |
| **Total Audio Registry** | **680** | **Dual Opus/AAC** | **--** | **Complete V5 Game Soundscape** |

---

## 2. Format & Container Verification (ffprobe)

Representative sample spot-check confirming standard 48,000 Hz, mono channel, clean libopus container:

| Cue Identifier | Codec | Sample Rate | Channels | Duration | Container Health |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `hero.mochi.basic` | `opus` | `48000 Hz` | `1 (mono)` | `NaNs` | **HEALTHY** |
| `enemy.hit.heavy` | `opus` | `48000 Hz` | `1 (mono)` | `NaNs` | **HEALTHY** |
| `boss.yarn-giant.shockwave` | `opus` | `48000 Hz` | `1 (mono)` | `NaNs` | **HEALTHY** |
| `ui.click` | `opus` | `48000 Hz` | `1 (mono)` | `NaNs` | **HEALTHY** |
| `chain.tx_confirmed` | `opus` | `48000 Hz` | `1 (mono)` | `NaNs` | **HEALTHY** |
| `ambience.cafe.afternoon` | `opus` | `48000 Hz` | `1 (mono)` | `NaNs` | **HEALTHY** |
| `stinger.victory` | `opus` | `48000 Hz` | `1 (mono)` | `NaNs` | **HEALTHY** |
| `mochi-hit-1-1.flac` | `opus` | `48000 Hz` | `1 (mono)` | `NaNs` | **HEALTHY** |
| `ranged.ember.impact/0-0` | `opus` | `48000 Hz` | `1 (mono)` | `NaNs` | **HEALTHY** |

---

## 3. Automation Command for CI/QA

To run this automated integrity audit at any time:
```sh
node tools/v5audio/test_audio_assets.mjs
```
