# L1 Reference Video Frame-by-Frame Study
- Source: `/Users/bao/Downloads/1794839260117_4283331764508693014_g7637148592472214939.mp4` (52.4s, 30fps, portrait 480x848)
- Target: Live2D Cubism Viewer session of cat healer maiden; quality benchmark for rigging, motion lag & secondary physics.
- Contact Sheets: `reports/v5/AG1/ref/` (6 sheets: `ref_overview_1fps.jpg`, `ref_win1_body_sway.jpg`, `ref_win2_scrubbing.jpg`, `ref_win3_head_turn.jpg`, `ref_win4_blink_wink.jpg`, `ref_panel_params.jpg`).

## Planner Notes Verification & Corrections
1. Confirmed: Single cat healer rig; viewer toolbar shows `Fading Time(ms): 1000`; scale scrubs from 23% to 46% and 53%.
2. Correction: Parameter control utilizes an interactive 2D XY boundary box for Angle X/Y, not isolated 1D sliders.
3. Correction: Expressions feature independent asymmetric winking with localized cheek squashing and ear tip drooping.

## Readable Viewer Panel Parameters
- Parameter Groups: ears, Folder 1, hair, leaf, dress, miniskirt, body (X, Y, Z), eyebounce, eyehighlight, ribbon, tea tool, teapot, tea, bag no, Angle (X, Y, Z via 2D pad), EyeOpen (L, R), EyeSmile, Mouth Open, Mouth Form, Form parameters.

## Window 1: Body Sway (~0-12s, Zoom 23%)
| Part / Layer | Order | Lag (frames @ 10fps / ms) | Overshoot (%) | Settle Time | Numeric Observation |
|---|---|---|---|---|---|
| Torso / Spine | 1 (Initiator) | 0 frames / 0 ms | 0% | 4 frames (400 ms) | Lateral lean delta ~12 px |
| Skirt & Apron | 2 (Follower) | 2 frames / 200 ms | 12% | 7 frames (700 ms) | Damped spring oscillation |
| Leaf Collar | 3 (Follower) | 2-3 frames / 250 ms | 8% | 6 frames (600 ms) | Multi-petal offset lag |
| Bushy Tail | 4 (Trailer) | 4-5 frames / 450 ms | 22% | 9 frames (900 ms) | Trailing swing with 22% overshoot |
| Teapot Arm | 5 (Stabilizer) | 1 frame / 100 ms | 4% | 4 frames (400 ms) | Hand stays anchored, kettle tilts 3° |

## Window 2: Hair / Leaf / Ribbon Scrubbing (~12-24s, Zoom 23%)
| Part / Layer | Order | Lag (frames @ 10fps / ms) | Overshoot (%) | Settle Time | Numeric Observation |
|---|---|---|---|---|---|
| Slider Input | 1 (Driver) | 0 frames / 0 ms | 0% | - | Manual scrubbing across axis |
| Temple Hair Tufts | 2 (First response) | 1 frame / 100 ms | 18% | 5 frames (500 ms) | Light mass spring response |
| Leaf Petals | 3 (Secondary) | 2 frames / 200 ms | 15% | 6 frames (600 ms) | Slices slip past each other |
| Chest Ribbon Tails | 4 (Tertiary) | 2-3 frames / 250 ms | 25% | 7 frames (700 ms) | Wave propagation along ribbon length |
| Belt Pouch | 5 (Quaternary) | 3 frames / 300 ms | 14% | 6 frames (600 ms) | Pendulum hang from belt pin |

## Window 3: Head Turn & Parallax (~25-31s, Zoom 46%-53%)
| Part / Layer | Order | Lag (frames @ 10fps / ms) | Overshoot (%) | Settle Time | Numeric Observation |
|---|---|---|---|---|---|
| Head Angle X/Y | 1 (Driver) | 0 frames / 0 ms | 0% | 5 frames (500 ms) | Driven by 2D XY control pad |
| Face Center (Muzzle/Nose) | 2 (Parallax shift) | 0 frames / 0 ms | 0% | - | Moves 20% head width laterally |
| Far Cheek & Ear | 3 (Foreshortening) | 0 frames / 0 ms | 0% | - | Compresses 38% in apparent width |
| Forehead Cowlick Hair | 4 (Secondary) | 2 frames / 200 ms | 16% | 6 frames (600 ms) | Spring rebound across cranial crown |
| Collar Leaves (Under chin) | 5 (Occlusion) | 2 frames / 200 ms | 10% | 5 frames (500 ms) | Depth sorting maintains chin over leaf |

## Window 4: Blink / Wink & Expression (~32-44s, Zoom 46%)
| Part / Layer | Order | Lag (frames @ 10fps / ms) | Overshoot (%) | Settle Time | Numeric Observation |
|---|---|---|---|---|---|
| Eye Eyelid Closure | 1 (Fast clamp) | 0 frames / 0 ms | 0% | 2 frames (200 ms) | Asymmetric wink closure in 2 frames |
| Cheek Puff / Squash | 2 (Coupled) | 0-1 frame / 50 ms | 10% | 3 frames (300 ms) | Upward push of 8 px under closed eye |
| Ear Tip Droop | 3 (Sympathetic) | 1 frame / 100 ms | 12% | 4 frames (400 ms) | Ear folds downward 14% on wink side |
| Eye Re-open Phase | 4 (Ease out) | 0 frames / 0 ms | 5% | 3-4 frames (350 ms)| Slower ease-out curve on reopen |
| Eye Highlight Bounce | 5 (Post-open) | 2 frames / 200 ms | 15% | 2 frames (200 ms) | Highlight drops to 40% size, bounces 15% |

## Head Turn Face Deformation Breakdown
1. Parallax Depth Ordering: Features nearer camera (near eye, muzzle) displace 18-22% of total head width, while rear ear displaces only 6%, generating genuine 3D perspective without 3D meshes.
2. Silhouette Foreshortening: Far cheek compresses by 38% at peak yaw, and far ear narrows by 15% in apparent width.
3. Specular Lighting Invariance: Eye specular highlights do not rotate rigidly with eye texture, preserving consistent ambient light orientation.

## Engine Implementation Guidelines for CXV & AG2
1. Secondary Spring Model: Set stiffness `k=0.7`, damping `d=0.82` for hair/ribbon; skirt/tail needs heavier damping (`k=0.45`, `d=0.70`, 4-5 frame lag).
2. Idle Modulation: Apply breathing oscillation (1-2% scale Y, 0.5 Hz) and random eye blink intervals (2.5 - 5.0 s).
3. Layer Partitioning: Decompose characters into >= 25 discrete visual layers (head, muzzle, ears, 3x hair tufts, 4x collar leaves, ribbons, torso, skirt, pouch, tail segments).
