#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CAT="${1:?Usage: check-idle.sh mochi|clover|soot}"
case "$CAT" in mochi|clover|soot) ;; *) exit 2 ;; esac
INPUT="$ROOT/apps/web/public/units/$CAT/designer/idle.webm"
OUT="$ROOT/work/v9/CXV/$CAT"
mkdir -p "$OUT"
# Start halfway through a cycle so the ten-second clip actually contains the seam.
DURATION="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$INPUT")"
OFFSET="$(awk -v n="$DURATION" 'BEGIN{print n/2}')"
ffmpeg -hide_banner -loglevel warning -y -stream_loop -1 -c:v libvpx-vp9 -i "$INPUT" \
  -filter_complex "[0:v]trim=start=$OFFSET,setpts=PTS-STARTPTS,scale=560:600:force_original_aspect_ratio=decrease:force_divisible_by=2,split[a][b];color=c=0x808080:s=600x640:r=30[grey];color=c=0xf4f0e8:s=600x640:r=30[light];[grey][a]overlay=(W-w)/2:H-h-20:shortest=1[g];[light][b]overlay=(W-w)/2:H-h-20:shortest=1[l];[g][l]hstack[out]" \
  -map '[out]' -t 10 -an -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart "$OUT/check-10s.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$OUT/check-10s.mp4" \
  -vf 'select=eq(n\,0)+eq(n\,148)+eq(n\,151),scale=720:-1,tile=1x3' -frames:v 1 "$OUT/check-sheet.jpg"
printf 'Check clip (grey/light, loop seam inside): %s\n' "$OUT/check-10s.mp4"
