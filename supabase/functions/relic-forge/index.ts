// POST /functions/v1/relic-forge {} -> ForgeResult
import { serveGame } from "../_shared/game-server.ts";

Deno.serve(serveGame("relic-forge"));
