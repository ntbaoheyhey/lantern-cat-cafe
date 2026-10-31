#!/usr/bin/env node
// Read-only Fuji proof. No account, wallet, environment secrets, or write actions.
import { runCli } from '../packages/chain/src/proof/cli.mjs';
process.exitCode = await runCli(process.argv.slice(2));
