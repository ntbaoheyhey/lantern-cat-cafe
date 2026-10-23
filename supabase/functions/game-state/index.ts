// POST /functions/v1/game-state {} -> ServerState
import { serveGame } from "../_shared/game-server.ts";

Deno.serve(serveGame("game-state"));
