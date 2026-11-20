// Local guest only. No credentials, publishing, remote services or saved-state reset.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const web=resolve(import.meta.dirname,'../apps/web');
const require=createRequire(resolve(web,'package.json'));
Object.assign(process.env,{VITE_GAME_V2:'1',VITE_ALLOW_MOCK_AUTH:'1',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''});
const {createServer}=await import(require.resolve('vite'));
const server=await createServer({root:web,envDir:false,server:{host:'127.0.0.1',port:5391,strictPort:true}});
await server.listen();server.printUrls();
console.log('Candidate build, not live. New guest with coach: http://127.0.0.1:5391/?demo#home (fresh browser profile). Skip coach: http://127.0.0.1:5391/?demo&coach=off#home. Existing saves and permanent dismissal are preserved.');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.close();process.exit(0);});
