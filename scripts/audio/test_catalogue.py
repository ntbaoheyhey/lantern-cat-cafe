import unittest
import runpy
from pathlib import Path
MODULE=runpy.run_path(str(Path(__file__).with_name('catalogue-candidates.py')))
field_block=MODULE['field_block']
preferred_encodings=MODULE['preferred_encodings']


class LicenceScope(unittest.TestCase):
    def test_other_works_cannot_inherit_main_work_licence(self):
        page='<div class="field field-name-field-art-files"><div><a href="own.ogg">Own</a></div></div><div class="comments"><a href="unrelated.mp3">Other work</a></div>'
        block=field_block(page,'field-name-field-art-files')
        self.assertIn('own.ogg',block)
        self.assertNotIn('unrelated.mp3',block)

    def test_missing_licence_field_is_rejected(self):
        with self.assertRaises(ValueError):
            field_block('<p>Comment mentions CC0</p>','field-name-field-art-licenses')

    def test_drupal_alternate_encoding_not_counted_twice(self):
        links=['https://example.org/song.mp3','https://example.org/song_0.ogg','https://example.org/song_1.ogg','https://example.org/other_0.ogg']
        self.assertEqual(preferred_encodings(links),['https://example.org/other_0.ogg','https://example.org/song_0.ogg','https://example.org/song_1.ogg'])


if __name__=='__main__':unittest.main()
