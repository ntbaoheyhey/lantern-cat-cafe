import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';

/** Read exact, non-overlapping GLB buffer views. Never rewrite the source model. */
export function modelRanges(bytes) {
  assert.equal(bytes.readUInt32LE(0),0x46546c67);
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  let document,bin;
  for(let at=12;at<bytes.length;) {
    const length=bytes.readUInt32LE(at),type=bytes.readUInt32LE(at+4);
    assert(at+8+length<=bytes.length);
    if(type===0x4e4f534a)document=JSON.parse(bytes.subarray(at+8,at+8+length).toString());
    if(type===0x004e4942){assert(!bin);bin={offset:at+8,length};}
    at+=8+length;
  }
  assert(document&&bin);
  const ranges=(document.bufferViews??[]).filter(view=>(view.buffer??0)===0&&!view.extensions&&view.byteLength>=128)
    .map(view=>({offset:bin.offset+(view.byteOffset??0),length:view.byteLength}));
  ranges.sort((a,b)=>a.offset-b.offset||b.length-a.length);
  const selected=[];let end=bin.offset;
  for(const range of ranges){
    assert(Number.isSafeInteger(range.offset)&&Number.isSafeInteger(range.length));
    assert(range.offset>=bin.offset&&range.offset+range.length<=bin.offset+bin.length);
    if(range.offset<end)continue;
    selected.push(range);end=range.offset+range.length;
  }
  return selected;
}

/** Deduplicate identical views across assets; residual headers, JSON and padding remain exact. */
export function packModelDictionary(assets) {
  const groups=new Map();
  for(const [index,asset] of assets.entries()){
    if(asset.mime!=='model/gltf-binary')continue;
    for(const range of modelRanges(asset.bytes)){
      const bytes=asset.bytes.subarray(range.offset,range.offset+range.length);
      const hash=createHash('sha256').update(bytes).digest('hex');
      let group=groups.get(hash);
      if(!group){group={bytes,uses:[]};groups.set(hash,group);}
      assert(group.bytes.equals(bytes),'Hash collision');
      group.uses.push({index,...range});
    }
  }
  const packed=assets.map(asset=>({...asset,bytes:Buffer.from(asset.bytes),patches:[]}));
  const dictionary=[],entries=[];let offset=0;
  for(const [hash,group] of groups){
    const size=gzipSync(group.bytes,{level:9}).length;
    // Fixed conservative metadata allowance; every trial/result is retained.
    if(group.uses.length<2||size*(group.uses.length-1)<=64+group.uses.length*32)continue;
    const id=entries.length;
    entries.push({offset,length:group.bytes.length,sha256:hash,uses:group.uses.length});
    dictionary.push(group.bytes);offset+=group.bytes.length;
    for(const use of group.uses){packed[use.index].bytes.fill(0,use.offset,use.offset+use.length);packed[use.index].patches.push([use.offset,id]);}
  }
  for(const asset of packed)asset.patches.sort((a,b)=>a[0]-b[0]);
  return {assets:packed,dictionary:Buffer.concat(dictionary),entries};
}

/** Shared browser/Node restoration. Typed-array copies avoid per-byte main-thread loops. */
export function restoreModelDictionary(bytes,patches,dictionary,entries) {
  let end=0;
  for(const [offset,id] of patches){
    const entry=entries[id];
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(id)||!entry
      ||!Number.isSafeInteger(entry[0])||!Number.isSafeInteger(entry[1])||entry[0]<0||entry[1]<0
      ||entry[0]+entry[1]>dictionary.length||offset<end||offset+entry[1]>bytes.length)throw Error('Invalid model dictionary');
    bytes.set(dictionary.subarray(entry[0],entry[0]+entry[1]),offset);end=offset+entry[1];
  }
  return bytes;
}
