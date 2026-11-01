"""Read-only catalog contracts against original sources and git evidence."""
from collections import Counter
import json
from pathlib import Path
import re
import unittest

from catalog import ART, CONTENT, ROOT, content_ids, git, manifest, matrices, palette_literals, proposal_rows, source_paths, text


class CatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads(text('docs/art/manifest.json'))
        cls.slots = cls.manifest['slots']

    def test_unique_slot_ids_and_portable_placeholder_paths(self):
        self.assertEqual(len(self.slots), len({s['id'] for s in self.slots}))
        pending = [s['path'] for s in self.slots if s['status'] == 'placeholder']
        self.assertEqual(len(pending), len({p.lower() for p in pending}))
        for s in self.slots:
            self.assertIn(s['status'], ('existing', 'placeholder', 'new'))
            self.assertGreater(s['width'], 0)
            self.assertGreater(s['height'], 0)
            self.assertGreater(s['frames'], 0)
            self.assertFalse(Path(s['path']).is_absolute())
            self.assertNotIn('..', Path(s['path']).parts)
            if s['status'] == 'placeholder':
                self.assertFalse((ROOT / s['path']).exists(), s['id'])

    def test_every_proposal_id_covered_or_explicit_pet_alias(self):
        proposed = {row[0] for row in proposal_rows()}
        ids = {s['id'] for s in self.slots}
        aliases = self.manifest['proposalPetAliases']
        self.assertEqual(proposed - ids, set(aliases))
        self.assertEqual(len(aliases), 6)
        self.assertTrue(set(aliases.values()) <= ids)

    def test_twelve_complete_pet_reservations(self):
        for index in range(1, 13):
            for kind, size, frames in [('portrait', 96, 1), ('locked', 96, 1), ('idle', 48, 4)]:
                row = next(s for s in self.slots if s['id'] == f'pet.cafe-{index:02}.{kind}')
                self.assertEqual((row['width'], row['height'], row['frames'], row['status']), (size, size, frames, 'placeholder'))
        self.assertEqual(sum(s['id'].startswith('pet.') for s in self.slots), 36)

    def test_all_skills_passives_rune_tiers_and_materials(self):
        counts = Counter(s['category'] for s in self.slots)
        self.assertEqual(counts['skill icon'], 12)
        self.assertEqual(counts['skill effect sheet'], 12)
        self.assertEqual(counts['passive icon'], 18)
        self.assertEqual(counts['rune'], 24)
        self.assertEqual(counts['rune twin overlay'], 6)
        self.assertEqual(counts['material'], 8)
        for kind in ('purr', 'hiss', 'mew', 'chirp', 'trill', 'yowl'):
            for tier in range(1, 5):
                row = next(s for s in self.slots if s['id'] == f'rune.{kind}.t{tier}')
                self.assertEqual(row['frames'], 4 if tier == 4 else 1)

    def test_all_map_chapter_states_and_decor(self):
        for chapter in range(1, 6):
            actual = {s['id'] for s in self.slots if s['id'].startswith(f'map.ch{chapter}.')}
            self.assertEqual(actual, {f'map.ch{chapter}.{state}' for state in ('done', 'current', 'locked', 'boss', 'decor')})
        rows = {s['id']: s for s in self.slots}
        self.assertEqual(rows['compendium.chapter.ch2']['selector'], 'kitchen')
        self.assertEqual(rows['compendium.chapter.ch4']['selector'], 'basement')

    def test_existing_animation_lengths_are_not_assumed_uniform(self):
        rows = {s['id']: s for s in self.slots}
        self.assertEqual(rows['monster.cucumber-scare']['frames'], 23)
        self.assertEqual(rows['monster.bathtub-tyrant']['frames'], 23)
        self.assertEqual(rows['monster.laser-dot-phantom']['frames'], 23)
        self.assertEqual(rows['monster.shadow-crow']['frames'], 13)
        self.assertEqual(rows['monster.dust-bunny']['frames'], 14)

    def test_every_current_compendium_content_id(self):
        actual = {s['id'] for s in self.slots}
        weapons, armor, accessories = content_ids()
        self.assertTrue({'compendium.' + row[0] for row in weapons + armor + accessories} <= actual)
        self.assertEqual(sum(s['category'] == 'compendium gear' for s in self.slots), 155)
        for prefix, file in [('compendium.material.', 'materials.ts'), ('compendium.', 'recipes.ts')]:
            ids = re.findall(r"\{ id: '([^']+)'", text(CONTENT + file))
            self.assertTrue({prefix + id_ for id_ in ids} <= actual)
        roster = text(CONTENT + 'monsters.ts').split('const ROSTER:')[1].split('];')[0]
        names = re.findall(r"'([^']+)'", roster)
        ids = ['mon.' + '.'.join(re.sub(r'[^a-z0-9 ]', '', name.lower()).split()) for name in names]
        self.assertEqual(len(ids), 25)
        self.assertTrue({'compendium.' + id_ for id_ in ids} <= actual)

    def test_existing_source_selectors_and_native_dimensions(self):
        for row in self.slots:
            if row['status'] != 'existing':
                continue
            with self.subTest(id=row['id']):
                source = text(row['path'])
                if row['selector'] == 'svg':
                    self.assertIn(f'viewBox="0 0 {row["width"]} {row["height"]}"', source)
                else:
                    for token in row['selector'].split(':'):
                        self.assertIn(token, source)
                maps = matrices(source)
                if row['selector'] in maps:
                    self.assertEqual((row['width'], row['height']), (maps[row['selector']]['width'], maps[row['selector']]['height']))

    def test_complete_inventory_and_provenance_with_real_git_hashes(self):
        files = json.loads(text('docs/art/inventory.json'))['files']
        self.assertEqual([r['path'] for r in files], source_paths())
        provenance = text('docs/art/PROVENANCE.md')
        for row in files:
            self.assertIn('| ' + row['path'] + ' |', provenance)
            self.assertIn(row['firstCommit'], provenance)
            self.assertEqual(git('rev-parse', row['firstCommit'] + '^{commit}'), row['firstCommit'])
        names = [p.name for p in (ROOT / 'docs/art').iterdir() if p.name.lower() == 'provenance.md']
        self.assertEqual(names, ['PROVENANCE.md'])
        self.assertIn('[provenance.md](PROVENANCE.md)', provenance)
        self.assertIn('unknown', provenance)

    def test_locked_palette_comes_from_existing_sources_and_matches_style(self):
        colors = json.loads(text('tools/art/palette.json'))['colors']
        evidence = set(palette_literals(text('apps/web/src/theme.css')))
        for path in source_paths():
            if not path.endswith('.png'):
                evidence.update(palette_literals(text(path)))
        self.assertTrue(set(colors) <= evidence, set(colors) - evidence)
        style = text('docs/art/STYLE.md')
        for color in colors:
            self.assertIn(color, style)

    def test_manifest_generated_bytes_match_committed_contract(self):
        self.assertEqual(self.manifest, manifest())


if __name__ == '__main__':
    unittest.main()
