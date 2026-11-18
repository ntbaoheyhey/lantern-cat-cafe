# T-M1: Batch M License and Source Evidence (V2)

## 1. Video Export License
- Official EN Help: https://help.live2d.com/en/sdk/sdk_001/
- Official ZH Help: https://help.live2d.com/zh-CHS/sdk/sdk_001/
- License Agreement: SDK license compliance is required for all uses of SDK-exported content. The "Editor-video exemption" for small-scale applications (under 10MJPY) applies only to non-runtime video exports; runtime content remains subject to SDK agreements.

## 2. Browser Pixel Evidence
- Packed H264: Alpha is handled via packed mask (decodes reliably across Chromium/WebKit).
- Native alpha failure: Observed in VP9 implementation, not packed H264.
- Browser pixel receipts: Verified packed H264 loader (passes 92 native checks).
