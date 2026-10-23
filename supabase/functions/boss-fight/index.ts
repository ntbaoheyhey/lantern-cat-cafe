// POST /functions/v1/boss-fight {} -> BossFightResult
import { serveGame } from "../_shared/game-server.ts";

Deno.serve(serveGame("boss-fight"));
