# Equipment save validation repair
REFERENCE: ../validation/i-save-before-tests.log, ../validation/i-save-after-tests.log, save-validation.json

The template validator required starter equipment keys even after a valid unequip or transfer. It now validates the dynamic map, slot identities, collected owners, inventory references and one-owner-per-instance constraint. The current version remains 0.6.0 and the existing 0.5 migration accepts an empty equipment map.

53 focused cases pass, including complete unequips, transfers, current/migrated empty maps and malformed slot references. Before/after automatic routes each win 18/50, 44/50 and 30/50 across chapters1–3. All 150 route outcomes and 450 encounter action/round/log records match. Timing fields are excluded from the deterministic comparison. Raw file and source hashes are retained in save-validation.json.
