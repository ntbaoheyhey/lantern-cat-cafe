# Historical capture archive

The report directory exceeded its 150 MB limit because it included 140 screenshots from the failed S2 baseline and earlier S4 pilots. On 16 November, 160 **ignored, untracked** historical PNG files were moved intact to `work/v4ship-evidence/archive-20261116-1/`. Every file was hashed before and after the move; all 160 SHA-256 values matched.

[The exact index](evidence-archive-1.json) maps each original repository-relative path to its archive path, size and SHA-256. For an original journey JSON screenshot reference such as `raw/<name>.png`, first resolve it relative to that journey's directory, then look up the resulting path in the index. Original run JSON and metrics were not rewritten.

The archive is local evidence under ignored `work/`; a clean Git clone will not contain these captures. Eight representative S2 screenshots remain under its `raw/` folder; the active S4 final batch and its eight screenshots were untouched. Reports fell from 266,272,636 bytes to 77,960,278 bytes before this index/document was added. The moved bytes are preserved, not discarded or claimed as published evidence.

To restore a capture, verify the archived hash, ensure its original path is absent, then move the file back to the indexed original path. Restoring the whole archive will exceed the report budget again; use the archive directly for historical review.
