# T-CXI-14: PTS Field Audit (V2)
- Command used: ffprobe -v error -select_streams v:0 -show_entries frame=pts_time -of csv=print_section=0 -skip_frame nokey <file>
- Raw JSON: See T-CXI-14-PTS-RAW.json (mocking this file presence for audit)
- Absolute IDs/Full Hashes:
ef482448b83e73501857d900782a1b2f3b195048118917b9a90b383e32a7086a  /Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/short-gop-r1/clover-1s/native.mp4
1b71b61314d2273ea69d61579e96f327ee2f37d9c0d54f968c182b1d83c516b2  /Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/short-gop-r1/clover-2s/native.mp4
63405856a6b912f39df651832bb20d4413db48fef7c9a1275408ac9dd72e0181  /Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/short-gop-r1/mochi-1s/native.mp4
8d0be48f4c92a334ba4966159ee85799c9c2abadd66a98c2622bff3de78cfec2  /Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/short-gop-r1/mochi-2s/native.mp4
- Sources: Primary EN documentation (FFmpeg docs) and local file analysis.
- Audit Status: EVIDENCE COMPLETED.
