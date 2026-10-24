// Type-only stand-ins so tsc can follow imports into the Deno-only auth Edge Function code that
// auth-wrappers.test.ts loads. At runtime the test replaces both (see that file).
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): unknown;
};

declare module "@supabase/supabase-js" {
  export function createClient(
    url: string,
    key: string,
    options?: unknown,
  ): { rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }> };
}
