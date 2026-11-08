import assert from 'node:assert/strict';

/** Keep Vite's real lazy boundaries inside a single offline HTML file. */
export function offlineModulePayload(output,css) {
  const chunks=output.filter(file=>file.type==='chunk');
  const entries=chunks.filter(file=>file.isEntry);assert.equal(entries.length,1);
  const known=new Set(chunks.map(file=>file.fileName));
  const modules=chunks.map(file=>{
    let code=file.code;
    for(const dependency of new Set([...file.imports,...file.dynamicImports])){
      assert(known.has(dependency),`External offline module: ${dependency}`);
      let replaced=false;
      for(const prefix of ['./',''])for(const quote of ['"',"'"]){
        const needle=quote+prefix+dependency+quote;
        if(code.includes(needle)){code=code.replaceAll(needle,quote+'@lantern/'+dependency+quote);replaced=true;}
      }
      // Rolldown may retain a self edge in metadata after lowering the import
      // to an in-module Promise. Actual self specifiers are still rewritten.
      assert(replaced || dependency === file.fileName,`Unresolved generated import ${file.fileName} -> ${dependency}`);
    }
    return {id:'@lantern/'+file.fileName,code,imports:file.imports,dynamicImports:file.dynamicImports};
  });
  return {entry:'@lantern/'+entries[0].fileName,modules,css};
}
