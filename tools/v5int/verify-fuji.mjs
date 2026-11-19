#!/usr/bin/env node
/** Verify existing public Fuji deployments. No deploy, wallet, account or API key. */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../contracts',import.meta.url));
const nft='0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D',yarn='0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b';
// Original constructor inputs from docs/deploy.md and the committed V2 broadcast.
const deployments=[
 ['RelicNFT',nft,'constructor(address,address,string)',['0x2Bba9a48F7F79d99154108A28d32f1a21d17055c','0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000','https://example.com/relics/{id}.json']],
 ['RelicMarket','0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93','constructor(address)',[nft]],
 ['YarnToken',yarn,'constructor(address)',['0x91D3fbE33D83BfC4104405ed0AfC243a3ef7D203']],
 ['RelicMarketV2','0x6Fe415494D791E63d87613B8FBCdbb24743C7eb4','constructor(address,address,address,uint256)',[nft,yarn,'0x2Bba9a48F7F79d99154108A28d32f1a21d17055c','500']],
 ['SeasonRewards','0x29d4F1b9d4577BF2bA5c6bdB849CA5fdc9bd6c11','constructor(address,address,address,uint256,uint256)',[yarn,'0x91D3fbE33D83BfC4104405ed0AfC243a3ef7D203','0x5eC838ECcc4eC6B6707b6479394E9E6CEEA0B000','32000000000000000000','1794182400']],
];
for(const [name,address,signature,values] of deployments){
 const encoded=spawnSync('cast',['abi-encode',signature,...values],{cwd:root,encoding:'utf8'});
 if(encoded.status!==0)throw Error(`Cannot encode ${name} constructor: ${encoded.stderr}`);
 const result=spawnSync('forge',['verify-contract',address,`src/${name}.sol:${name}`,'--root','.',
  '--chain','43113','--compiler-version','v0.8.24+commit.e11b9ed9','--evm-version','cancun',
  '--verifier','custom','--verifier-url','https://api.routescan.io/v2/network/testnet/evm/43113/etherscan',
  '--constructor-args',encoded.stdout.trim(),'--watch'],{cwd:root,encoding:'utf8',timeout:120000});
 process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');
 if(result.status!==0){process.exitCode=1;console.error(`${name}: verification incomplete. No deployment was attempted.`);}
 if(/(?:api.?key|account).*(?:required|missing|invalid)|(?:required|missing|invalid).*(?:api.?key|account)/i.test(`${result.stdout}\n${result.stderr}`)){
  console.error('Verifier requires an account/key; owner action required.');break;
 }
}
