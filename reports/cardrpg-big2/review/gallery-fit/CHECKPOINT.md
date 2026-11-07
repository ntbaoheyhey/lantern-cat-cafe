# Gallery viewport verification
REFERENCE: checks.json; 1024-gallery.png; tools/cardrpg-big2/studio.css

The actual wrapped controls leave a fitted stage at all three sizes. Checkboxes are17px square with8px text gaps; selected-tab contrast is8.50. No horizontal overflow or runtime errors.

| Viewport | Stage height | Stage bottom |
|---|---:|---:|
| 1280×720 | 276.41px | 649.50px |
| 1440×900 | 519.91px | 829.50px |
| 1024×600 | 189.41px | 529.50px |

Viewed1024: controls now fit, but the189.4px-high stage makes the figures very small. Viewport fit is not visual-scale acceptance. The separate studio action test failed on a slider interaction and remains under diagnosis; this layout receipt does not certify those controls.
