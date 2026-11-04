# Auth-nonce availability rehearsal — historical502 cause remains unproven

The integrated candidate contains #269's undeployed edge source. This session made **zero live nonce probes**. Earlier two200responses are retained historical availability evidence, not a root-cause diagnosis or deployed-source identity proof.

| Scenario | Reproduced result |
| --- | --- |
| Missing service configuration at cold module load | Prior #269 regression reproduced startup failure before its lazy initialization repair. Current harness registers the worker with config absent; POST returns generic503/Retry-After30/no-store/usable CORS; supplying the synthetic local config permits200without changing source. |
| Rejected DB request: AbortError, TimeoutError, network error | Each returns generic503with no database details and exactly one RPC attempt; regression test per rejection. No unsupported gateway502 claim. |
| DB upstream budget rejection |503fail-closed; no nonce is issued and no local limit is bypassed. This does not test a provider's global limiter. |
| OPTIONS during indefinitely pending DB |204with expected CORS without issuing a DB call; unlisted origins do not receive an allow-origin header. |
| Indefinitely pending upstream | Request remains pending until the synthetic dependency resolves. No independent edge deadline exists in this handler; a gateway timeout/cold-start failure remains unproven and uncorrected. |
| Native cold start / Supabase gateway502 | NOT REPRODUCED: native runtime unavailable. Missing env is a plausible reproduced source failure, not proof of the historical incident. |

New auth-nonce-failure-modes.test.ts adds7cases; with existing endpoint/auth availability tests the builder passes42/42. The exported and restored exact tooling source passes all588Supabase tests. [Builder log](local-system-final/nonce-builder.log), [restore log](repo-restore/f1a3388/3.log). The client nonce retries and persistent wallet notice remain consistent with #269: signed verification is never retried; Retry-After stops immediate retries; guest play stays available.

No backend change was deployed. A complete supported deployed source/dependency/import-map backup and native local restoration still gate #269's edge deployment and #244. No attempt was made to bypass UnsafeFunctionDownloadPathError.
