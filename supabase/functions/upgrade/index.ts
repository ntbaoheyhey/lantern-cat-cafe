// POST /functions/v1/upgrade { gearId } -> ServerState
import { serveGame } from "../_shared/game-server.ts";

Deno.serve(serveGame("upgrade"));
