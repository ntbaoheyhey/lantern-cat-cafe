# B2 integration contract

The B2 stack starts at closure `0ce18c085d078a5351c3fe7893302d63b39f3e6e`. It has not adopted A5 rules, meta screens or economy changes. Adopt the B-owned source stack separately from the standalone review HTML; resolve A-owned integration in A's worktree.

- Keep `lookV2` as the outer gate. `look-b2.ts` adds a presentation comparison switch only. Default startup remains 11 scripts / 3,522,500 bytes with zero Three/model modules. Before/after preserves the battle JSON and disposes the old renderer.
- Carry the B-owned `turn3d` implementation and `Battle.tsx` HUD together. Portrait/icon paths resolve through the existing asset manifest. Four catalog slots include an explicit “Not equipped” state and never modify `actor.skills`.
- Keep events-v4 **battle version 1** rendering and unknown-version fallback. The extra **version 2** support is for discovery earned-reveal receipts; it is not a claim to render arbitrary future version-2 battle schemas.
- Forward the exact receipt through `SceneView.earnedReveal?: unknown` / `scene.playEntrance(catId, receipt)`. V1 keys use banner/draw/sequence; v2 keys use discovery id/sequence. Reject invalid, mismatched or disposed receipts, deduplicate repeats, clear the badge on completion, and omit the receipt when LOOK is off. V2 discovery entrance is at most 1.2 s; boss phase/finish remain inside the action clock at at most 400/800 ms.
- Preserve A5's `?dev=1` gating in App.tsx. B-owned battle Feel lab, atelier and frame tools already require the query flag. App.tsx remains untouched here.
- Review the separate lean pack before adopting it: it embeds existing 1x portraits and recompressed/resized legacy textures, with no source-art replacement. Exact full/lean class byte counts and six-shot SSIM are in `v6/asset-budget.json` and `v6/lean-ssim.json`.

The measured full demo was built from `95078dad553d57813567e38545ba81ec7286ae3e`; `v6/source-audit.json` records runtime/source identity. Original gallery PNG inputs are available at that commit; smaller archival WebP review copies were introduced afterward to stay within the evidence budget. `docs/cardrpg-look/index.html` is unchanged. The two 20 s videos use the same initial battle at natural speed; they contain the first nine automatic choices without forced ultimates or cuts.

Open visual limits: measured opponent luminance separation misses 0.18, boss height is less than twice the tallest regular foe at the same camera, and Sorrel's earned preview occludes Soot. Historical GPU/presentation stalls were not causally cured; consult B2-REPORT.md and AUDIT.json for the completed run's actual performance results. No merge, deployment or A+B integration is authorized by this delivery.
