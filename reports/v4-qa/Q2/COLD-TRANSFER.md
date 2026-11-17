# Independent cold transfer evidence
Source `b1e4398a8844fa51d2784760e92ed24528d13d2b`; 1440×900 fresh Chromium; production preview6200.

Battle-entry checkpoint transferred **29,653,929 bytes** (29.65 MB), against the 8 MB budget; 27/27 battle images were ready and no response was listed in flight.
Own fresh Chromium context. CDP encodedDataLength including protocol overhead; collected after first visible battle and image-readiness query. This is a battle-entry checkpoint, not an exact timestamp of scene-ready. Local Vite preview transfer characteristics may differ from hosted compression.
All timings are shared-machine, indicative; this is not an FPS/audio gate.

| Request path | Encoded bytes |
|---|---:|
| `/units/yarn-giant/rig-depth.png` | 2,823,543 |
| `/units/panko/rig-depth.png` | 1,570,161 |
| `/units/binding-thread/rig-depth.png` | 1,156,592 |
| `/assets/clover-Cgil4ddk.png` | 971,714 |
| `/assets/soot-D9EdxT-u.png` | 947,984 |
| `/assets/panko-0-CWKYqwim.webp` | 862,002 |
| `/assets/mochi-BTMx_wwY.png` | 858,722 |
| `/assets/cinnamon-0-DIPZVf-3.webp` | 826,996 |
| `/assets/marigold-0-N12vppiw.webp` | 803,648 |
| `/assets/brioche-0-Cle3gWYa.webp` | 792,822 |

Raw: `Q1/q1-cold-1/results.json`. Initial build omitted metadata postbuild; no metadata request is included in this measurement.
Large visible and nonvisible character/rig images dominate the top requests. Defer nonessential loading and compare the same checkpoint after the change.

## Current-target recheck
Source `4b4c41114ea9795820aa9204023e0954a9810f84`; fresh1440×900. Battle entry and the separately observed fully loaded battle-image checkpoint both transfer **29,544,948bytes** with no responses in flight. Change versus prior checkpoint:−108,981bytes (about0.37%); budget8,000,000bytes still FAIL.
Every contained battle img had complete=true and naturalWidth>0 at the later observation. This defines image readiness; it is not an animation/FPS gate. Evidence: `cold-transfer-current-2.json`; full path remains in `q2-current-build-2/results.json`.

| Request path | Encoded bytes |
|---|---:|
| `/units/yarn-giant/rig-depth.png` | 2,823,543 |
| `/units/panko/rig-depth.png` | 1,570,161 |
| `/units/binding-thread/rig-depth.png` | 1,156,592 |
| `/assets/clover-Cgil4ddk.png` | 971,714 |
| `/assets/soot-D9EdxT-u.png` | 947,984 |
| `/assets/panko-0-CWKYqwim.webp` | 862,002 |
| `/assets/mochi-BTMx_wwY.png` | 858,722 |
| `/assets/cinnamon-0-DIPZVf-3.webp` | 826,996 |
| `/assets/marigold-0-N12vppiw.webp` | 803,648 |
| `/assets/brioche-0-Cle3gWYa.webp` | 792,822 |
