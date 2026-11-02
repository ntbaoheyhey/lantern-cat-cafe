"""Audit retained T001 evidence; never reclassify a stale literal criterion as passed."""
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
STATE = Path('/Users/bao/taskbar-hero/.codex-orchestrator')


def entries(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from entries(child)
    elif isinstance(value, list):
        for child in value:
            yield from entries(child)


queue = json.loads((STATE / 'queue.json').read_text())
tasks = {item['id']: item for item in entries(queue) if 'id' in item}
task = tasks['T001']
assert task['acceptance_criteria'][1] == 'Deployed assets equal main 74d60da build'
assert tasks['T014']['status'] == 'done' and 'T014' in task['depends_on']
audit = json.loads((HERE / 'receipt-audit.json').read_text())
assert audit['status'] == 'PASS' and audit['t001AcceptanceStatus'] == 'BLOCKED'
assert len(audit['verifierHeads']) == 4 and len(audit['historicalReceipts']) == 66
assert audit['currentReceiptFilesVerified'] == 120 and audit['currentLegacyLiveExit'] == 0
assert sorted(audit['currentPhasedViewports']) == ['1280x720', '1600x900']
assert audit['currentLiveEqualsHistoricalBASE0'] is False and audit['newSuitesRun'] == []
refs = subprocess.check_output(
    ['git', 'ls-remote', 'origin', 'refs/heads/main', 'refs/heads/ai/codex-mega-ledger'],
    cwd=ROOT, text=True)
checkpoint = '57f287c276f1401d69d195394d69c8bfea8f6641'
assert audit['currentMain'] + '\trefs/heads/main' in refs
ledger = next(line.split()[0] for line in refs.splitlines() if line.endswith('refs/heads/ai/codex-mega-ledger'))
subprocess.run(['git', 'merge-base', '--is-ancestor', checkpoint, ledger], cwd=ROOT, check=True)
before = json.loads((STATE / 'verification/T001-attempt3/readonly-state-before.json').read_text())
after = {path: hashlib.sha256((STATE / path).read_bytes()).hexdigest() for path in before}
assert before == after
criteria = []
for index, criterion in enumerate(task['acceptance_criteria']):
    status = 'UNSATISFIED_AS_WRITTEN' if index == 1 else 'PASS_RETAINED_EVIDENCE'
    criteria.append({'criterion': criterion, 'status': status})
    print(f'{index + 1}. {status}: {criterion}')
result = {
    'status': 'BLOCKED', 'observedAt': datetime.now(timezone.utc).isoformat(),
    'criteria': criteria,
    'blockingReason': 'Orchestrator must explicitly correct read-only T001 acceptance/dispatch; retained T014 evidence proves successor target only.',
    'approvedT014Target': audit['currentMain'], 'historicalBASE0': audit['historicalBASE0'],
    'publishedEvidenceCheckpoint': checkpoint, 'remoteLedgerCheckpoint': ledger,
    'receiptAudit': 'receipt-audit.json', 'sourceSuitesRerun': [], 'freshLiveProbe': False,
    'readonlyStateUnchanged': True, 'readonlyStateSha256': after,
    'remoteRefs': refs.splitlines(), 'followups': [],
}
payload = json.dumps(result, indent=2) + '\n'
(HERE / 'acceptance.json').write_text(payload)
(STATE / 'verification/T001-attempt3/acceptance.json').write_text(payload)
print('PASS read-only GOAL/queue unchanged; no new suites, live probes, or release actions')
print('OVERALL BLOCKED: evidence audit passed; literal deployment criterion remains unresolved')
