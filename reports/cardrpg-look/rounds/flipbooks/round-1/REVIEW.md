# Original flipbooks, first inspection

Personally viewed smoke samples1/7/13/19/25/31 in smoke-review.png (768×544). This is Blender source art, not a game-runtime acceptance.

Five concrete flaws: (1) frame25 atx335–465,y348–443 reads as one compressed bean, not detached turbulent lobes; (2) frame31 atx566–700,y323–410 has visibly grainy outer alpha; (3) frame19 atx75–180,y376–443 has an overly cyan lower/right rim; (4) frame1 is too tiny to signal anticipation; (5) frame31 retains a near-solid central mass too late before the final fade.

Next round fixes the worst three: offset lobes by their age and wind, increase sample count and soften alpha by an explicit small compositor filter, lower/neutralize the cool rim. Also taper late density and improve early volume scale. Preserve the complete first-round frames/receipts before replacement. No beauty grade or runtime approval yet.
