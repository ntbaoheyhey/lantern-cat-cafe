import{readFileSync,readdirSync,writeFileSync}from'node:fs';import{gzipSync}from'node:zlib';
const dir='apps/web/dist',files=readdirSync(dir+'/assets').filter(f=>f.endsWith('.js'));
const html=readFileSync(dir+'/index.html','utf8');const loaded=new Set();
function visit(name){if(loaded.has(name))return;loaded.add(name);const code=readFileSync(dir+'/assets/'+name,'utf8');for(const match of code.matchAll(/(?:from|import)\s*["']\.\/([^"']+\.js)["']/g))visit(match[1]);}
for(const m of html.matchAll(/(?:src|href)="\/assets\/([^"']+\.js)"/g))visit(m[1]);
const report={method:'Static import closure of product entry (dynamic imports excluded)',files:[...loaded].map(file=>({file,gzip:gzipSync(readFileSync(dir+'/assets/'+file)).length})),totalJsGzip:files.reduce((n,f)=>n+gzipSync(readFileSync(dir+'/assets/'+f)).length,0)};report.loadedJsGzip=report.files.reduce((n,f)=>n+f.gzip,0);writeFileSync(process.argv[2]??'reports/ui-v3/bundle.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
