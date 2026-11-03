from pathlib import Path
import re,json,sys
root=Path(sys.argv[1]);overview=root/'docs/security-overview.md';text=overview.read_text();words=len(text.split())
try:
 assert 250<=words<1200,'overview word budget'
 required=['chain 43113','at most 24 hours','ten minute nonce','returns 429 with Retry-After','fails closed with 503','to 8,192','total body-read deadline to ten seconds','per-IP limits and human uniqueness remain gaps','PR #244 remains unmerged','UnsafeFunctionDownloadPathError','Partial files do not form a rollback bundle','NOT VERIFIED','Guest saves are editable browser data','not a mint/list/buy receipt','not a production penetration-test report']
 for claim in required:assert claim in text,'missing or contradicted boundary: '+claim
 for phrase in ['production security proven','fully audited','backup complete','real funds required','all rate limits deployed']:
  assert phrase not in text.lower(),'unsupported claim'
 auth=(root/'packages/auth/src/index.ts').read_text();http=(root/'supabase/functions/_shared/v2/http.ts').read_text();budgets=(root/'supabase/functions/_shared/v2/budgets.ts').read_text()
 assert re.search(r'NONCE_TTL_SECONDS\s*=\s*10\s*\*\s*60',auth),'nonce source value changed'
 assert re.search(r'MAX_SESSION_TTL_SECONDS\s*=\s*24\s*\*\s*60\s*\*\s*60',auth),'session source value changed'
 assert 'const MAX_BODY_BYTES = 8192' in http,'body source value changed'
 assert 'status: 503' in budgets and 'status: 429' in budgets,'budget source values changed'
 deployment=json.loads((root/'packages/chain/deployments/43113.json').read_text())
 for key in ['RelicNFT','RelicMarket']:assert deployment[key] in text,'deployment address mismatch'
 cases=[('supabase/tests/src/auth-wrappers.test.ts','a used challenge cannot be replayed: second use is 401 invalid_nonce'),('supabase/tests/src/request-budgets-hardening.test.ts','a genuinely missing v2_take_budgets RPC returns HTTP 503 and never runs game work'),('supabase/tests/v2/security-races.test.ts','replaying a funded craft must reuse the original result rather than charge again'),('supabase/tests/v2/security-races.test.ts','does not cache failed mutations and rolls back SQL exceptions with their spend'),('supabase/tests/src/relic-recovery.test.ts',"state and a concurrent forge cannot sign a replacement before the creator's second chain read")]
 for file,case in cases:
  assert case in text,'required evidence quote absent'
  assert re.search(r'\bit\(\s*[\"\']'+re.escape(case)+r'[\"\']',(root/file).read_text()),'quoted test absent or not an ordinary test'
 files=['docs/security-overview.md','docs/auth.md','docs/abuse-controls.md','docs/security-review-2026-10.md','docs/security-test-matrix.md','docs/judge-walkthrough.md','reports/n2-security-docs.md'];links=0
 for file in files:
  p=root/file;s=p.read_text()
  for url in re.findall(r'\]\(([^)]+)\)',s):
   if url.startswith(('http:','https:','#')):continue
   target=url.split('#')[0]
   assert (p.parent/target).exists(),'missing local link in '+file
   links+=1
 assert 'Security in 2 minutes' in (root/'docs/judge-walkthrough.md').read_text(),'judge security block absent'
 assert 'Historical result' in (root/'docs/security-test-matrix.md').read_text(),'historical count mislabeled'
 assert 'Current source status' in (root/'docs/abuse-controls.md').read_text(),'current abuse status absent'
 print(json.dumps(dict(status='PASS',words=words,localLinks=links,quotedOrdinaryCases=len(cases),sourceBoundaries=4,backendIdentity='NOT_VERIFIED',backup='BLOCKED',scope='docs only')))
except AssertionError as error:
 print('DOC_VALIDATION_FAIL',str(error));sys.exit(1)
