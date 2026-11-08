# Candidate pilot harness correction

Attempt 1 completed and checkpointed all 31 baseline cells, with exact A4 TRAIN parity, then failed before the smooth candidate could run. Vite had already stripped TypeScript when the normal-order plugin replaced the module with the isolated TypeScript source. The parser rejected `import type`.

Correction: run the same registered substitution in an `enforce: pre` plugin, before TypeScript transformation. No candidate source, seed, case, outcome or numerical definition changes. Resume from the original checkpoint and preserve attempt-1.log. The coordinator allocates the next unused attempt filename rather than overwriting logs. Fresh acceptance seeds remain unused.
