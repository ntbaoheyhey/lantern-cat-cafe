# Ledger preview policy

Updated 2026-11-02T01:01:08+07:00. This maintenance change applies only to the existing ledger branch, ai/codex-mega-ledger. Its Git checkpoint pushes are for reports and evidence, so they do not need application preview deployments.

The existing apps/web/vercel.json uses ignoreCommand to skip non-main builds. The authenticated Vercel dashboard still lists ledger PR241 under two projects. An ignored build does not establish that no deployment was requested, and old documentation's claim that a PR can never use quota is too broad. No quota-consumption amount is inferred from the dashboard.

Added git.deploymentEnabled with exactly one false entry for ai/codex-mega-ledger. The official [Vercel Git Configuration documentation](https://vercel.com/docs/project-configuration/git-configuration) states that unspecified branches remain enabled. There are no wildcard rules. All existing headers and ignoreCommand are preserved byte-for-byte when the new git field is removed. No application code, environment value, account setting or graded BASE0 source was changed. Main and product branches retain their prior behavior and gates.

Validation: JSON parses; the policy has exactly the intended branch key; all other config is unchanged; the immutable BASE0 config is unchanged. Public HEAD requests compare only the existing security-header values and record match booleans in verification.json. No browser settings were saved and no deployment was triggered manually.

This prevents an unnecessary class of future auto-deployment requests according to the documented configuration. It does not reset the current quota, certify provider enforcement before observation, or authorize a merge. The current BASE0 deployment hold remains. To reverse, remove only this git.deploymentEnabled entry from the ledger config; preserve the remaining configuration. Final ledger delivery still receives its own required review before any main merge.

Follow-up before CXN3 grading: its current docs/runbook.md still says a PR never uses quota, and docs/go-live.md still names project web and treats ignoreCommand as proof of no preview. Reconcile those claims with the two actual Taskbar projects and documented deployment policy when integrating CXN3 onto actual main. No CXN3 source branch is changed by this maintenance card.
