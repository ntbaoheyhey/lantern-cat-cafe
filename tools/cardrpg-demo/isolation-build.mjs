import {createRequire} from 'node:module';import {resolve} from 'node:path';
const require=createRequire(resolve('apps/web/package.json')),{build}=await import(require.resolve('vite'));
Object.assign(process.env,{VITE_GAME_V2:'1',VITE_ALLOW_MOCK_AUTH:'1',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''});
const source=process.env.CARDRPG_RULES;
const alias=source?[{find:/^@taskbar-hero\/game-rules\/src\//,replacement:source+'/'},{find:'@taskbar-hero/game-rules/cardrpg',replacement:source+'/cardrpg/index.ts'}]:[];
for(const [name,root]of [['before','/Users/bao/taskbar-hero-turn3d-polish/apps/web'],['after',resolve('apps/web')]])await build({root,envDir:false,resolve:name==='after'?{alias}:{},build:{outDir:'/tmp/cardrpg-flag-'+name,emptyOutDir:true},logLevel:'warn'});
