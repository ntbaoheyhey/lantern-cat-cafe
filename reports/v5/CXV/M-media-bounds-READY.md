# Scoped media bounds repair

Packed media now uses its measured logical envelope clipped through posed UV triangles. Only marked Mochi/Clover bodies take this path; ordinary alpha scanning is unchanged.

98 focused tests and typecheck pass. Chromium reproduces the old zero-width IndexSizeError; the new helper passes 20 cast cases, exact idle/recovery/poster bounds, and height 511.99999733154687 within 0.000244140625 Float32 tolerance. Zero page errors; only the fixture intentional Google Fonts block. R1/R2 failures retained.

3,833 Soot path hashes and capture-arrival.mjs remain unchanged. This is a posed static envelope, not a decoded silhouette. Full production scene/art/height/socket/seam/byte acceptance remains with CXI.
