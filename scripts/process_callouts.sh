#!/bin/bash
cd /Users/bao/th-v5-ag4/apps/web/public/audio/
mkdir -p v5/voice/
for f in callout-*.webm; do
    echo "Processing $f"
    ffmpeg -i "$f" -ss 0.35 -acodec libopus -b:a 64k "v5/voice/${f%.webm}.opus"
done
