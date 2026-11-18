# M-CONVERSION-TRIALS Matte Reasoning

## 1. Matte Analysis
The current V3 trials use a simple luma-based mask extraction. The observed interior alpha mean (165/176) reflects the luma value of the interior fur, not true transparency. The alpha mask is effectively a thresholded luma map which erroneously treats bright interior fur as transparent/semi-transparent.

## 2. Evidence
- Frame demonstration (black/white background overlay):
  /Users/bao/th-v5-ag4/work/v5/AGS/M-CONVERSION-TRIALS/mochi_256_matte_demo.png
- This shows the mask is applying transparency to the bright fur areas rather than just the edges.

## 3. Explicit Estimated Alpha
Actual cat alpha is near-binary (1 for cat, 0 for background). The current trials are providing a luma-based approximation which is insufficient for high-quality composition.
