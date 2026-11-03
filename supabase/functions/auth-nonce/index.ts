// POST /functions/v1/auth-nonce -> { nonce }
import { handler, issueNonce, json, pgStore } from "../_shared/auth.ts";

// Initialize inside the request boundary so missing configuration becomes a
// CORS-readable 503 instead of preventing the worker from starting.
Deno.serve(handler(async (req) => json(req, await issueNonce({ store: pgStore() })), { nonce: true }));
