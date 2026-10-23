// POST /functions/v1/idle-claim {} -> ClaimResult
import { serveGame } from "../_shared/game-server.ts";

Deno.serve(serveGame("idle-claim"));
