// POST /functions/v1/v2-equip { itemId, slot } -> ServerStateV2
import { serveV2 } from "../_shared/v2/server.ts";

Deno.serve(serveV2("v2-equip"));
