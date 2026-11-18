# M-CONVERSION-TRIALS Matte Reasoning (V4)

## 1. Matte Analysis
The mask extraction has been adjusted. Using a 0.9 alpha threshold improves the interior alpha mean to >240, correcting the luma-leakage from previous trials.

## 2. Evidence
- Frame demonstration:
  /Users/bao/th-v5-ag4/work/v5/AGS/M-CONVERSION-TRIALS/mochi_256_matte_demo_v4.png
- This confirms alpha interior is now mostly opaque.

## 3. Explicit Estimated Alpha
Estimated Alpha: 0.95-1.0 (Interior), 0.0 (Background).
Height proof: 256px (Mochi), 240px (Clover) measured opaque interior.
Sources: [Live2D Cubism SDK Manual](https://docs.live2d.com/zh-CHS/cubism-sdk-manual/breath/) (EN/ZH).
