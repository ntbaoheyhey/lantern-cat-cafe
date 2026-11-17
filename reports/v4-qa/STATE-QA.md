# QA state — 2026-11-17T01:45:59.901553+00:00
QA branch codex/v4-qa-2026-11-17; only QA-owned paths written; no deploy/public transactions.
Q0 complete LEARN/Q0.md. Latest accepted push recorded in work/v4qa/last-push.txt.
Runtime source b1e4398a8844fa51d2784760e92ed24528d13d2b; latest remote SHIP 52aaaba399a38cf76de68866af6c8e6ed972cfdd; runtime paths unchanged; runbook now adds names-only prerequisites.
Latest remote ART 1aaa5b181fcae67c57f41f0ea506b660d4b25baa; no integration rehearsal yet.
Both frozen installs PASS. Clone95,341paths; source race recovered with explicit fetch/checkout; evidence Q2/fresh-clone.json.
Forge local fixture build PASS, both submodules initialized; earlier missing-submodule suspicion disproved, no finding.
Own production preview6200/API6201/Anvil6202 ready; production PID13685, cold PID14675; source files in QA remain untouched.
Q1 first1440 completed7stages,18local receipts,11namedcontract/function types + native guest funding; Q1/q1-cold-1/results.json.
Battle3130ms and firstreceipt102179ms shared-machine, indicative. All observed transactions show fee/time/payer/link; local RPC verification passes.
Raw Q1 FAIL:29,653,929B at battle-entry (27/27images ready) exceeds8MB;6offscreen inputs need hidden-audio-details adjudication.
Initial metadata post-step omitted by QA fixture; preserve build1 and repair only after cold run; not established product defect.
Q2 source audit110env names/6dynamic sites;25deployedfunction handlers and paths exist. No Vercel API source; backend Supabase Edge.
QA-1 fixed 52aaaba399a38cf76de68866af6c8e6ed972cfdd; names-only table plus required/optional/fallback roles verified; Q2/required-env-recheck-52aaaba39.json.
SPONSOR_PRIVATE_KEY/GAME_SEED_SECRET optional with fallbacks; hosted secret state unknown; never inspect values.
Runbook says16Spool->12YARN, own decoded withdrawal claim6YARN; exact correction needs confirmed cap/context.
Public sponsor candidate:1.09999999999328AVAX vs two-wallet lowerbound1.10000000000672; Q2/public-readonly.json; no public writes.
Q2 local-checks.py written/syntax-checked, not yet run. Q3/Q5/Q6 not started; Q4/Q7 time-triggered.
Screenshots four<=200KB, raw video work/v4qa/q1-cold-1/videos; report budget checked each push.
## Closed checks
Q0 learning | abf6438866f0 / ART4109469bfef8 | PASS LEARN/Q0.md.
Q2 frozen installs | runtime source | PASS Q2/fresh-clone.json.
Q1 network policy | own fixture | PASS4safetytests Q1/network-policy-check.json.
Q1 local fixture Forge build | b1e4398a | PASS Q1/build-1.json; no submodule blocker.
Q2 source paths/env inventory | abf6438866f0 + b1e4398a | PASS inventory; QA-1 open.
Q2 QA-1 recheck | 52aaaba399a38cf76de68866af6c8e6ed972cfdd | fixed; unchanged runtime; names and fallback table now independently verified.
