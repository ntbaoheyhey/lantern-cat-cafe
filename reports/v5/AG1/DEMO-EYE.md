# 30-Second Demo Script (From the Judge's Eye)
- Target: First-time hackathon/competition judge evaluating Taskbar Hero.
- Goal: Deliver maximum perceived polish, visceral game feel, and flawless responsive legibility within 30 seconds.
- Test Viewports: Desktop 1280x720 (16:9 standard window) and Mobile 390x844 (iPhone 14 / portrait webview).

---

## Timeline Breakdown (Second-by-Second)

```
00s             05s                 12s                     20s             26s         30s
[ Guest Start ] -> [ Hero Presence ] -> [ Battle Trigger & Skill ] -> [ Victory ] -> [ Receipt & Loop ]
```

### 1. 00s – 05s: Instant Gratification & Hero Polish (First Impression)
- **What the Judge Sees**:
  - Zero-barrier onboarding: "Play as Guest" prominent CTA button. No mandatory signup or wallet prompt blocks the viewport.
  - Character enters with smooth idle motion: 0.5 Hz breathing cycle (1-2% Y scale), subtle hair/leaf sway with secondary lag, periodic eye blink at ~3.5s with specular highlight micro-bounce.
  - Clean UI layout: crisp 16px/18px high-contrast typography, zero clipping or horizontal scrollbars at 390x844.
- **What the Judge Hears**:
  - Button tap: Clean 30ms wooden click (1.8 kHz, $-20\text{ dBFS}$), immediate positive tactile feedback.
  - Soft ambient tavern/adventure BGM bed ($-18\text{ LUFS}$).

### 2. 05s – 12s: Battle Engagement & Responsive Transition
- **What the Judge Sees**:
  - Judge clicks "Battle / Adventure" -> Instant camera punch-in or seamless stage transition without black screen or loader stall (< 100 ms).
  - Opponent unit faces hero across the arena. HP bars are boldly legible with distinct color coding (Green #2ECC71 vs Red #E74C3C).
  - Combat timer / Turn tracker clearly visible at top of viewport.
- **What the Judge Hears**:
  - Stage transition whoosh (250 ms, automated bandpass sweep 400 Hz -> 4 kHz).

### 3. 12s – 20s: The "Showstopper" Skill Climax (Visceral VFX & Combat Feel)
- **What the Judge Sees**:
  - Hero triggers signature skill (Heal / Holy Aura or Melee Arc):
    1. **Pre-cast (100 ms)**: Ground magic circle blooms ($512^2$, counter-rotating rings), soft green/gold glow.
    2. **Impact / Climax (Frame 0)**: Full visual hit!
       - **Hit-Stop (50 ms / 3 frames)**: Character sprite freezes in peak pose while particle effects continue streaming at 60 fps.
       - **Hit Flash (33 ms / 2 frames)**: Target flashes solid unlit white (`#FFFFFF`).
       - **Directional Camera Shake (180 ms)**: Instant 8 px impulse along strike normal, decaying smoothly with $e^{-kt}$. UI elements remain rock-steady.
       - **VFX Layers**: 3-tier slash arc (crisp 2px white core, gradient energy body, 12 flying sparks) or rising vertical light pillar with floating spores.
- **What the Judge Hears**:
  - Perfectly synchronized audio transient at $0\text{ ms}$: sharp high-end snap ($-4\text{ dBFS}$), followed 10 ms later by a deep 60 Hz sub-thud ($-9\text{ dBFS}$). Background music dynamically ducks by $-3\text{ dB}$ to give the skill massive cinematic weight.

### 4. 20s – 26s: Decisive Victory & Tactile Reward
- **What the Judge Sees**:
  - Opponent dissolves in defeat particles; "VICTORY" banner drops with spring overshoot easing.
  - Gold / XP numbers count up rapidly over 800 ms with particle bursts.
  - Victory modal appears centered: card reward details are immediately legible with clean badges.
- **What the Judge Hears**:
  - Victory chime: Resonant major triad chord (C5-E5-G5, $-16\text{ dBFS}$) over 1.2s.
  - Coin pickup tick-ticks (rapid 20 ms blips).

### 5. 26s – 30s: Session Receipt & Replay Hook
- **What the Judge Sees**:
  - Final battle receipt summary displays cleanly: turn count, damage dealt, loot earned, transaction/state hash badge.
  - Prominent "Next Battle" button pulsing gently to invite immediate replay.
  - Judge leaves with the impression of an ultra-responsive, visually rich, and acoustically satisfying native-quality game.

---

## Judge's Evaluation Checklist (Score Drivers)

| Evaluation Pillar | What Secures High Score (9-10/10) | Red Flag Fatal Flaw (Avoid at all costs) |
|---|---|---|
| **P1: Responsiveness** | UI actions execute within 16-33 ms; 60 fps steady frame rate; zero GC freezes | Button clicks lag > 100 ms; hitching during skill animation |
| **P2: Combat Weight** | Hit-stop (33-50 ms) + directional camera shake + hit flash + sub-bass audio punch | "Cardboard" combat: animations play without impact pause or shake |
| **P3: Visual Hierarchy** | Clear depth separation: background dim -> character midground -> VFX additive -> UI unshakeable foreground | VFX or camera shake obscures health bars or text; UI shakes with screen |
| **P4: Mobile Adaptability** | Perfect layout on 390x844: thumb-friendly touch targets (min 44x44 px), zero text clipping | Text truncated or buttons overlapping on small phone screens |
| **P5: Audio-Visual Sync** | Transient sound peak aligns to the exact same frame as visual hit (0 ms error) | Sound triggers noticeably before or after visual hit |
