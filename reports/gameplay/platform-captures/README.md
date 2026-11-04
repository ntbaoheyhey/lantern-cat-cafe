# Native screenshot and font follow-up

`darwin-g1-label` and `linux-g1-label` hold the final Landing and pre-art class captures. The two art folders supply only the class-palette baselines; their Landing images predate the font/label follow-up and remain diagnostic. All PNGs are unedited browser captures. The active test baselines and SHA-256 manifests are under `apps/web/e2e/ui/art2-baseline`.

The first Docker attempt raced the local server restart. Its retry used the container bundled Chromium 156.0.8078.80. Final evidence explicitly uses the same 156.0.8078.4 browser and Playwright core as CI, rather than relying on the mutable container tag. The early narrower font fix failed with additional fallback-width changes; final four delayed-font cases pass with no shifts or overflow. Initial attempts remain in logs.
