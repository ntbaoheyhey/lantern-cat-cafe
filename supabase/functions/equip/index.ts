// POST /functions/v1/equip { gearId } -> ServerState
import { serveGame } from "../_shared/game-server.ts";

Deno.serve(serveGame("equip"));
