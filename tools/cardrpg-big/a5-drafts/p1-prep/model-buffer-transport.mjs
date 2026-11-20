// Lossless GLB BIN transport. JSON, headers, padding and all decoded content stay exact.
export function shuffleModelBytes(input,encoding){
 const result=new Uint8Array(input),end=encoding.offset+encoding.length;let output=encoding.offset;
 for(let lane=0;lane<encoding.width;lane++){
  let previous=0;
  for(let i=encoding.offset+lane;i<end;i+=encoding.width){
   const value=input[i];result[output++]=encoding.delta?(value-previous+256)%256:value;previous=value;
  }
 }
 return result;
}
export function restoreModelBytes(input,encoding){
 if(![4,8].includes(encoding.width)||!Number.isSafeInteger(encoding.offset)||!Number.isSafeInteger(encoding.length)
  ||encoding.offset<0||encoding.length<0||encoding.offset+encoding.length>input.length)throw Error('Unknown geometry transport');
 const result=new Uint8Array(input),end=encoding.offset+encoding.length;let source=encoding.offset;
 for(let lane=0;lane<encoding.width;lane++){
  let previous=0;
  for(let i=encoding.offset+lane;i<end;i+=encoding.width){
   const value=encoding.delta?(input[source++]+previous)%256:input[source++];result[i]=value;previous=value;
  }
 }
 return result;
}
