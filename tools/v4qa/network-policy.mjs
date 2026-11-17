const readRpc=new Set(['eth_chainId','eth_blockNumber','eth_call','eth_getBalance','eth_getCode','eth_getLogs','eth_getTransactionByHash','eth_getTransactionReceipt','eth_getTransactionCount','eth_gasPrice','eth_feeHistory','eth_estimateGas','eth_getBlockByNumber','eth_getBlockByHash','net_version','web3_clientVersion']);

export function requestAllowed({url,method,body,local,allowGuestTx}){
  let u;try{u=new URL(url);}catch{return false;}
  if(['data:','blob:'].includes(u.protocol))return true;
  if(local){
    const own=['127.0.0.1','localhost'].includes(u.hostname)&&['6200','6201','6202','6203'].includes(u.port);
    const font=method==='GET'&&u.protocol==='https:'&&['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname);
    if(!own&&!font)return false;
  }else if(u.protocol!=='https:')return false;
  if(['GET','HEAD','OPTIONS'].includes(method))return true;
  if(allowGuestTx)return true;
  if(method!=='POST')return false;
  let data;try{data=typeof body==='string'?JSON.parse(body):body;}catch{return false;}
  const calls=Array.isArray(data)?data:[data];
  return calls.length>0&&calls.every(x=>x&&typeof x==='object'&&readRpc.has(x.method));
}
