function port(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`Invalid ${name}`);
  return value;
}
export const serverPort = port('E2E_PORT_SERVER', 4175);
export const apiPort = port('E2E_PORT_API', 4176);
export const serverURL = `http://localhost:${serverPort}`;
export const apiURL = `http://127.0.0.1:${apiPort}`;
