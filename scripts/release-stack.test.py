"""Release barriers must fail before any network mutation or merge."""
import datetime as dt
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('release', Path(__file__).with_name('release-stack.py'))
release = importlib.util.module_from_spec(spec); spec.loader.exec_module(release)


class ReleaseTests(unittest.TestCase):
    def test_capacity_needs_current_provider_proof(self):
        now = dt.datetime(2026, 11, 4, tzinfo=dt.timezone.utc).timestamp()
        valid = {'status': 'OK', 'rateLimited': False, 'source': 'authenticated-provider-usage',
                 'deploymentsUsed': 79, 'remaining': 1, 'checkedAt': '2026-11-04T00:00:00Z'}
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / 'capacity.md'
            def write(data): p.write_text('Historical CAPACITY OK is insufficient.\n```release-capacity\n' + json.dumps(data) + '\n```\n')
            write(valid); self.assertEqual(release.capacity(p, now)['deploymentsUsed'], 79)
            for key, value in [('status', 'BLOCKED'), ('rateLimited', True), ('source', 'git-activity-count'),
                               ('deploymentsUsed', 80), ('deploymentsUsed', True), ('remaining', 0), ('remaining', True),
                               ('checkedAt', '2026-11-03T00:00:00Z'), ('checkedAt', '2026-11-05T00:00:00Z')]:
                with self.subTest(key=key, value=value):
                    write({**valid, key: value})
                    with self.assertRaises(ValueError): release.capacity(p, now)
            p.write_text('CAPACITY OK\n')
            with self.assertRaises(ValueError): release.capacity(p, now)
            write(valid); p.write_text(p.read_text() * 2)
            with self.assertRaises(ValueError): release.capacity(p, now)

    def test_capacity_cannot_be_reused_after_a_merge(self):
        data = {'checkedAt': '2026-11-04T00:00:00Z'}
        checked = release.utc(data['checkedAt'])
        with patch.object(release, 'capacity', return_value=data):
            self.assertEqual(release.fresh_capacity('unused', checked - 1), data)
            for previous in (checked, checked + 1):
                with self.assertRaises(ValueError): release.fresh_capacity('unused', previous)

    def test_receipt_requires_both_exact_heads_and_real_asset_hashes(self):
        head = 'a' * 40; step = {'pr': 271}
        valid = {'head': head, 'complete': True, 'A': {'head': head, 'score': 95, 'failures': []},
                 'B': {'head': head, 'score': 95, 'failures': []},
                 'assets': {'/assets/index-example.js': 'b' * 64, '/assets/index-example.css': 'c' * 64}}
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / '271.json'; p.write_text(json.dumps(valid)); release.receipt(step, temp, head)
            for changed in [{'head': 'd' * 40}, {'assets': {}}, {'complete': False},
                            {'B': {'head': head, 'score': 91, 'failures': []}},
                            {'A': {'head': head, 'score': 99, 'failures': ['contrast']}}]:
                p.write_text(json.dumps({**valid, **changed}))
                with self.assertRaises(ValueError): release.receipt(step, temp, head)

    def test_execute_requires_second_explicit_flag_before_calls(self):
        from argparse import Namespace
        with patch.object(release, 'command') as command:
            with self.assertRaises(ValueError): release.execute(Namespace(confirm_release=None), {'candidate': 'a' * 40})
            command.assert_not_called()

    def test_wrong_order_and_integration_branch_are_never_released(self):
        steps = [{'pr': pr, 'branch': 'ai/card-' + str(pr), 'head': 'a' * 40, 'specs': ['e2e/ui/firstplay.spec.ts']} for pr in release.ORDER + [272]]
        steps[-1]['role'] = 'gallery-refresh'
        manifest = {'candidate': 'a' * 40, 'releaseTree': 'a' * 40, 'steps': steps}
        release.validate_manifest(manifest)
        steps[0]['branch'] = 'ai/codex-stack-tip'
        with self.assertRaises(ValueError): release.validate_manifest(manifest)
        steps[0]['branch'] = 'ai/card'; steps[0]['pr'] = 244
        with self.assertRaises(ValueError): release.validate_manifest(manifest)


if __name__ == '__main__': unittest.main()
