# Opaque image transport verification
REFERENCE: browser-pixels.json; ../../../docs/cardrpg3b/build.json; tools/cardrpg-big2/pack-images.py

All five opaque1024×1024 PNG-to-WebP textures decode to identical Chromium canvas RGBA: zero differing channels and zero maximum channel delta. The12 transparent portraits keep their PNG bytes. This corrects the earlier rejected transparent-WebP candidate, whose failure remains in `../lossless-pack`.

Pinned HTML SHA256 `3b82f45c0669aa0ebfc6220277290258d8943febe1c5692b8f865fe3b2968ec4`,22,029,297bytes. This pixel result does not establish opening speed. Later evidence-complete HTML requires its own verification.
