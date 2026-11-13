# Shared cut-out rig implementation plan

Existing approved cut-outs already provide complete head, body, arm, feet and tail art for all non-designer units. Reuse those pixels and preserve their core measurements instead of generating another inconsistent set of master illustrations. Convert the independent cut-out geometry to the canonical template, add joint-weighted subdivisions, deterministic template motion and optional facial slots. Existing designer Mochi/Clover/Soot deliveries remain intact; the importer supplies the same event/socket contract.

This is an authorized method change under section 0.6. The script must report unavailable separate facial/weapon pieces honestly, not fabricate proof that they were hand-painted. New poses require visual inspection and an enclosed-alpha-hole test. If the split cannot pass extreme poses, reduce joint excursion or retain a weighted connected mesh; do not hide failing units from QA.
