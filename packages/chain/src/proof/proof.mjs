/** Read-only proof logic. The injected client needs only public viem read actions. */
export const FUJI_CHAIN_ID = 43113;
export const TARGETS = {
  RelicNFT: '0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D',
  RelicMarket: '0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93',
};
export const EXPLORER = 'https://testnet.snowtrace.io';
const hasCode = (code) => !!code && code !== '0x';
export const json = (value) => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2);

// Walk opcodes, skipping PUSH payloads. Require a selector comparison, not an arbitrary
// substring (which might be in metadata, a constant, or another PUSH's payload).
export function selectorChecks(abi, bytecode, toFunctionSelector) {
  let hex = bytecode.slice(2).toLowerCase();
  const metadataBytes = Number.parseInt(hex.slice(-4), 16);
  const metadataStart = hex.length - 4 - metadataBytes * 2;
  if (metadataStart >= 0 && /^a[0-9a-f]/.test(hex.slice(metadataStart))) hex = hex.slice(0, metadataStart);
  const instructions = [];
  for (let i = 0; i < hex.length;) {
    const op = Number.parseInt(hex.slice(i, i + 2), 16);
    const size = op >= 0x60 && op <= 0x7f ? op - 0x5f : 0;
    instructions.push({ op, data: hex.slice(i + 2, i + 2 + size * 2) });
    i += 2 + size * 2;
  }
  const compared = new Set(instructions.flatMap((item, i) =>
    item.op >= 0x60 && item.op <= 0x63 && instructions[i + 1]?.op === 0x14 ? [`0x${item.data.padStart(8, '0')}`] : []));
  const functions = abi.filter((item) => item.type === 'function').map((item) => {
    const selector = toFunctionSelector(item).toLowerCase();
    return { function: item.name, selector, present: compared.has(selector) };
  });
  return {
    ok: functions.length > 0 && functions.every((item) => item.present), functions,
    method: 'Every ABI function selector must appear as an opcode-aligned PUSH1–PUSH4 (zero-padded) followed by EQ in runtime code. This is static compatibility evidence, not source or behavior verification; proxies are not resolved.',
  };
}

export function formatEvent(log, contract) {
  if (log.blockNumber == null || !log.transactionHash || log.logIndex == null || !log.args) {
    throw new Error('Incomplete event returned by RPC');
  }
  const ids = log.args.ids ?? [log.args.relicId ?? log.args.tokenId ?? log.args.id];
  if (ids.some((id) => id == null)) throw new Error(`Missing token id in ${log.eventName}`);
  return {
    contract, event: log.eventName,
    category: log.eventName.startsWith('Transfer') ? 'Transfer' : log.eventName === 'Bought' ? 'Sold' : log.eventName,
    block: log.blockNumber.toString(), txHash: log.transactionHash, logIndex: log.logIndex,
    tokenIds: ids.map(String), explorer: `${EXPLORER}/tx/${log.transactionHash}`,
    args: log.args,
  };
}

// First block with code, using historical eth_getCode. A provider without history
// fails clearly instead of silently presenting an incomplete event search as proof.
async function deploymentBlock(client, address, head) {
  let low = 0n;
  let high = head;
  while (low < high) {
    const mid = (low + high) / 2n;
    if (hasCode(await client.getCode({ address, blockNumber: mid }))) high = mid;
    else low = mid + 1n;
  }
  return low;
}

export async function recentEvents(client, { address, abi, contract, head, start, chunkSize = 100n, concurrency = 8 }) {
  const names = contract === 'RelicNFT' ? ['TransferSingle', 'TransferBatch'] : ['Listed', 'Bought'];
  const events = abi.filter((item) => item.type === 'event' && names.includes(item.name));
  if (events.length !== names.length) throw new Error(`ABI missing required events for ${contract}`);
  const categories = contract === 'RelicNFT' ? ['Transfer'] : ['Listed', 'Sold'];
  const found = [];
  let toBlock = head;
  let fromBlock = head;
  if (chunkSize < 1n || !Number.isInteger(concurrency) || concurrency < 1) throw new Error('Invalid event scan bounds');
  while (toBlock >= start) {
    const ranges = [];
    for (let i = 0; i < concurrency && toBlock >= start; i++) {
      fromBlock = toBlock - chunkSize + 1n > start ? toBlock - chunkSize + 1n : start;
      ranges.push({ fromBlock, toBlock });
      toBlock = fromBlock - 1n;
    }
    // Independent, non-overlapping public reads. Bounded concurrency keeps a full-history
    // scan practical despite the public Fuji endpoint's 100-block query limit.
    const batches = await Promise.all(ranges.map((range) => client.getLogs({ address, events, ...range, strict: true })));
    found.push(...batches.flat().map((log) => formatEvent(log, contract)));
    if (categories.every((category) => found.filter((item) => item.category === category).length >= 20)) break;
  }
  found.sort((a, b) => BigInt(a.block) > BigInt(b.block) ? -1 : BigInt(a.block) < BigInt(b.block) ? 1 : b.logIndex - a.logIndex);
  return {
    fromBlock: fromBlock.toString(), toBlock: head.toString(), deploymentBlock: start.toString(),
    historyExhausted: fromBlock === start,
    groups: Object.fromEntries(categories.map((category) => [category, found.filter((item) => item.category === category).slice(0, 20)])),
  };
}

export function friendlyError(error) {
  const message = String(error?.shortMessage ?? error?.message ?? error);
  if (error?.status === 429 || error?.cause?.status === 429 || /rate.?limit|too many requests/i.test(message)) return 'RPC rate limited (HTTP 429): Fuji is NOT VERIFIED. Wait for the public endpoint limit to reset, then retry.';
  if (/timeout|timed out|abort/i.test(message + ' ' + error?.name)) return 'RPC timeout: Fuji could not be verified. Retry the command.';
  if (/fetch|network|ECONN|ENOTFOUND|HTTP request failed/i.test(message)) return 'RPC unreachable: Fuji could not be verified. Check network access and retry.';
  const detail = error?.details ? ` (${String(error.details).split('\n')[0]})` : '';
  return (message.split('\n')[0] + detail).slice(0, 300);
}

export async function proveChain({ client, abis, toFunctionSelector, rpc, now = () => new Date().toISOString() }) {
  const report = {
    status: 'NOT VERIFIED', generatedAt: now(), rpc, expectedChainId: FUJI_CHAIN_ID,
    chainId: null, block: null, checks: [], contracts: {},
    limitations: [
      'ERC-1155 has no name(), symbol(), or totalSupply() in this repo ABI; these are reported as NOT EXPOSED, not guessed.',
      'Transfer means TransferSingle/TransferBatch; Sold means Bought. At most 20 logs per category, newest first; fewer means history exhausted.',
      'This read-only snapshot does not prove the deployed web/server configuration, server signer custody, or an end-to-end player session.',
    ],
  };
  const check = async (name, action) => {
    try {
      const detail = await action();
      report.checks.push({ name, ok: true, detail });
      return true;
    } catch (error) {
      report.checks.push({ name, ok: false, detail: friendlyError(error) });
      return false;
    }
  };
  const chainOK = await check('Fuji chain id', async () => {
    report.chainId = await client.getChainId();
    if (report.chainId !== FUJI_CHAIN_ID) throw new Error(`Wrong chain id: expected 43113, received ${report.chainId}`);
    return report.chainId;
  });
  if (!chainOK) return report;
  if (!await check('Snapshot block', async () => {
    report.block = (await client.getBlockNumber({ cacheTime: 0 })).toString();
    return report.block;
  })) return report;
  const head = BigInt(report.block);
  for (const [name, address] of Object.entries(TARGETS)) {
    const abi = abis[name];
    const contract = report.contracts[name] = { address, explorer: `${EXPLORER}/address/${address}`, metadata: {} };
    let code;
    if (!await check(`${name}: code exists`, async () => {
      code = await client.getCode({ address, blockNumber: head });
      if (!hasCode(code)) throw new Error(`No contract code at ${address}`);
      contract.codeBytes = (code.length - 2) / 2;
      return `${contract.codeBytes} bytes`;
    })) continue;
    await check(`${name}: ABI selectors`, async () => {
      contract.selectors = selectorChecks(abi, code, toFunctionSelector);
      if (!contract.selectors.ok) throw new Error(`Selector mismatch: ${contract.selectors.functions.filter((f) => !f.present).map((f) => `${f.function} ${f.selector}`).join(', ')}`);
      return `${contract.selectors.functions.length} ABI function selectors present`;
    });
    for (const functionName of ['name', 'symbol', 'totalSupply', 'owner', 'signer']) {
      if (!abi.some((item) => item.type === 'function' && item.name === functionName && item.inputs.length === 0)) {
        contract.metadata[functionName] = { status: 'NOT EXPOSED', reason: 'No zero-argument getter in repo ABI' };
        continue;
      }
      contract.metadata[functionName] = { status: 'NOT VERIFIED' };
      await check(`${name}: ${functionName}()`, async () => {
        const value = await client.readContract({ address, abi, functionName, blockNumber: head });
        contract.metadata[functionName] = { status: 'VERIFIED', value };
        return value;
      });
    }
    if (name === 'RelicMarket') await check('Market uses this RelicNFT', async () => {
      const value = await client.readContract({ address, abi, functionName: 'relicNFT', blockNumber: head });
      contract.relicNFT = value;
      if (value.toLowerCase() !== TARGETS.RelicNFT.toLowerCase()) throw new Error(`Market points to a different RelicNFT: ${value}`);
      return value;
    });
  }
  // Complete the small contract checks before starting potentially long log scans.
  for (const [name, contract] of Object.entries(report.contracts)) {
    if (!contract.codeBytes) continue;
    await check(`${name}: recent events`, async () => {
      const start = await deploymentBlock(client, contract.address, head);
      contract.events = await recentEvents(client, { address: contract.address, abi: abis[name], contract: name, head, start });
      return Object.entries(contract.events.groups).map(([category, logs]) => `${category}: ${logs.length}`).join(', ');
    });
  }
  if (report.checks.every((item) => item.ok)) report.status = 'VERIFIED';
  return report;
}

const cell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
export function humanTable(report) {
  const lines = [
    `Fuji chain proof: ${report.status}`, '',
    '| Check | Result | Detail |', '| --- | --- | --- |',
    ...report.checks.map((item) => `| ${cell(item.name)} | ${item.ok ? 'PASS' : 'FAIL'} | ${cell(typeof item.detail === 'object' ? json(item.detail) : item.detail)} |`),
    '', '| Contract | Field | Value |', '| --- | --- | --- |',
  ];
  for (const [name, contract] of Object.entries(report.contracts)) {
    lines.push(`| ${name} | address | ${contract.explorer} |`);
    for (const [field, item] of Object.entries(contract.metadata)) lines.push(`| ${name} | ${field} | ${cell(item.value ?? item.status)} |`);
  }
  lines.push('', '| Contract | Event (category) | Block | Tx hash | Token IDs | Explorer |', '| --- | --- | --- | --- | --- | --- |');
  for (const [name, contract] of Object.entries(report.contracts)) {
    for (const logs of Object.values(contract.events?.groups ?? {})) {
      for (const log of logs) lines.push(`| ${name} | ${log.event} (${log.category}) | ${log.block} | ${log.txHash} | ${log.tokenIds.join(', ')} | ${log.explorer} |`);
    }
  }
  for (const limitation of report.limitations ?? []) lines.push('', limitation);
  return lines.join('\n');
}
