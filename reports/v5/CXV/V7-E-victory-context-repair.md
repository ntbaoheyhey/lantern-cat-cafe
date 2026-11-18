# Victory crew remains visible during WebGL loss

The current component hides its original fallback after the four animated cats load. A native GPU context loss then leaves the crew blank until restoration. Merely exposing the fallback is insufficient: the lost canvas can cover it with an opaque white rectangle.

The prepared repair hides the lost canvas, exposes the four existing original images, and cancels its frame request. Actor completions, resize, density and motion notifications cannot restart drawing while lost. A real restored event schedules a frame; the animated canvas becomes visible only after that draw succeeds. Cleanup removes both context listeners and rejects late callbacks. Art, geometry, density caps, normal poses and game rules are preserved.

Validation: 28 focused tests and full web typecheck pass on the exact normalized candidate. Six full-frame RGB pairs match retained-page native controls for loaded, original fallback, and restored states in both motion modes. Two real context-loss lifecycles cover zero lost-period draws, resize/density/motion updates, one restored static frame and disconnected cleanup. Twelve measured1280x720captures and four fresh1024x576sheets were reviewed once. The initial white-canvas prototype remains recorded as a visual failure despite passing numerical checks.

The patch and candidate metadata are review artifacts. Application source is held at48ce7e9a/f991fb117 for CXI's independent density/dependency audit. Native production verification and independent acceptance are still required. The prepared native runner covers real loss/restoration, six density transitions and four32s ordinary DPR2 CPU1x/4x runs; no speedup or physical-hardware failure-rate claim is made.
