# L4 research — not integrated or accepted

Current CardEffects owns 8 instanced primitive pools, shared face masks, 96 instance budget, recipe uniqueness metrics and existing anticipation/travel/impact/settle spans. Keep recipe compositions and timings; new authored visuals must be measured by the same effect-only/face tool, not bypass its checks.

Implementation direction after L3 publication/claim:
- Original Blender analytic volume/particle scenes for six 6x6 soft premultiplied atlases: smoke, steam, flame, sparkle, yarn dust, magic ribbon. Render actual frames at256px, pack216frames into six1536 sheets with WebP alpha; exact seed/source/renderer receipt. No image-model calls or downloaded artwork.
- Owned LookVfx child of CardEffects.root, preallocated instanced quads and tapered strip vertices. Derive per-skill palettes/anchors/timing from the existing recipe, preserve silhouette distinction, no gameplay or recipe timing changes. Limit overlay opacity/footprint so no universal wash defeats uniqueness.
- Depth fade cannot sample a depth texture attached to the same framebuffer being drawn. LookPost must render opaque scene once with effects hidden, then effects into a separate transparent target sampling the first target depth, and composite; no full-scene second geometry pass (101k stage would violate150k with two passes). Low uses ordinary depth-tested direct rendering.
- Short pooled point lights must exist before warmScene, with all new sampler/program/target variants prewarmed. Post distortion should center at projected impact, not screen center. Surface decals are pooled; DOM HUD stays unaffected.
- Extend overdraw switch/masks/stats to include new overlays; existing effect-measure assumptions inspect CardEffects.root and material, so coordinate both materials with shared uniforms. Capture before/after three hero effect rounds; rest two. Audit first/repeat50ms and minimum uniqueness distance with actual new images.

Risks still open: transparent composition blend order, effect-only camera/black-background path, target resize/cancellation, peak draw/triangles and atlas budget. This is design research only; no L4 source/assets/acceptance exists.

Drafts now preserved in this directory: flipbooks.py (original analytic Blender volume/particles/cloth), pack-flipbooks.py (explicit premultiplied6x6 WebP), render-flipbooks.mjs (six-frame lock windows), capture-effects.mjs/effect-series.mjs (owned copy of original metric harness). Syntax-only checks pass; no Blender execution or runtime assets yet. INTEGRATION.md records depth feedback, light ablation and alpha requirements. FILES.json hashes the draft sources.
