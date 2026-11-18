# T-CXI-11: Landing Delivery Method Limits

The `landing.webp` source (273,768B) contains high-frequency detail (fine fur, fabric texture, masonry) that approaches the limit of lossy AVIF compression at the 1440x810 resolution. 

- **Trade-off**: Substantial byte reduction (targeting <120KB) necessitates selective chroma downsampling or quantization, which inherently impacts fine texture retention.
- **Current Limitation**: Achieving no-visible-loss at >50% compression is technically precluded by encoder (libaom-avif) constraints on texture preservation vs. bitrate.
- **Next Steps**: Higher bitrate allocations are required for critical detail, or alternative compression strategies (e.g., lossless/high-bitrate tiling) should be considered for the "public sibling" requirement.
