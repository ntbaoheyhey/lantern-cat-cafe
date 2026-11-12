export async function chainPost<T>(name: string, token: string, body: unknown = {}): Promise<T> {
  const base = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/,'');
  if (!base) throw new Error('Service unavailable.');
  const response = await fetch(`${base}/functions/v1/${name}`, {method:'POST',
    headers:{'content-type':'application/json',authorization:`Bearer ${token}`}, body:JSON.stringify(body), signal:AbortSignal.timeout(25_000)});
  if (!response.ok) throw new Error(response.status === 401 ? 'Sign in again.' : 'Service unavailable.');
  return response.json() as Promise<T>;
}
