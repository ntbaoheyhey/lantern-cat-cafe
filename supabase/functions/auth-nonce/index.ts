// POST /functions/v1/auth-nonce -> { nonce }
import { handler, issueNonce, json, pgStore } from "../_shared/auth.ts";

const store = pgStore();

Deno.serve(handler(async () => json(await issueNonce({ store }))));
