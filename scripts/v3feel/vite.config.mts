import base from '../../apps/web/vite.config.ts';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
// Public units also contains promotional assets. Only registered actors need portraits.
const units=JSON.parse(readFileSync(resolve(root,'assets/cardrpg-look/spine/slots.json'),'utf8')).units as {id:string}[];
const aliases=new Map<string,string>(units.flatMap(({id}):[string,string][]=>{
  if(existsSync(resolve(root,'apps/web/public/units',id,'portrait.webp')))return [];
  const face=resolve(root,'assets/cardrpg-a6/illustrations',`${id}-face.webp`);
  const source=existsSync(face)?face:resolve(root,'assets/cardrpg-a6/illustrations',`${id}.webp`);
  if(!existsSync(source))throw Error(`Missing registered actor portrait: ${id}`);
  return [[`/units/${id}/portrait.webp`,source]];
}));

// Demo-only entry and bundled fonts; the shipping application config is unchanged.
export default {
  ...base,
  envDir: false,
  plugins: [...(base.plugins ?? []), {
    name: 'v3-review-entry',
    configureServer(server: any) {
      server.middlewares.use((request: any, response: any, next: () => void) => {
        if (request.url === '/' || request.headers.host === 'localhost:5990') {
          // B's fixture binds its SIWE domain/CORS policy to this loopback origin.
          const path = request.url === '/' ? '/?demo=1&squad=1&cardrpg2=1&a6=1' : request.url;
          response.writeHead(302, {Location: `http://127.0.0.1:5990${path}`});
          response.end();
        } else if (aliases.has(request.url)) {
          response.writeHead(200, {'Content-Type': 'image/webp'});
          response.end(readFileSync(aliases.get(request.url)!));
        } else next();
      });
    },
    transformIndexHtml(html: string) {
      return html.replace(/<link\b[^>]*https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>/g, '');
    },
  }],
};
