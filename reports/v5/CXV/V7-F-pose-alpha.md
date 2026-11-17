# Pose opacity mask experiment — runtime rejected

The remaining first-contact trace includes opacity readbacks. Fresh80-source export proves each alpha>=128 crop can be represented exactly as a bitset; all40 delivered/original pairs differ, so a shared fallback mask is invalid. No original art, loader, manifest or application code was changed.

Eight URL variants for four measured first-contact sources cost251105raw JSON bytes,19823gzip/8986Brotli. Full74URL export costs2334603raw/177677gzip/87282Brotli. These are packaging estimates, not transfer measurements.

Seven alternating cold runs per mode at1×/4× on wave3/boss compare65posed meshes per rate. Module parsing/import and mask preparation are included; every bound is exact. Missing entries, wrong dimensions and truncated encoded data all retain the current canvas path and identical bounds/read counts. Same-size data corruption and stale source contents are not runtime-validated by this prototype; source bytes were reverified by the tool.

| Method | Wave3 normal/4× total median ms | Boss normal/4× total median ms |
|---|---|---|
| RGBA expansion baseline |75.7 /266.8|80.9 /285.6|
| RGBA expansion mask |79.4 /268.7|79.2 /286.6|
| Direct packed access baseline |81.7 /277.8|77.7 /297.5|
| Direct packed access mask |88.8 /297.6|89.2 /317.4|

Readbacks drop30→28 in wave3 and30→26 in boss, but preparation/access costs erase the isolated benefit. Both variants are rejected; no broader natural-play run is warranted. Browser errors0; one expected legacy Google Fonts stylesheet block per fixture retained. Four-times throttling is host-relative. There are no new screenshots because these are read-only geometry/encoding experiments, not visual acceptance.

Source a936e3328 with empty application patch; candidate6310 exact judge query plusdev=1; viewport1280×720. Each raw report records UTC, runtime hashes, byte hashes and source snapshots. Evidence:V7-F-pose-alpha-export.json and V7-F-pose-alpha-experiments.json. Raw files stay under work/v5/CXV/films/V7-F-pose-alpha*. The study began23:54:44Z,minimum adoption gate00:09:44Z;no adoption occurred.
