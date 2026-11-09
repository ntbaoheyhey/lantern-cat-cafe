# Evidence packing
Duplicate media is stored once, and large plain receipts use lossless gzip. [Alias manifest](EVIDENCE-ALIASES.json) maps every former path to its current path, SHA256 and decompressed size. Markdown evidence links were updated. Each distinct or failed measurement is retained. Historic clips remain at the immutable links in [HISTORICAL-VIDEOS.md](HISTORICAL-VIDEOS.md). Raw local capture/trace files are indexed by the M4 manifest.

M4 review images use q64 WebP at unchanged dimensions; full/m4/encoding.json preserves source/delivery hashes. Videos and numeric receipts are unchanged.
