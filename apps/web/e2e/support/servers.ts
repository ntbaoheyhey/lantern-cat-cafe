/** Shared by the project config and build guard. Invalid ports fail before servers start. */
function port(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be an integer port from 1 to 65535; received ${raw}`);
  }
  return value;
}

export const classicPort = port('E2E_PORT_CLASSIC', 4173);
export const v2Port = port('E2E_PORT_V2', 4174);
if (classicPort === v2Port) throw new Error('E2E_PORT_CLASSIC and E2E_PORT_V2 must differ');
export const classicURL = `http://localhost:${classicPort}`;
export const v2URL = `http://localhost:${v2Port}`;
