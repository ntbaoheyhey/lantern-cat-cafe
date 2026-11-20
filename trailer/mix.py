"""Mix the trailer soundtrack.

    python3 mix.py                       # music+SFX only            -> audio/mix_novo.wav
    python3 mix.py --vo audio/vo_temp.wav  # + temp voice (ducked)  -> audio/mix_vo.wav
    python3 mix.py --vo audio/vo_final.wav --out audio/mix_final.wav

Music is ducked under the voice automatically (envelope follower on the VO
track), the bar-39 stop-down is gated to true silence, and the master is
loudness-normalised to -14 LUFS / -1 dBTP (YouTube / social delivery).
"""
import argparse, subprocess, json, numpy as np
from timeline import LENGTH, BAR, BEAT

SR = 48000
STEM_GAIN = {"pad": -2.0, "lead": 1.0, "hits": -1.0, "perc": -1.0, "bass": -0.5, "rhythm": -1.5}


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def fit(x, n):
    if len(x) >= n:
        return x[:n]
    return np.vstack([x, np.zeros((n - len(x), 2))])


def follower(x, attack, release):
    """Peak envelope follower (mono), seconds."""
    a = np.exp(-1 / (attack * SR)); r = np.exp(-1 / (release * SR))
    lvl = np.abs(x).max(axis=1)
    # block-wise for speed (1 ms blocks)
    blk = SR // 1000
    nb = len(lvl) // blk
    pk = lvl[:nb * blk].reshape(nb, blk).max(axis=1)
    env = np.zeros(nb); e = 0.0
    a_b, r_b = a ** blk, r ** blk
    for i, v in enumerate(pk):
        e = a_b * e + (1 - a_b) * v if v > e else r_b * e + (1 - r_b) * v
        env[i] = e
    return np.repeat(env, blk)[:len(x)] if nb else np.zeros(len(x))


def gate_window(n, t0, t1, fade=0.03):
    g = np.ones(n)
    a, b = int(t0 * SR), int(t1 * SR)
    f = int(fade * SR)
    g[a:b] = 0
    g[max(0, a - f):a] = np.linspace(1, 0, min(f, a))
    g[b:b + f] = np.linspace(0, 1, len(g[b:b + f]))
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vo")
    ap.add_argument("--out")
    ap.add_argument("--duck", type=float, default=-8.0, help="music gain under voice, dB")
    args = ap.parse_args()
    n = int((LENGTH + 2.0) * SR)

    music = np.zeros((n, 2))
    for stem, g in STEM_GAIN.items():
        x = fit(load(f"audio/stems/{stem}.wav"), n) * 10 ** (g / 20)
        if stem != "lead":                      # bar 39 = true silence (celesta lives in 'lead')
            x *= gate_window(n, 39 * BAR, 39 * BAR + 3 * BEAT + 0.5 * BEAT)[:, None]
        music += x
    sfx = fit(load("audio/sfx.wav"), n)
    music *= 0.55
    sfx *= 0.5

    vo = np.zeros((n, 2))
    if args.vo:
        vo = fit(load(args.vo), n)
        env = follower(vo, 0.06, 0.45)
        on = np.clip(env / 0.05, 0, 1)                 # 0..1 'voice present'
        duck = 10 ** (args.duck * on / 20)
        music *= duck[:, None]
        sfx *= (10 ** (-3 * on / 20))[:, None]
        vo *= 1.0

    mix = music + sfx + vo
    # gentle bus glue: soft knee saturation then normalise later
    peak = np.abs(mix).max()
    mix = np.tanh(mix / peak * 1.4) / np.tanh(1.4) * 0.9
    tail = int(1.5 * SR)                               # fade the last 1.5 s
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 2

    out = args.out or ("audio/mix_vo.wav" if args.vo else "audio/mix_novo.wav")
    tmp = out + ".f32"
    mix.astype(np.float32).tofile(tmp)
    # two-pass loudness normalisation
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", tmp,
                           "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    j = json.loads(meas[meas.rfind("{"):meas.rfind("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.0:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", tmp,
                    "-af", af + ",aresample=48000", "-t", f"{LENGTH + 0.5}", "-c:a", "pcm_s24le", out], check=True)
    import os; os.remove(tmp)
    print(out, "input LUFS", j["input_i"], "LRA", j["input_lra"])


if __name__ == "__main__":
    main()
