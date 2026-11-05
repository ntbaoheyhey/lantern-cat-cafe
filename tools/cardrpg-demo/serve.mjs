// Loopback-only preview with credentials disabled; never writes gameplay storage.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const web=resolve(process.env.CARDRPG_SOURCE||'.','apps/web');
const req=createRequire(resolve(web,'package.json'));
Object.assign(process.env,{VITE_GAME_V2:'1',VITE_ALLOW_MOCK_AUTH:'1',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''});
const {createServer}=await import(req.resolve('vite'));
const server=await createServer({root:web,envDir:false,server:{host:'127.0.0.1',port:Number(process.env.CARDRPG_PORT||5520),strictPort:true}});
await server.listen();server.printUrls();
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.close();process.exit(0)});
