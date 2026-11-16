"""Re-scan flagged files for exact match triage. Raw values stay in process memory.

No raw detector output, match, credential, token or credential fingerprint is written.
The all-file redacted scan remains the scope evidence; this is contextual follow-up.
"""
import collections,datetime,json,pathlib,re,subprocess,tempfile,time
root=pathlib.Path(__file__).resolve().parents[3]
path=root/'reports/v4-ship/S1/secrets-working.json'
original=json.loads(path.read_text());files=sorted({r['file'] for r in original['findings']})
started=time.monotonic()
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
        file=finding['File'].removeprefix(temporary+'/');secret=finding.get('Secret','');match=finding.get('Match','');reason=None
        if finding['RuleID']=='generic-api-key':
            if re.fullmatch(r'0x[0-9a-fA-F]{40}',secret):reason='public EVM address, not private signing material'
            elif re.fullmatch(r'[a-zA-Z0-9_.\-/]+',secret) and secret.count('/')>=2 and re.search(r'\d',secret) and re.search(r'"key"\s*:',match):reason='simulation scenario identifier with profile/seed segments'
            elif re.fullmatch(r'[a-f0-9]{64}',secret) and (re.search(r'"[^"\n]+\.(?:ts|tsx|css|json|sql)"\s*:',match) or re.search(r'"tokens?Sha256"\s*:',match)):reason='SHA256 source/render manifest digest'
            elif re.fullmatch(r'[A-Z][A-Z_0-9]{10,}',secret):reason='environment variable identifier, not its value'
            elif re.search(r'YOUR_|<[^>]+>|replace|change.me|example|openssl',secret,re.I):reason='documentation placeholder or key-generation instruction'
            elif file in ['packages/auth/src/index.test.ts','supabase/tests/src/auth-wrappers.test.ts','supabase/tests/src/malformed.test.ts'] and re.search(r'unit|test',secret,re.I):reason='explicit synthetic unit-test signing fixture'
            elif file=='contracts/test/Deploy.t.sol' and 'ANVIL_KEY_0' in match:reason='public deterministic Anvil key, restricted to local fixture tests'
            elif file in ['reports/cardrpg-big2/stage/CHECKPOINT.md','reports/v3-shell/b2/UI-ART-NOTES.md'] and not re.search(r'0x[a-fA-F0-9]{64}|eyJ',secret):reason='reviewed UI/test prose, not credential configuration'
        safe.append({'file':file,'line':finding['StartLine'],'endLine':finding['EndLine'],'type':finding['RuleID'],'commit':'','classification':'false-positive' if reason else 'unresolved','reason':reason or 'requires exact contextual review'})
        counts[reason or 'unresolved']+=1
    result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'purpose':'exact-match contextual review of all initially flagged current files','scanner':'gitleaks 8.30.1','files':len(files),'elapsedSeconds':round(time.monotonic()-started,2),'findings':safe,'counts':dict(counts),'unresolved':counts['unresolved'],'pass':counts['unresolved']==0 and len(safe)==original['rawFindingCount']}
    (root/'reports/v4-ship/S1/secrets-working-triage.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='findings'}),flush=True)
