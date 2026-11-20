"""Temp (placeholder) narration with Kokoro-82M (Apache-2.0), one file per VO line.
Only for timing review; the user's own recording replaces it (see place_vo.py).

    /home/user/kvenv/bin/python temp_vo.py    -> vo/temp/vo01.wav ...
"""
import os, numpy as np, soundfile as sf
from kokoro import KPipeline
from timeline import VO

VOICE = os.environ.get("VO_VOICE", "bm_george")
os.makedirs("vo/temp", exist_ok=True)
pipe = KPipeline(lang_code="b" if VOICE.startswith("b") else "a")


def say(text, speed):
    parts = [a for _, _, a in pipe(text, voice=VOICE, speed=speed)]
    return np.concatenate([np.asarray(p) for p in parts])


for v in VO:
    speed = 0.9 if v["id"] in ("vo01", "vo02", "vo12", "vo11") else 0.97
    for _ in range(6):
        audio = say(v["text"], speed)
        # trim leading/trailing silence
        idx = np.where(np.abs(audio) > 0.01)[0]
        audio = audio[max(0, idx[0] - 600): idx[-1] + 2400]
        dur = len(audio) / 24000
        if dur <= v["max"] or speed >= 1.3:
            break
        speed = round(speed * min(1.15, dur / v["max"] + 0.02), 3)
    sf.write(f"vo/temp/{v['id']}.wav", audio, 24000)
    print(f"{v['id']} speed={speed} dur={dur:.2f}/{v['max']}  {'OVER' if dur > v['max'] else 'ok'}")
