"""Integrity boundaries for an archive that restores executable local sources."""
import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('rehearsal', Path(__file__).with_name('repo-functions-rehearsal.py'))
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)


class ArchiveTests(unittest.TestCase):
    def test_deterministic_export_and_exact_restore(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            a, b = root / 'a.tgz', root / 'b.tgz'
            module.export_archive(a); module.export_archive(b)
            self.assertEqual(a.read_bytes(), b.read_bytes())
            manifest, files = module.verified_members(a)
            self.assertIn('supabase/config.toml', files)
            self.assertIn('supabase/functions/auth-nonce/deno.json', files)
            self.assertIn('apps/web/src/api/MockGameApiV2.ts', files)
            self.assertIn('apps/web/public/relics/1.json', files)
            self.assertTrue(any(p.endswith('/deno.lock') for p in files))
            self.assertTrue(manifest['functionsWithoutTrackedDenoLock'])
            result = module.restore_archive(a, root / 'restored')
            self.assertEqual(result['filesVerified'], len(files))
            for path, (data, _) in files.items():
                self.assertEqual((root / 'restored' / path).read_bytes(), data)
            with self.assertRaises(ValueError): module.restore_archive(a, root / 'restored')

    def test_rejects_traversal_symlinks_and_duplicates_before_writes(self):
        for kind in ('traversal', 'symlink', 'duplicate'):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as temp:
                archive = Path(temp) / 'unsafe.tgz'
                with tarfile.open(archive, 'w:gz') as tar:
                    row = tarfile.TarInfo('../escape' if kind == 'traversal' else 'source')
                    if kind == 'symlink': row.type = tarfile.SYMTYPE; row.linkname = '/tmp/escape'
                    tar.addfile(row, io.BytesIO())
                    if kind == 'duplicate': tar.addfile(row, io.BytesIO())
                with self.assertRaises(ValueError): module.restore_archive(archive, Path(temp) / 'restored')
                self.assertFalse((Path(temp) / 'restored').exists())

    def test_env_and_cli_state_are_outside_allowlist(self):
        for name in ('.env', 'supabase/.temp/access-token', 'supabase/functions/.env', '.git/config', 'apps/web/.env.local'):
            self.assertFalse(module.selected(name))


if __name__ == '__main__': unittest.main()
