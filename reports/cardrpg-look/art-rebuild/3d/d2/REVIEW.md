# D2 size normalization — accepted technical transition

Measured all25 original fallback units in50 real A6-shell views (1440×900 and1280×720). No size, clipping, face/HP overlap or missing-label failures. Live A6 source is recorded in preview-source.json.

Before: normal starter party body heights43.4%,46.3%,35.1% of670px canvas; Yarn62.5% (63.6% at720p). After: party38.95%,38.93%,38.98% at900p and46.47%,46.45%,46.51% at720p; boss-view party27.9%, bosses49.0–49.7%. Canonical body height cats1.00,small.90,standard1.20,boss1.80; one explicit shared model-to-stage factor2.0, no slot/rarity compensation.

First after capture exposed left-tail clipping at1440p; widened only the regular framing from9.3 to10.9 stage units, then reran all50views. Both whole silhouettes and semantic body boxes now fit. Visual inspection confirms equal-height starter cats, clear faces and boss labels. The boss view reveals more floor; D8 must compose the real3D stage around the bounded roster. No puppet visual-quality score is claimed.

Validation:4decodedGLB tests (including oversize, missing skin and flat failures),51webtests,typecheck,lint,5seed/6mode/102plan parity PASS. Standalone combined artifact38,898,538B <=40,000,000B. Raw3D accepted0/25; strict final delivery intentionally fails pending models.

The lineup is a temporary concept fallback size reference, explicitly labeled as such. D3 replaces entries with accepted volumetric models; D2 never counts a puppet as3D.
