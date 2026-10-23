// POST /functions/v1/relic-mint-report { nonce, txHash } -> ServerState
import { serveGame } from "../_shared/game-server.ts";

Deno.serve(serveGame("relic-mint-report"));
