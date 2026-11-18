# Tool Failure Report (QA/Audit)
- T-M5 (trial-metrics.mjs):
  - Command: node /Users/bao/taskbar-hero-chain/tools/cardrpg-big/skills-v5/trial-metrics.mjs --trials "/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/short-gop-r1/"
  - Stderr: node:internal/modules/run_main:107
    triggerUncaughtException(
    ^

AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

  assert(out)

    at file:///Users/bao/taskbar-hero-chain/tools/cardrpg-big/skills-v5/trial-metrics.mjs:6:38
    at ModuleJob.run (node:internal/modules/esm/module_job:561:25)
    at async node:internal/modules/esm/loader:647:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: undefined,
  expected: true,
  operator: '==',
  diff: 'simple'
}

Node.js v24.22.2
