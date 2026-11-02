"""Read-only, offline T012 inherited originality checks; source strings stay in memory."""
import csv
import datetime
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(sys.argv[1]).resolve()
EVIDENCE = Path(__file__).resolve().parent
BASE = sys.argv[2] if len(sys.argv) > 2 else 'HEAD^'
ARCHIVE = Path('/Users/bao/Downloads/TBH_Index_Research_2026-10-31-2.zip')
PREFIX = 'TBH_Index_Research/'
EXPECTED_SHA = 'e38f4222cd4cc248087030c14d9993622a45c7807b35e2e55364a9ab617199da'
NOTES = ROOT / 'reports/reference-notes'
EXPECTED = {'README.md','items.md','stats.md','skills-runes.md','pets.md','ui-layout.md'}
failures = []

def check(condition, description):
    print(('PASS ' if condition else 'FAIL ') + description)
    if not condition: failures.append(description)

def run(command):
    r = subprocess.run(command, cwd=ROOT, capture_output=True)
    print('COMMAND', ' '.join(command), 'exit=' + str(r.returncode))
    return r

def tokens(s):
    return re.findall(r"[a-z0-9]+(?:['’-][a-z0-9]+)*", s.casefold())

check(hashlib.sha256(ARCHIVE.read_bytes()).hexdigest() == EXPECTED_SHA, 'valid reference archive identity')
z = zipfile.ZipFile(ARCHIVE)
check(z.testzip() is None, 'reference archive CRC')
check({p.name for p in NOTES.iterdir()} == EXPECTED, 'five system notes and source index; Markdown only')
for name in sorted(EXPECTED):
    text = (NOTES/name).read_text()
    check(len(text)>1200 and 'Evidence' in text if name!='README.md' else len(text)>1200, 'substantive note '+name)
    check(not re.search(r'^\s*\|',text,re.M) and '![' not in text and '<img' not in text and 'data:image' not in text, 'no source tables/images '+name)
    if name not in ('README.md','ui-layout.md'):
        check(bool(re.search(r'\d[\d,.]*–\d',text)), 'numeric envelopes present '+name)

pages=[]
for member in z.namelist():
    if '/pages/' in member and member.endswith('.json'):
        d=json.loads(z.read(member))
        if isinstance(d,dict): pages.append((member,d))
cast=json.loads(z.read(PREFIX+'cast-cases.json'))
names={d['skill'] for d in cast}
for member,d in pages:
    title=d.get('title','')
    if any(x in member for x in ('wiki__gear__','wiki__materials__')):
        names.add(re.split(r'\s*\(',title)[0].strip())
    if 'wiki__runes__' in member:
        names.add(re.split(r'\s*#',title)[0].strip())
    for link in d.get('links',[]):
        if re.search(r'/wiki/(?:gear|materials)/[^/]+$',link.get('url','')):
            label=link.get('text','').strip()
            if 2 <= len(label.split()) <= 7 and not re.search(r'[\d\n→›]',label):
                names.add(label)
pet_page=next(d for member,d in pages if member.endswith('/wiki__pets.json'))
pet_lines=pet_page['text'].splitlines()
for i,line in enumerate(pet_lines):
    if line.startswith('Defeat ') and i: names.add(pet_lines[i-1].strip())
# Generic one-word vocabulary and ordinary stat labels are not proprietary names.
names={s for s in names if len(s.split())>=2 and len(s)>6}
sentences=set()
source_grams=set()
for member,d in pages:
    for paragraph in d.get('text','').splitlines():
        if len(paragraph)<80 or '\t' in paragraph: continue
        for sentence in re.split(r'(?<=[.!?])\s+',paragraph):
            ts=tokens(sentence)
            if len(ts)>=12:
                sentences.add(sentence.strip())
                source_grams.update(tuple(ts[i:i+12]) for i in range(len(ts)-11))

tracked=run(['git','ls-files','-z'])
paths=[ROOT/p.decode() for p in tracked.stdout.split(b'\0') if p]
# Keep all third-party search patterns in memory; never extract source prose/media.
for label, patterns in [('entity-names', names), ('descriptions', sentences)]:
    command = ['git', 'grep', '-I', '-i', '-l', '-F']
    if label == 'entity-names': command += ['-w']
    command += ['-f', '-', '--', '.']
    result = subprocess.run(command, cwd=ROOT, input=('\n'.join(sorted(patterns))+'\n').encode(), capture_output=True)
    print('patterns', label, len(patterns), 'matched_files', len(result.stdout.splitlines()))
    if result.stdout: print(result.stdout.decode()[:3000])
    check(result.returncode == 1, 'repository-wide literal scan: '+label+' absent')

overlaps=[]
for path in paths:
    try: content=path.read_text()
    except (UnicodeError,OSError): continue
    ts=tokens(content)
    for i in range(len(ts)-11):
        if tuple(ts[i:i+12]) in source_grams:
            overlaps.append(str(path.relative_to(ROOT)))
            break
print('normalized_source_12word_fragments',len(source_grams),'matched_files',len(overlaps))
for p in overlaps: print('overlap_path',p)
check(not overlaps, 'no normalized 12-word source prose overlap across tracked text')

hashes_by_size=defaultdict(set)
for info in z.infolist():
    if not info.is_dir() and info.file_size:
        hashes_by_size[info.file_size].add(hashlib.sha256(z.read(info.filename)).hexdigest())
archive_matches=[]
for path in paths:
    if path.is_file() and path.stat().st_size in hashes_by_size:
        if hashlib.sha256(path.read_bytes()).hexdigest() in hashes_by_size[path.stat().st_size]:
            archive_matches.append(str(path.relative_to(ROOT)))
print('tracked_files',len(paths),'archive_members',len(z.infolist()),'archive_hash_matches',len(archive_matches))
for p in archive_matches: print('archive_match_path',p)
check(not archive_matches,'no byte-identical source files or media in tracked tree')


new_config = (ROOT/'packages/game-rules/src/config.ts').read_text().split('  originalEconomy: {',1)[1].split('  /** Gear slots',1)[0]
labels = re.findall(r"name: '([^']+)'",new_config)
descriptions = re.findall(r"description: '([^']+)'",new_config)
notes_text = '\n'.join(p.read_text() for p in NOTES.glob('*.md'))
archive_text = '\n'.join(z.read(n).decode('utf-8',errors='ignore') for n in z.namelist() if n.endswith(('.json','.csv','.txt','.md','.html')))
for corpus_name, corpus in [('notes',notes_text),('archive',archive_text)]:
    normalized = ' '.join(tokens(corpus))
    label_matches = sum(bool(re.search(r'(?<!\w)' + re.escape(' '.join(tokens(label))) + r'(?!\w)', normalized)) for label in labels)
    description_matches = sum(' '.join(tokens(description)) in normalized for description in descriptions)
    print(corpus_name,'new_labels',len(labels),'label_matches',label_matches,'new_descriptions',len(descriptions),'description_matches',description_matches)
    check(label_matches == 0 and description_matches == 0,'original labels and descriptions absent from '+corpus_name)
notes_tokens=tokens(notes_text)
notes_grams={tuple(notes_tokens[i:i+12]) for i in range(len(notes_tokens)-11)}
changed=run(['git','diff','--name-only',BASE,'--']).stdout.decode().splitlines()
note_overlap=[]
for relative in changed:
    path=ROOT/relative
    try: content=path.read_text()
    except (UnicodeError,OSError): continue
    ts=tokens(content)
    if any(tuple(ts[i:i+12]) in notes_grams for i in range(len(ts)-11)):
        note_overlap.append(relative)
print('normalized_note_12word_matches',len(note_overlap))
check(not note_overlap,'no copied reference-note prose in changed files')
check(not any(p.startswith('.github/') or '/migrations/' in p for p in changed),'no workflow or migration changes')
check(run(['git','diff','--check',BASE,'--']).returncode==0,'diff whitespace check')
print('HEAD',run(['git','rev-parse','HEAD']).stdout.decode().strip())
print('RESULT', 'FAIL' if failures else 'PASS', 'failures',len(failures))
sys.exit(bool(failures))
