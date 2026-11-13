#!/usr/bin/env python3
"""Pitch-preserving menu arrangements from the licensed original score."""
import argparse, datetime, hashlib, json, subprocess
from pathlib import Path
import numpy as np
from analyse import analyse_file

ROOT = Path(__file__).resolve().parents[2]
RATE = 44100

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def ff(args, data=None):
    return subprocess.check_output(['ffmpeg', '-v', 'error', '-y', *args], input=data)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--publish', action='store_true')
    parser.add_argument('--home-tempo', type=float, default=1.10)
    parser.add_argument('--forge-tempo', type=float, default=.84)
    args = parser.parse_args()
    source = ROOT / 'assets/audio-sources/home.ogg'
    manifest_path = ROOT / 'apps/web/public/audio/manifest.json'
    licenses_path = ROOT / 'apps/web/public/audio/LICENSES.json'
    manifest = json.loads(manifest_path.read_text())
    licenses = json.loads(licenses_path.read_text())
    original = next(r for r in licenses['files'] if r['path'] == 'apps/web/public/audio/home.webm')
    provenance = {k: original[k] for k in ['sourceUrl', 'licenseUrl', 'license', 'author']}
    provenance.update(date=datetime.datetime.now(datetime.timezone.utc).date().isoformat(), sourceFiles=[{'path': str(source.relative_to(ROOT)), 'sha256': sha(source)}], tool='ffmpeg atempo and NumPy loop crossfade', script={'path': str(Path(__file__).relative_to(ROOT)), 'sha256': sha(Path(__file__))})
    raw = ff(['-ss', '8', '-i', str(source), '-t', '33', '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1'])
    pcm = np.frombuffer(raw, dtype='<f4').copy()
    fade = RATE
    t = np.arange(fade)/fade
    pcm[-fade:] = pcm[-fade:]*(1-t)+pcm[:fade]*t
    pcm = pcm[fade:]
    folder = ROOT / ('assets/audio-sources/b2/music' if args.publish else 'tmp/q5-menu-tempo')
    folder.mkdir(parents=True, exist_ok=True)
    results = []
    for scene, tempo in [('home', args.home_tempo), ('forge', args.forge_tempo)]:
        if not .7 <= tempo <= 1.2:
            raise ValueError('Keep the arrangement within musical tempo limits')
        path = folder / f'menu-{scene}-tempo-{tempo}.flac'
        ff(['-f', 'f32le', '-ar', str(RATE), '-ac', '1', '-i', 'pipe:0', '-af', f'atempo={tempo},loudnorm=I=-18:TP=-4:LRA=11', '-ar', str(RATE), str(path)], pcm.tobytes())
        decoded = ff(['-i', str(path), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1'])
        duration = len(decoded)/4/RATE
        record = {**provenance, 'processing': f'Original licensed menu theme, 8–41s phrase, one-second wrap crossfade, pitch-preserving tempo {tempo}, -18 LUFS, -4 dBTP ceiling. No reference media.', 'tempo': tempo, 'path': str(path.relative_to(ROOT)), 'file': path.name, 'sha256': sha(path)}
        metrics = analyse_file(path, duration=duration)
        results.append({'scene': scene, 'source': record, 'metrics': metrics})
        print(json.dumps({'scene': scene, 'tempo': tempo, 'ticks': metrics['tickTransientsPerSecond'], 'onsets': metrics['onsetsPerSecond'], 'seconds': duration}), flush=True)
        if not args.publish:
            continue
        licenses['files'] = [r for r in licenses['files'] if r['path'] != record['path']]+[record]
        pack = 'menu-'+scene
        for ext, codec in [('webm', 'libopus'), ('mp3', 'libmp3lame')]:
            target = ROOT / f'apps/web/public/audio/{pack}.{ext}'
            ff(['-i', str(path), '-c:a', codec, '-b:a', '96k', str(target)])
            row = {**record, 'path': str(target.relative_to(ROOT)), 'file': target.name, 'sha256': sha(target), 'sourceFiles': [{'path': record['path'], 'sha256': record['sha256']}]}
            licenses['files'] = [r for r in licenses['files'] if r['path'] != row['path']]+[row]
        manifest['packs'][pack] = {ext: f'/audio/{pack}.{ext}' for ext in ['webm', 'mp3']}
        manifest['cues']['music.'+scene] = [{'pack': pack, 'start': 0, 'duration': duration, 'bus': 'music', 'loop': True}]
    label = 'publication' if args.publish else 'probes'
    report = ROOT / 'reports/v3-shell/b2/q5' / f'menu-tempo-{args.home_tempo}-{args.forge_tempo}-{label}.json'
    report.write_text(json.dumps({'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'method': 'Source-only music arrangement probes; not full browser acceptance.', 'rows': results}, indent=2)+'\n')
    if args.publish:
        manifest_path.write_text(json.dumps(manifest, indent=2)+'\n')
        licenses_path.write_text(json.dumps(licenses, indent=2)+'\n')

if __name__ == '__main__':
    main()
