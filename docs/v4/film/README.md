# Recorded preparation

[Play preparation film 2](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S10/preparation-2.mp4). It uses the actual shipping Vite build, local API/Anvil, recorded game audio and seven complete journey steps. It is 164.833333 seconds and 9,343,307 bytes; every transaction action is retained. Battle cuts are labeled and keep normal playback speed.

[English captions](preparation-2.en.srt) are burned into a separate lower rail. [Vietnamese SRT](preparation-2.vi.srt) uses identical timing. All 13 retained voice starts are mapped to original callout text; 52 cues also describe the journey and meaningful sound. Human listening and readable-caption review remain open.

[Render measurements](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S10/film-edit-2.json) and [source/caption verification](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S10/film-verify-2.json) check the complete delivery. The embedded audio measures −17.87 LUFS, −2.22 dBTP and 5.2 LU LRA, passing the unchanged film audio gates. The edit retains twelve additional seconds of actual boss footage and applies constant −0.8 dB film attenuation. No runtime audio change, normalization, replacement music or narration was applied. The public Fuji receipt is readable in the internal browser, but its actual video is still absent. R2/FINAL remain scheduled; this is not a completed submission.

The [original film](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S10/preparation-1.mp4) and its [failed LRA verification](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S10/film-verify-1.json) remain available: 152.833333 seconds, 9,315,673 bytes, −17.27 LUFS, −1.18 dBTP and 4.8 LU LRA. The [measured comparison](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/S11/film-audio-comparison-1.json) preserves all three failed candidate measurements before the separate headroom treatment.

Capture with the matching production build/API fixture running on 5998/5997/8546:

```sh
node tools/v4ship-lab/film/capture.mjs NEW_CAPTURE_NUMBER
python3 tools/v4ship-lab/film/edit.py NEW_CAPTURE_NUMBER NEW_EDIT_NUMBER
```

Use unused numeric attempts. To reproduce film 2 from preserved capture 2, pass `--audio-plan reports/v4-ship/S11/film-audio-headroom-1.json` to `edit.py 2 NEW_EDIT_NUMBER`. This plan is bound to the original source hashes; a new capture needs its own measurements. See [the research and decision](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/v4-ship/LEARN/S11-film-audio.md).

The tools preserve previous evidence and respect STOP-V4SHIP. Encoding uses the explicit libass-capable `/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg` binary. Original frames/audio, the cut list, frame manifest, caption ASS, cut mix and high-quality master are in the ignored `work/v4ship-prep` folders. The tracked frame-integrity reports anchor selected original frames. Clones contain the small delivery films and evidence; local raw intermediates are not pushed.

Edit 1's first report records a parser failure after successful encoding. The trailing-progress JSON parser is corrected; the separately recorded verification checks the same unchanged film, retaining the failed report.
