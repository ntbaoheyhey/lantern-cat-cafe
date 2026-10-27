import type { V2Store } from "./game.ts";
import { V2Error } from "./http.ts";

export function actionRequestId(body: Record<string, unknown>): string | undefined {
  const id = body.requestId;
  if (id === undefined) return undefined;
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new V2Error("invalid_request");
  return id.toLowerCase();
}
export async function priorAction(store: V2Store, player: string, route: "v2-craft" | "v2-boss-fight", requestId: string | undefined, intent: object) {
  if (!requestId) return null;
  const result = await store.actionResult(player, route, requestId, intent);
  if (result?.error === "invalid_request") throw new V2Error("invalid_request");
  return result;
}
