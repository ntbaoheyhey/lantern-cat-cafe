"""Re-scan flagged files for exact match triage. Raw values stay in process memory.

No raw detector output, match, credential, token or credential fingerprint is written.
The all-file redacted scan remains the scope evidence; this is contextual follow-up.
"""
import collections,datetime,json,pathlib,re,subprocess,tempfile,time
root=pathlib.Path(__file__).resolve().parents[3]
path=root/'reports/v4-ship/S1/secrets-working.json'
original=json.loads(path.read_text());files=sorted({r['file'] for r in original['findings']})
started=time.monotonic()
source_lines={}
def source_line(file,line):
    if file not in source_lines:source_lines[file]=(root/file).read_text().splitlines()
    return source_lines[file][line-1]
public_key_process=subprocess.run(['cast','wallet','private-key','--mnemonic','test test test test test test test test test test test junk'],capture_output=True,text=True)
public_anvil_key=public_key_process.stdout.strip() if public_key_process.returncode==0 else ''
scenario_keys={}
def scenario_match(file,value):
    if not file.startswith('reports/') or not file.endswith('.json'):return False
    if file not in scenario_keys:
        scenario_keys[file]=set(re.findall(r'"key"\s*:\s*"([A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)+/\d+)"',(root/file).read_text()))
    values=scenario_keys[file]
    return value in values or any(value in key for key in values)
inventory=json.loads((root/'reports/v3-shell/b2/ECONOMY-LEVER-INVENTORY.json').read_text())['rows']
inventory_keys={row['key'] for row in inventory if row.get('path') and isinstance(row.get('line'),int)}
with tempfile.TemporaryDirectory(prefix='v4ship-candidates-') as temporary:
    for name in files:
        link=pathlib.Path(temporary)/name;link.parent.mkdir(parents=True,exist_ok=True);link.symlink_to(root/name)
    command=['gitleaks','dir','--follow-symlinks',temporary,'--no-banner','--no-color','--redact=0','--log-level=fatal','--report-format=json','--report-path=-','--ignore-gitleaks-allow']
    process=subprocess.Popen(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    print(json.dumps({'pid':process.pid,'files':len(files)}),flush=True)
    output,diagnostics=process.communicate()
    if process.returncode not in [0,1]:raise RuntimeError('Candidate scan failed; diagnostic output suppressed')
    findings=json.loads(output or b'[]');safe=[];counts=collections.Counter()
    for finding in findings:
        file=finding['File'].removeprefix(temporary+'/').removeprefix(str(root)+'/');secret=finding.get('Secret','');match=finding.get('Match','');reason=None
        if finding['RuleID']=='generic-api-key':
            if re.fullmatch(r'0x[0-9a-fA-F]{40}',secret):reason='public EVM address, not private signing material'
            elif re.fullmatch(r'[a-zA-Z0-9_.\-/]+',secret) and '/' in secret and re.search(r'\bkey"?\s*:',match) and scenario_match(file,secret):reason='validated JSON simulation scenario identifier with a terminal numeric seed'
            elif re.fullmatch(r'[a-f0-9]{64}',secret) and (re.search(r'[^"\n]+\.(?:ts|tsx|css|json|sql)"\s*:',match) or re.search(r'tokens?Sha256"\s*:',match)):reason='SHA256 source/render manifest digest'
            elif re.fullmatch(r'[A-Z][A-Z_0-9]{10,}',secret):reason='environment variable identifier, not its value'
            elif re.search(r'YOUR_|<[^>]+>|replace|change.me|example|openssl',secret,re.I):reason='documentation placeholder or key-generation instruction'
            elif file in ['packages/auth/src/index.test.ts','supabase/tests/src/auth-wrappers.test.ts','supabase/tests/src/malformed.test.ts'] and re.search(r'unit|test',secret,re.I):reason='explicit synthetic unit-test signing fixture'
            elif file in ['contracts/test/Deploy.t.sol','docs/deploy.md','docs/onboarding-test.md'] and public_anvil_key and secret==public_anvil_key:reason='public deterministic Anvil account zero, verified from the public default mnemonic'
            elif file in ['contracts/script/DeployChainV2.s.sol','contracts/test/DeployChainV2.t.sol','packages/chain/src/index.ts'] and secret=='RelicMarketV2':reason='public Solidity contract type identifier'
            elif file=='reports/v3-shell/b2/ECONOMY-LEVER-INVENTORY.json' and secret in inventory_keys and re.fullmatch(r'[A-Za-z][\w]*(?:\.[A-Za-z][\w]*)+',secret):reason='economy configuration property path with source-file and line references'
            elif file=='reports/cardrpg-big2/stage/CHECKPOINT.md' and secret[0:1].isdigit() and 'Twenty natural replays' in source_line(file,finding['StartLine']):reason='reviewed numeric test-count prose'
            elif file=='reports/v3-shell/b2/UI-ART-NOTES.md' and secret=='primary/secondary':reason='reviewed UI button category prose'
            if reason is None and re.fullmatch(r'[a-f0-9]+',secret):
                # The generic rule can capture only a suffix of a full digest.
                line=source_line(file,finding['StartLine'])
                digests=re.findall(r'"[^"\n]+\.(?:ts|tsx|css|json|sql)"\s*:\s*"([a-f0-9]{64})"',line)
                if any(secret in digest for digest in digests):reason='partial generic-rule match inside a complete source SHA256 digest'
        safe.append({'file':file,'line':finding['StartLine'],'endLine':finding['EndLine'],'type':finding['RuleID'],'commit':'','classification':'false-positive' if reason else 'unresolved','reason':reason or 'requires exact contextual review',**({} if reason else {'shape':{'length':len(secret),'hex64':bool(re.fullmatch('[0-9a-fA-F]{64}',secret)),'slashes':secret.count('/'),'fieldNames':re.findall(r'([A-Za-z][A-Za-z_0-9-]*)["\s]*[:=]',match)[:3],'syntheticTestWords':bool(re.search('test|unit|fixture|example',secret,re.I))}})})
        counts[reason or 'unresolved']+=1
    result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'purpose':'exact-match contextual review of all initially flagged current files','scanner':'gitleaks 8.30.1','files':len(files),'elapsedSeconds':round(time.monotonic()-started,2),'findings':safe,'counts':dict(counts),'unresolved':counts['unresolved'],'pass':counts['unresolved']==0 and len(safe)==original['rawFindingCount']}
    (root/'reports/v4-ship/S1/secrets-working-triage.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='findings'}),flush=True)
