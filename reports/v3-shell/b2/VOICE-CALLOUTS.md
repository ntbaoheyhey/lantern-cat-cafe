# Skill and ultimate callout script

Draft script for local free synthesis. Timing contract and recogniser evidence are delivered by V. Every cat has a basic attack, two active skills and an ultimate. Elite/boss signature mechanics are represented as basic/signature plus charge/release variants. Regular enemies are included as well so the adapter never falls back to a cat voice.

| Unit | Character | Skill 1 | Skill 2 | Skill 3 | Ultimate |
|---|---|---|---|---|---|
| mochi | Steady door keeper | Knock knock! | Warm welcome! | Stay behind me! | Shields up! |
| soot | Dry, mischievous ash reader | Cocoa spark! | Found you! | Light the wick! | Lights out! |
| clover | Patient garden healer | Leaf tap! | Let it steep! | Fresh and clear! | Bloom again! |
| panko | Warm, stubborn counter guardian | Pan ready! | Bread cover! | Send it back! | Oven door! |
| mallow | Impatient fire whisk | Whisk flare! | Split the flame! | Sugar burns! | Burn bright! |
| sorrel | Measured moon brewer | Moon spoon! | Cool down! | Share my shield! | One more cup! |
| biscuit | Gruff, dependable baker | Roll out! | Make some room! | Last crumb! | Bakers march! |
| inkcap | Whispering woodland trickster | Ink thread! | Quiet now! | Only paper! | Sweet dreams! |
| cinnamon | Bright, reassuring comfort brewer | Spice pinch! | Take a sip! | Fresh start! | Back for seconds! |
| brioche | Formal night watch guardian | Bell patrol! | Borrow my blanket! | Collar straight! | Stars protect us! |
| velvet | Elegant candle thief | Silk touch! | Catch the candle! | Borrowed flame! | Curtain falls! |
| marigold | Eager dawn gardener | Seed stitch! | Ring the garden! | Time to prune! | First tea bloom! |
| spool-ram | Enemy growl/roar | Make way! | Ram ahead! | — | Full charge! |
| kettle-knight | Enemy growl/roar | Iron strike! | Steam shield! | — | Boil over! |
| pollen-scout | Enemy growl/roar | Seed shot! | Rise, little roots! | — | Pollen storm! |
| crumb-sentinel | Enemy growl/roar | Crust strike! | Sugar burst! | — | All to crumbs! |
| yarn-giant | Enemy growl/roar | Thread strike! | Loom fall! | — | Tangle them! |
| rain-spool | Enemy growl/roar | Rain strike! | Cloud burst! | — | Storm breaks! |
| pantry-crown | Enemy growl/roar | Empty plates! | Take their feast! | — | Mine to claim! |
| button-guard | Enemy growl/roar | Button cut! | Brace up! | — | Hold the line! |
| sock-skipper | Enemy growl/roar | Quick step! | Yours is mine! | — | Catch me! |
| needle-moth | Enemy growl/roar | Needle shot! | Needle rain! | — | Sharp wings! |
| teacup-healer | Enemy growl/roar | Cup tap! | Refill! | — | Full cups! |
| binding-thread | Enemy growl/roar | Tie tight! | Knot them! | — | Bound fast! |
| practice-cushion | Enemy growl/roar | Soft bump! | Try again! | — | Good practice! |

## Q5 measured wording updates

Current playback metadata remains apps/web/src/audio/voice-callouts.json. All variants of a line share the text below.

| Cue | Text | Minimum recognised accuracy |
|---|---|---:|
| voice.clover.ult.charge | Watch the flowers bloom! | 0.75 |
| voice.clover.ult.release | Bloom again! | 1.0 |
| voice.mallow.ult.charge | Burn! | 1.0 |
| voice.sorrel.ult.charge | One more cup! | 1.0 |
| voice.biscuit.ult.charge | Move with me! | 1.0 |
| voice.cinnamon.ult.charge | Back! | 1.0 |
| voice.velvet.ult.charge | Raise the curtain! | 1.0 |
| voice.button-guard.skill.enemy:button-guard:basic | Button cut! | 1.0 |
| voice.button-guard.ult.charge | Hold the line! | 1.0 |
| voice.spool-ram.ult.charge | Full! | 1.0 |
| voice.needle-moth.ult.charge | Wings sharp and ready! | 1.0 |
| voice.teacup-healer.skill.enemy:teacup-healer:basic | Cup tap! | 0.5 |
| voice.teacup-healer.skill.enemy:teacup-healer | Fill it up! | 0.6666666666666667 |
| voice.teacup-healer.ult.charge | Fill the cup! | 1.0 |
| voice.kettle-knight.ult.charge | Steam is rising! | 1.0 |
| voice.kettle-knight.ult.release | Let off steam! | 1.0 |
| voice.binding-thread.ult.release | Hold them tight! | 1.0 |
| voice.practice-cushion.ult.charge | Good luck to you! | 0.75 |
| voice.pollen-scout.ult.release | A storm of seeds! | 1.0 |
| voice.crumb-sentinel.ult.charge | All together now! | 1.0 |
| voice.pantry-crown.ult.charge | All is mine! | 1.0 |
