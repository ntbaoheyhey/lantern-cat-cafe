// POST /functions/v1/auth-verify { message, signature } -> { token, playerId, wallet, expiresAt }
import { AuthError, authConfig, handler, json, pgStore, verifySignIn } from "../_shared/auth.ts";

const store = pgStore();
const config = authConfig();

Deno.serve(
  handler(async (req) => {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new AuthError("invalid_request");
    const { message, signature } = body as Record<string, unknown>;
    return json(await verifySignIn({ store, config }, { message, signature }));
  }),
);
