# Collection detail follow-up
REFERENCE: ../memory/PROMPT.md phase M and lane addendum, ../meta/screens/1024-collection.png, ../meta/GATES.md

The existing 1024px capture places the miniature in a 310px detail panel. The canvas and its rotation controls extend below the first viewport. The follow-up reserves at least380px for the detail and keeps the existing two-card grid on narrow desktop. Selecting a companion at1100px or below scrolls its detail into view. Reduced motion uses immediate scrolling.

## Acceptance checks
REFERENCE: ../../../tools/cardrpg-big/collection-check.mjs

Compare the G62cb5697 artifact against this CSS/selection follow-up at1024×600,1280×720 and1440×900. Record actual panel/canvas/control bounds, scroll position, page errors and outside requests. The narrow canvas must gain at least60px width, retain300px height, show its rotation controls after a real card click and preserve all twelve cards/filter options. All three sizes must have zero horizontal document/content overflow. Capture the same Soot model and a skill preview through real clicks. Browser evidence requires the shared timing lock.
