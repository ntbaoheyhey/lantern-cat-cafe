# Recorded preparation

[Play the preparation film](../../../reports/v4-ship/S10/preparation-1.mp4). It uses the actual shipping Vite build, local API/Anvil, original game audio and seven complete journey steps. It is152.833333seconds and9,315,673bytes; every transaction action is retained. Battle cuts are labeled and keep normal playback speed.

[English captions](preparation-1.en.srt) are burned into a separate lower rail. [Vietnamese SRT](preparation-1.vi.srt) uses identical timing. All10retained voice starts are mapped to original callout text;47cues also describe the journey and meaningful sound. Human listening and readable-caption review remain open.

[Verification](../../../reports/v4-ship/S10/film-verify-1.json) preserves both successes and failures. The edited mix measures−17.27LUFS,−1.18dBTP and4.8LRA; the latter fails the≥5gate. No normalization, replacement music or narration was applied. The public Fuji receipt is readable in the normal in-app browser, but its actual video is still absent. R2/FINAL remain scheduled; this is not a completed submission.

Reproduce with the matching production build/API fixture running on5998/5997/8546:

```sh
node tools/v4ship-lab/film/capture.mjs NEW_CAPTURE_NUMBER
python3 tools/v4ship-lab/film/edit.py NEW_CAPTURE_NUMBER NEW_EDIT_NUMBER
```

Use unused numeric attempts. The tools preserve previous evidence and respect STOP-V4SHIP. Encoding uses the explicit libass-capable/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg binary. Original frames/audio, the cut list, frame manifest, caption ASS, original cut mix and high-quality master are in the ignored work/v4ship-prep folders. The tracked frame-integrity report anchors selected original frames. Clones contain the small delivery film and evidence; local raw intermediates are not pushed.

Edit1's first report records a parser failure after successful encoding. The trailing-progress JSON parser is now corrected; the separately recorded verification checks the same unchanged film, retaining the failed report.
