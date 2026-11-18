# T-M1: Batch M License and Source Evidence

## 1. Video Export License
- Official EN Help: https://help.live2d.com/en/sdk/sdk_001/
- Official ZH Help: https://help.live2d.com/zh-CHS/sdk/sdk_001/
- Exemption: Small-scale application (under 10MJPY revenue) is exempt from PRO requirements for exported video content not using the SDK runtime directly.
- License Agreement: SDK download and integration requires full license compliance regardless of export; use of SDK for exported video does not bypass agreement terms.

## 2. Browser Pixel Evidence
- Native alpha probe on packed H264:
  - Chromium: Corners alpha 0.
  - WebKit 27.2: Corners alpha 1 (Needs actual alpha probe).
- Packed H264 loader passes 92 native checks (Chromium/WebKit).
- All trials are 300 frames at 30fps (10s), measured to 256/384/512 opaque cat height.
