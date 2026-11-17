# Lossless report archive

The37 historical S11 parity-probe reports listed in [the catalogue](S11/evidence-archive-1.json) are stored beside their original locations as `.json.gz`. Each entry records the original path, length, SHA256, immutable source commit/blob and encoded length/hash. Decoding produces every original byte, including whitespace. Existing signed reports retain their original logical paths and hashes; results and failures are unchanged. Regression logs and the six recent baselines remain directly available.

Verify all stored reports from the repository root:

```sh
python3.12 tools/v4ship-lab/evidence-archive.py verify
```

Restore exact original paths into a fresh separate directory for inspection:

```sh
python3.12 tools/v4ship-lab/evidence-archive.py restore --destination work/v4ship-prep/replay-evidence-1
```

The destination must not exist. The tool verifies encoded and decoded hashes, rejects unsafe paths and refuses overwrite. It prints counts only. A restored file can be supplied to a historical verifier in its separate replay checkout. Use the historical verifier's original source and other signed inputs; restoring reports alone does not reproduce a historical runtime. Do not rewrite historical hashes or regenerate JSON as a substitute for exact bytes. For routine work, keep restored copies outside `reports/v4-ship` to preserve its150MB budget.

Prepared review1 and installed review2 independently compare Node and system gzip decoding with immutable Git objects and the restored files. Nineteen corruption/path/overwrite controls are recorded in those reviews. [Learning and measured format comparison](LEARN/S11-evidence-archive.md) explain the choice of gzip9. No runtime, ART asset, live history scanner or secret-triage report is archived by this item.

Catalogue2, [S11/evidence-archive-2.json](S11/evidence-archive-2.json), preserves20 additional immutable transfer, audio, offline and economy reports fromd029bc9c4. All11,000,233 original bytes remain recoverable, including failed observations and historical signatures; gzip9 saves9,984,598B. New current transfer evidence remains uncompressed. Verification uses Git, Python, Node and system gzip independently. Original logical references resolve after restoration; historical verifiers still need their matching source and other inputs.

```sh
python3 tools/v4ship-lab/evidence-archive-2.py verify
python3 tools/v4ship-lab/evidence-archive-2.py restore --destination work/v4ship-prep/replay-evidence-2
```

Use a fresh destination. The explicit20-path allowlist excludes security triage and mutable scanners. [QA-2 learning](LEARN/S11-qa-cold-transfer.md) records the measured gzip1/gzip9 comparison; the installed catalogue includes per-file timings and identities.
