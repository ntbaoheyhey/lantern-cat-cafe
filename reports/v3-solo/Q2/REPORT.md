# Q2 voice timing and mix verification

Candidate21 passes all59 SOLO gates: complete180.201s battle at4.661461 contours/min and120.203s boss at3.494089/min. Both are inside3.25–6.75/min. Final B full units/types and435/435 browser cases pass. Q2 is closed.

The old B build measured48/75 interrupted battle starts and16/35 boss starts before A voice-hold commit2bb54cf9c. Current A18ea6e6e8 plays130/130 scheduled cues without overlap. Actual candidate21 playback on A's battle and B's engine has62/62 required ultimate phases,17 skill starts and zero interruptions across the three fixtures at x1/x2/x3; parity passes9/9. Timing therefore requires no additional A change.

The accepted source edits so far are five Soot/Panko takes with slower spoken phrasing and, on releases, a partial dry spoken core under the character filters. Every edited take retains1.0 recognizer word accuracy. The Mochi edit was reverted when its identity became too close to Soot. Current callout identities pass12/12; all212 file levels pass. Local WORLD formant processing was evaluated but is not used by these five selected takes. Sources and licensed processing are recorded in VOICE-CALLOUTS-PRODUCTION.json and audio/LICENSES.json.

Music keeps its normal8dB duck and gains a temporary low shelf during ordinary battle speech. Boss uses its original processing path after candidates19/20 produced one contour above the band. The upper score remains present; user bus preferences are unchanged. Output headroom is2.25dB. Raw output is recorded from the actual browser; no waveform normalization, synthetic playback or analyser change is used for acceptance.

## Ten-line evidence critique

1. Current A timing protects complete charge and release lines at all three speeds.
2. The voice-only diagnostic confirmed that the original battle failure involved masking.
3. Reducing the whole score lost loudness without solving the voice-density deficit.
4. A speech shelf plus voice presence recovered audible contours in the full battle capture.
5. Slower Soot and Panko releases preserve every recognized word in those takes.
6. The rejected Mochi edit demonstrates why clarity and character identity require separate checks.
7. Final candidate21 battle reaches4.661 contours/min with no silence and a continuous music bed.
8. Final candidate21 boss reaches3.494 contours/min; rejected candidates19/20 remain recorded at6.988/min.
9. Battle/boss tick density and broad-band layering still miss S5; Q2 does not close that card.
10. The full roster still has18 ultimate lines and3 skill lines below their per-line recognition threshold; Q5 remains open.

Self-score:8/10 for Q2 timing and audible voice contours, supported by59/59 measured gates. Broader mix and recognition remain7/10 until Q5. B final2538 web unit cases and all workspace types pass; current browser regression passes435/435. Earlier trial logs and failed candidates are retained rather than overwritten.
