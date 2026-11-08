# Isolated E1 draft correction

Attempt1 found that the recovered `changeBuildV4` delegated an unknown row-placement cat ID to configureTeam, which silently ignores extra row-map entries. The durable draft now explicitly rejects non-team cats and invalid rows with the original state unchanged. No production source or registered combat candidate changed. Retry uses the same fixed checks and original day7 receipt; original failure remains preserved.
