// A-owned transport only. Restored files are byte-identical before GLTFLoader sees them.
export function shuffleModelBytes(input,width,delta=false){
 const result=new Uint8Array(input.length);let output=0;
 for(let lane=0;lane<width;lane++){
  let previous=0;
  for(let i=lane;i<input.length;i+=width){
   const value=input[i];result[output++]=delta?(value-previous+256)%256:value;previous=value;
  }
 }
 return result;
}
export function restoreModelBytes(input,encoding){
 if(![4,8].includes(encoding.width))throw Error('Unknown geometry transport');
 const result=new Uint8Array(input.length);let source=0;
 for(let lane=0;lane<encoding.width;lane++){
  let previous=0;
  for(let i=lane;i<input.length;i+=encoding.width){
   const value=encoding.delta?(input[source++]+previous)%256:input[source++];result[i]=value;previous=value;
  }
 }
 return result;
}
