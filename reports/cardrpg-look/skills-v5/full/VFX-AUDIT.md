# VFX audit — MX0 baseline
Agent visual self-score from all 12 cat and 13 enemy five-frame sheets. Five frozen samples inform motion; continuous motion acceptance is separate. Configured layers are not perceived layers. 48 cat active skills include 12 ultimates; 12 passive presentations give 60 distinct cat tiles, plus 26 enemy cues.

Cat mean **4.517/10**; this is an agent assessment, not user acceptance.

Whole-cat batch order (weakest first): soot, velvet, cinnamon, sorrel, inkcap, brioche, panko, mallow, clover, marigold, mochi, biscuit.

Worst 50% of cat presentations: soot-1, cinnamon-3, clover-1, sorrel-1, mochi-passive, soot-passive, clover-passive, panko-passive, mallow-passive, sorrel-passive, biscuit-passive, inkcap-passive, cinnamon-passive, brioche-passive, velvet-passive, marigold-passive, inkcap-2, mochi-2, panko-2, brioche-3, velvet-1, velvet-2, soot-4, clover-2, mallow-1, mallow-2, biscuit-2, cinnamon-1, marigold-1, velvet-3.

[60-tile peak sheet](mx0/peak-sheet.webp) · [enemy peak sheet](mx0/enemy-peaks.webp) · [raw capture receipt](mx0/vfxsheet.json.gz)

| Cue | Shape | Layers | Motion | Identity | Clarity | Mean | Evidence / observed flaw |
|---|---:|---:|---:|---:|---:|---:|---|
| mochi-1 | 6 | 5 | 5 | 6 | 7 | 5.8 | [Door knock](mx0/mochi.webp): Door silhouette reads; support/ultimate rely on similar gold foot rings. |
| mochi-2 | 4 | 3 | 4 | 4 | 6 | 4.2 | [Warm welcome](mx0/mochi.webp): Door silhouette reads; support/ultimate rely on similar gold foot rings. |
| mochi-3 | 5 | 4 | 4 | 6 | 6 | 5.0 | [Apron crossing](mx0/mochi.webp): Door silhouette reads; support/ultimate rely on similar gold foot rings. |
| mochi-4 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Last light shelter](mx0/mochi.webp): Door silhouette reads; support/ultimate rely on similar gold foot rings. |
| soot-1 | 3 | 2 | 3 | 3 | 5 | 3.2 | [Cocoa spark](mx0/soot.webp): Spark is nearly absent; cup/lantern identity needs material depth and sharper impact. |
| soot-2 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Black cup](mx0/soot.webp): Spark is nearly absent; cup/lantern identity needs material depth and sharper impact. |
| soot-3 | 5 | 4 | 5 | 6 | 6 | 5.2 | [Lantern wick](mx0/soot.webp): Spark is nearly absent; cup/lantern identity needs material depth and sharper impact. |
| soot-4 | 4 | 4 | 4 | 4 | 6 | 4.4 | [Midnight service](mx0/soot.webp): Spark is nearly absent; cup/lantern identity needs material depth and sharper impact. |
| clover-1 | 3 | 2 | 3 | 4 | 5 | 3.4 | [Leaf tap](mx0/clover.webp): Greenhouse arch is distinctive; basic leaf and steam are too small. |
| clover-2 | 4 | 3 | 4 | 5 | 6 | 4.4 | [Patient steep](mx0/clover.webp): Greenhouse arch is distinctive; basic leaf and steam are too small. |
| clover-3 | 5 | 4 | 5 | 6 | 6 | 5.2 | [Clearleaf rinse](mx0/clover.webp): Greenhouse arch is distinctive; basic leaf and steam are too small. |
| clover-4 | 7 | 6 | 6 | 8 | 6 | 6.6 | [Greenhouse morning](mx0/clover.webp): Greenhouse arch is distinctive; basic leaf and steam are too small. |
| panko-1 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Pan reply](mx0/panko.webp): Oven/handle motif reads; cover and return settle into generic rings. |
| panko-2 | 4 | 3 | 4 | 4 | 6 | 4.2 | [Bread cover](mx0/panko.webp): Oven/handle motif reads; cover and return settle into generic rings. |
| panko-3 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Crust return](mx0/panko.webp): Oven/handle motif reads; cover and return settle into generic rings. |
| panko-4 | 6 | 5 | 5 | 6 | 6 | 5.6 | [Oven door](mx0/panko.webp): Oven/handle motif reads; cover and return settle into generic rings. |
| mallow-1 | 4 | 3 | 4 | 5 | 6 | 4.4 | [Whisk flare](mx0/mallow.webp): Fire travel is visible; three attacks share the same small flame profile. |
| mallow-2 | 4 | 3 | 4 | 5 | 6 | 4.4 | [Split ember](mx0/mallow.webp): Fire travel is visible; three attacks share the same small flame profile. |
| mallow-3 | 5 | 4 | 5 | 5 | 6 | 5.0 | [Burnt sugar](mx0/mallow.webp): Fire travel is visible; three attacks share the same small flame profile. |
| mallow-4 | 6 | 5 | 5 | 6 | 6 | 5.6 | [Closing blaze](mx0/mallow.webp): Fire travel is visible; three attacks share the same small flame profile. |
| sorrel-1 | 3 | 2 | 3 | 4 | 5 | 3.4 | [Moon spoon](mx0/sorrel.webp): Moon spoon is tiny; tea/glass motif reads but lacks a strong beat. |
| sorrel-2 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Cold brew](mx0/sorrel.webp): Moon spoon is tiny; tea/glass motif reads but lacks a strong beat. |
| sorrel-3 | 5 | 4 | 4 | 6 | 6 | 5.0 | [Decanted moon](mx0/sorrel.webp): Moon spoon is tiny; tea/glass motif reads but lacks a strong beat. |
| sorrel-4 | 6 | 5 | 5 | 6 | 6 | 5.6 | [Shared pot](mx0/sorrel.webp): Moon spoon is tiny; tea/glass motif reads but lacks a strong beat. |
| biscuit-1 | 5 | 4 | 5 | 6 | 6 | 5.2 | [Rolling pin](mx0/biscuit.webp): Pin and crumb silhouette reads; support and ultimate need more depth. |
| biscuit-2 | 4 | 3 | 4 | 5 | 6 | 4.4 | [Sideboard step](mx0/biscuit.webp): Pin and crumb silhouette reads; support and ultimate need more depth. |
| biscuit-3 | 5 | 4 | 5 | 6 | 6 | 5.2 | [Last crumb](mx0/biscuit.webp): Pin and crumb silhouette reads; support and ultimate need more depth. |
| biscuit-4 | 5 | 4 | 5 | 5 | 6 | 5.0 | [Bakers procession](mx0/biscuit.webp): Pin and crumb silhouette reads; support and ultimate need more depth. |
| inkcap-1 | 5 | 4 | 5 | 6 | 6 | 5.2 | [Ink thread](mx0/inkcap.webp): Thread/decoy silhouettes differ; purple spore impact is faint. |
| inkcap-2 | 4 | 3 | 4 | 4 | 5 | 4.0 | [Quiet spores](mx0/inkcap.webp): Thread/decoy silhouettes differ; purple spore impact is faint. |
| inkcap-3 | 6 | 4 | 4 | 6 | 6 | 5.2 | [Paper decoy](mx0/inkcap.webp): Thread/decoy silhouettes differ; purple spore impact is faint. |
| inkcap-4 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Dreaming canopy](mx0/inkcap.webp): Thread/decoy silhouettes differ; purple spore impact is faint. |
| cinnamon-1 | 4 | 3 | 4 | 5 | 6 | 4.4 | [Spice pinch](mx0/cinnamon.webp): Cup/cloche are recognisable; cleanse has almost no impact silhouette. |
| cinnamon-2 | 5 | 4 | 4 | 6 | 6 | 5.0 | [Comfort cup](mx0/cinnamon.webp): Cup/cloche are recognisable; cleanse has almost no impact silhouette. |
| cinnamon-3 | 3 | 2 | 3 | 3 | 5 | 3.2 | [Clean apron](mx0/cinnamon.webp): Cup/cloche are recognisable; cleanse has almost no impact silhouette. |
| cinnamon-4 | 6 | 4 | 4 | 6 | 6 | 5.2 | [Second serving](mx0/cinnamon.webp): Cup/cloche are recognisable; cleanse has almost no impact silhouette. |
| brioche-1 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Bell patrol](mx0/brioche.webp): Aprons read but flat lilac surfaces hide secondary details. |
| brioche-2 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Borrowed blanket](mx0/brioche.webp): Aprons read but flat lilac surfaces hide secondary details. |
| brioche-3 | 4 | 3 | 4 | 4 | 6 | 4.2 | [Starched collar](mx0/brioche.webp): Aprons read but flat lilac surfaces hide secondary details. |
| brioche-4 | 6 | 5 | 5 | 6 | 5 | 5.4 | [Constellation apron](mx0/brioche.webp): Aprons read but flat lilac surfaces hide secondary details. |
| velvet-1 | 4 | 3 | 4 | 4 | 6 | 4.2 | [Silk nick](mx0/velvet.webp): Three triangle/ribbon peaks are similar; curtain is mostly a low smoke band. |
| velvet-2 | 4 | 3 | 4 | 4 | 6 | 4.2 | [Candle bounce](mx0/velvet.webp): Three triangle/ribbon peaks are similar; curtain is mostly a low smoke band. |
| velvet-3 | 5 | 4 | 4 | 4 | 6 | 4.6 | [Stolen flame](mx0/velvet.webp): Three triangle/ribbon peaks are similar; curtain is mostly a low smoke band. |
| velvet-4 | 4 | 4 | 5 | 4 | 6 | 4.6 | [Velvet curtain](mx0/velvet.webp): Three triangle/ribbon peaks are similar; curtain is mostly a low smoke band. |
| marigold-1 | 4 | 3 | 4 | 5 | 6 | 4.4 | [Seed stitch](mx0/marigold.webp): Leaf/cup motifs read; floral growth and impact hierarchy are weak. |
| marigold-2 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Garden bell](mx0/marigold.webp): Leaf/cup motifs read; floral growth and impact hierarchy are weak. |
| marigold-3 | 5 | 4 | 4 | 5 | 6 | 4.8 | [Spring pruning](mx0/marigold.webp): Leaf/cup motifs read; floral growth and impact hierarchy are weak. |
| marigold-4 | 6 | 5 | 5 | 6 | 6 | 5.6 | [First tea blossom](mx0/marigold.webp): Leaf/cup motifs read; floral growth and impact hierarchy are weak. |
| mochi-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Door keeper](mx0/mochi.webp): Door silhouette reads; support/ultimate rely on similar gold foot rings. |
| soot-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Ash reader](mx0/soot.webp): Spark is nearly absent; cup/lantern identity needs material depth and sharper impact. |
| clover-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Second steep](mx0/clover.webp): Greenhouse arch is distinctive; basic leaf and steam are too small. |
| panko-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Warm crust](mx0/panko.webp): Oven/handle motif reads; cover and return settle into generic rings. |
| mallow-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Hot whisk](mx0/mallow.webp): Fire travel is visible; three attacks share the same small flame profile. |
| sorrel-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Measured pour](mx0/sorrel.webp): Moon spoon is tiny; tea/glass motif reads but lacks a strong beat. |
| biscuit-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Bakers resolve](mx0/biscuit.webp): Pin and crumb silhouette reads; support and ultimate need more depth. |
| inkcap-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Soft landing](mx0/inkcap.webp): Thread/decoy silhouettes differ; purple spore impact is faint. |
| cinnamon-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Ground spice](mx0/cinnamon.webp): Cup/cloche are recognisable; cleanse has almost no impact silhouette. |
| brioche-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Night watch](mx0/brioche.webp): Aprons read but flat lilac surfaces hide secondary details. |
| velvet-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [Lost flame](mx0/velvet.webp): Three triangle/ribbon peaks are similar; curtain is mostly a low smoke band. |
| marigold-passive | 3 | 2 | 3 | 4 | 6 | 3.6 | [First leaf](mx0/marigold.webp): Leaf/cup motifs read; floral growth and impact hierarchy are weak. |
| enemy:button-guard:basic | 3 | 2 | 3 | 4 | 6 | 3.6 | [Button tap](mx0/button-guard.webp): Button/coil reads at travel; impact collapses to small rings. |
| enemy:sock-skipper:basic | 3 | 2 | 3 | 4 | 6 | 3.6 | [Heel scuff](mx0/sock-skipper.webp): Sock silhouette travels, but pink fabric at impact competes with body. |
| enemy:spool-ram:basic | 3 | 2 | 3 | 4 | 6 | 3.6 | [Bobbin nudge](mx0/spool-ram.webp): Signature lunge reads; charge lacks a sustained telegraph. |
| enemy:needle-moth:basic | 3 | 2 | 3 | 3 | 6 | 3.4 | [Running stitch](mx0/needle-moth.webp): Thin pale needles disappear near impact; no clear three-strike sequence. |
| enemy:teacup-healer:basic | 3 | 2 | 3 | 4 | 6 | 3.6 | [Saucer flick](mx0/teacup-healer.webp): Spoon and cup are legible in travel; healing has little secondary depth. |
| enemy:kettle-knight:basic | 4 | 3 | 4 | 5 | 6 | 4.4 | [Spout jab](mx0/kettle-knight.webp): Shield/steam identity reads; the attack is still one sparse arc. |
| enemy:yarn-giant:basic | 4 | 3 | 4 | 5 | 6 | 4.4 | [Weaver sweep](mx0/yarn-giant.webp): Heavy pose carries the cue; sparse pale thread fan lacks a broad impact. |
| enemy:binding-thread:basic | 3 | 2 | 3 | 4 | 6 | 3.6 | [Shoulder tug](mx0/binding-thread.webp): Narrow thread travel, low ring impact; signature resembles basic. |
| enemy:practice-cushion:basic | 2 | 2 | 3 | 3 | 6 | 3.2 | [Soft hop](mx0/practice-cushion.webp): Basic is nearly absent; signature pad silhouette reads but is flat. |
| enemy:pollen-scout:basic | 4 | 3 | 4 | 5 | 6 | 4.4 | [Seedbrush flick](mx0/pollen-scout.webp): Green petal travel distinguishes it, but impact reduces to a small ring. |
| enemy:rain-spool:basic | 3 | 2 | 3 | 4 | 6 | 3.6 | [Rain sling](mx0/rain-spool.webp): Blue lines/raindrops readable in travel, sparse impact. |
| enemy:crumb-sentinel:basic | 4 | 3 | 4 | 5 | 6 | 4.4 | [Sugar pinch](mx0/crumb-sentinel.webp): Crown travel is distinctive, with few supporting layers. |
| enemy:pantry-crown:basic | 5 | 3 | 4 | 6 | 6 | 4.8 | [Cup tally](mx0/pantry-crown.webp): Cup/crown signature is clear; only modest settling depth. |
| enemy:button-guard | 3 | 2 | 3 | 4 | 6 | 3.6 | [Button barricade](mx0/button-guard.webp): Button/coil reads at travel; impact collapses to small rings. |
| enemy:sock-skipper | 3 | 2 | 3 | 4 | 6 | 3.6 | [Pocket skip](mx0/sock-skipper.webp): Sock silhouette travels, but pink fabric at impact competes with body. |
| enemy:spool-ram | 3 | 2 | 3 | 4 | 6 | 3.6 | [Spring-loaded sweep](mx0/spool-ram.webp): Signature lunge reads; charge lacks a sustained telegraph. |
| enemy:needle-moth | 3 | 2 | 3 | 3 | 6 | 3.4 | [Needle canopy](mx0/needle-moth.webp): Thin pale needles disappear near impact; no clear three-strike sequence. |
| enemy:teacup-healer | 3 | 2 | 3 | 4 | 6 | 3.6 | [Careful refill](mx0/teacup-healer.webp): Spoon and cup are legible in travel; healing has little secondary depth. |
| enemy:kettle-knight | 4 | 3 | 4 | 5 | 6 | 4.4 | [Mirror polish](mx0/kettle-knight.webp): Shield/steam identity reads; the attack is still one sparse arc. |
| enemy:yarn-giant | 4 | 3 | 4 | 5 | 6 | 4.4 | [Loomfall](mx0/yarn-giant.webp): Heavy pose carries the cue; sparse pale thread fan lacks a broad impact. |
| enemy:binding-thread | 3 | 2 | 3 | 4 | 6 | 3.6 | [Woven snare](mx0/binding-thread.webp): Narrow thread travel, low ring impact; signature resembles basic. |
| enemy:practice-cushion | 2 | 2 | 3 | 3 | 6 | 3.2 | [Cushion tumble](mx0/practice-cushion.webp): Basic is nearly absent; signature pad silhouette reads but is flat. |
| enemy:pollen-scout | 4 | 3 | 4 | 5 | 6 | 4.4 | [Thread garden](mx0/pollen-scout.webp): Green petal travel distinguishes it, but impact reduces to a small ring. |
| enemy:rain-spool | 3 | 2 | 3 | 4 | 6 | 3.6 | [Cloudburst](mx0/rain-spool.webp): Blue lines/raindrops readable in travel, sparse impact. |
| enemy:crumb-sentinel | 4 | 3 | 4 | 5 | 6 | 4.4 | [Sugar burst](mx0/crumb-sentinel.webp): Crown travel is distinctive, with few supporting layers. |
| enemy:pantry-crown | 5 | 3 | 4 | 6 | 6 | 4.8 | [Empty banquet](mx0/pantry-crown.webp): Cup/crown signature is clear; only modest settling depth. |
