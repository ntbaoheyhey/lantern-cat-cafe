# Rare invitation viewport checkpoint
REFERENCE: tools/cardrpg-big/reveal-check.mjs, apps/web/src/game/cardrpg/depth/Invitations.tsx, apps/web/src/game/cardrpg/depth/invitations.css

The first 1024×600 check measured the entrance canvas bottom at639.25px,39.25px below the viewport. The correction scrolls the ceremony below the sticky fairness summary and puts the model beside its revealed card. Sourcebbba4c0d, artifact980791a0a52ce56bd6c76ed51e346514804b0797faa7cc2c6eecd64ecd65468c,20,859,481bytes.

Eight real-click cases captured24images. Each case checks published odds/pity/cost/history, an epic or legendary result, a successful entrance on the reused preview scene, viewport bounds, zero horizontal page overflow, zero page errors and zero remote requests. The CPU4 cases use1280×720. Full raw data is in viewport-v2/checks.json. Its capture paths retain the original reveal-worktree location, and the copies sit beside that JSON.

|Viewport|CPU|Result|Canvas top–bottom px|Fairness bottom px|Overflow px|Errors|
|---|---|---|---|---|---|---|
|1024×600|1×|epic|286.25–504.25|233.47|0|0|
|1024×600|1×|legendary|286.25–504.25|233.47|0|0|
|1280×720|1×|epic|272.55–490.55|222.88|0|0|
|1280×720|1×|legendary|272.55–490.55|222.88|0|0|
|1440×900|1×|epic|272.55–490.55|222.88|0|0|
|1440×900|1×|legendary|272.55–490.55|222.88|0|0|
|1280×720|4×|epic|272.55–490.55|222.88|0|0|
|1280×720|4×|legendary|272.55–490.55|222.88|0|0|

## Remaining integration checks
REFERENCE: ../demo/readability/pilot-overflow/failure.log, ../../../tools/cardrpg-big/lab-check.mjs

The following Feel lab check stopped on2px horizontal body overflow in the narrow battle gallery. Five early screenshots and the failure log are retained under reports/cardrpg-big/demo/readability/pilot-overflow. The combined fix644a0fe0 resets full-width control margins and keeps tab contrast/checkbox alignment fixesf81c4838. Browser validation is queued against the separate integrated artifact1bd16da4. The reveal candidate's five project gates were skipped after the lab assertion stopped its sequential runner. Full integrated validation remains required.
