#!/usr/bin/env python3
"""Catalogue official free sources. No model calls, login bypass, or audio export.

Kenney ZIPs are read in memory for their member/CC0 licence inventories. Research
does not retain archives. S2 downloads and processes selected members separately.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request,urlopen,build_opener,HTTPCookieProcessor
from urllib.parse import unquote
import http.cookiejar
import hashlib
import html as html_module
import io
import json
import re
import zipfile

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets/audio-sources'
EVIDENCE=OUT/'license-evidence'
EVIDENCE.mkdir(exist_ok=True)
CC0='https://creativecommons.org/publicdomain/zero/1.0/'
HEADERS={'User-Agent':'Mozilla/5.0'}
DATE='2026-11-13'

# Original cat recordings from different authors, plus complementary types.
FREESOUND=[
 ('Countrygirls13',763906,'cat-recording','meow'),('d.n.audio.uk',264507,'cat-recording','meow'),
 ('Vrymaa',756236,'cat-recording','meow'),('lextrack',333916,'cat-recording','meow'),
 ('PuzzlingGGG',859724,'cat-recording','meow'),('tuberatanka',110011,'cat-recording','meow'),
 ('Sadiquecat',814892,'cat-recording','meow'),('mars1312',656249,'cat-recording','meow'),
 ('Buskieboy',126150,'cat-recording','purr'),('Sadiquecat',750495,'cat-recording','hiss'),
 ('Zabuhailo',146963,'cat-recording','hiss'),('steprock',845517,'cat-recording','chirp'),
 ('Kerne_123',785712,'cat-recording','purr'),('BadIdeaProductions',856508,'cat-recording','purr'),
 ('mcroce',234333,'cat-recording','meow-purr'),('dreamstobecome',424357,'cat-recording','chirp-mew'),
 ('dreamstobecome',451250,'cat-recording','chirp'),('MBPL',668821,'cat-recording','trill'),
 ('MBPL',668824,'cat-recording','trill'),('rickismyname',819958,'cat-recording','hiss'),
 ('Sadiquecat',855880,'cat-recording','purr'),('rareguy27',690620,'cat-recording','purr'),
 ('qubodup',843435,'consonant','tongue-session'),('OZ%C3%98NA',721074,'consonant','tongue-pop'),
 ('MichellePamelaLyons',135515,'consonant','tongue-click'),('Jeffijoe',172067,'consonant','pop'),
 ('ShangusBurger',764351,'consonant','tongue-click-session'),('hollandm',691910,'consonant','tongue-click'),
 ('SaundKlyp',175678,'consonant','tongue-click'),('RutgerMuller',104374,'consonant','mouth-session'),
 ('hollandm',691913,'consonant','tsk'),
 ('Voltrod',759022,'ambience','cafe-room-tone'),('Kinoton',568356,'ambience','empty-cafe'),
 ('kyles',637622,'ambience','kitchen-hum'),('Sadiquecat',875108,'ambience','kettle'),
 ('FlashTrauma',398277,'ambience','kettle'),('FOSSarts',740164,'foley','kettle-cup'),
 ('SignatureSoundsOrg',869851,'ambience','rain-window'),('cb9382',872403,'ambience','rain-window'),
 ('Romano.Tercero',726615,'ambience','night-street'),('RyanKingArt',717579,'ambience','fire-hearth'),
 ('Sadiquecat',853081,'ambience','fire-hearth'),
]
KENNEY=['rpg-audio','impact-sounds','interface-sounds','music-jingles','ui-audio','digital-audio','casino-audio','voiceover-pack','voiceover-pack-fighter','sci-fi-sounds']
MUSIC=['hard-battle-2','fairy-battles','heavy-boss-battle-1','8bit-action-stage-select','hard-boss-battle-1']


def fetch(url,opener=None,referer=None):
    request=Request(url,headers={**HEADERS,**({'Referer':referer} if referer else {})})
    return (opener.open(request,timeout=30) if opener else urlopen(request,timeout=30)).read()


def evidence(name,url,body,license_text):
    target=EVIDENCE/(name+'.json')
    target.write_text(json.dumps({'url':url,'retrieved':DATE,'responseSha256':hashlib.sha256(body).hexdigest(),'license':'CC0-1.0','licenseUrl':CC0,'evidence':license_text},indent=2)+'\n')
    return str(target.relative_to(ROOT))


def freesound(item):
    author,ident,kind,tag=item
    url=f'https://freesound.org/people/{author}/sounds/{ident}/'
    body=fetch(url);page=body.decode()
    if 'creativecommons.org/publicdomain/zero/1.0' not in page:
        raise ValueError('Official page does not identify CC0')
    preview=re.findall(r'https://cdn\.freesound\.org/previews/[^\s\"<>]+-hq\.mp3',page)
    if not preview:raise ValueError('Official high-quality preview unavailable')
    title=re.search(r'<title>(.*?)</title>',page,re.S)
    row={'id':f'freesound:{ident}','file':f'{ident}.mp3','pack':'freesound','sourceUrl':url,'downloadUrl':preview[0],'licenseUrl':CC0,'licenseEvidenceUrl':url,'license':'CC0-1.0','author':unquote(author),'date':DATE,'kind':kind,'tags':[tag],'recordingId':f'freesound:{ident}','title':html_module.unescape(title.group(1).strip()) if title else str(ident),'licenseEvidence':evidence(f'freesound-{ident}',url,body,'Official page links to Creative Commons Zero 1.0 and identifies the uploader; original content must be verified before selection.')}
    return [row]


def kenney(slug):
    url='https://kenney.nl/assets/'+slug
    opener=build_opener(HTTPCookieProcessor(http.cookiejar.CookieJar()))
    body=fetch(url,opener);page=body.decode()
    if 'CC0' not in page:raise ValueError('CC0 absent on official asset page')
    ident=re.search("data-download-id='([^']+)'",page).group(1)
    link=json.loads(fetch('https://kenney.nl/download-link/'+ident,opener,url))['url']
    raw=fetch(link,opener,url)
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        licenses=[n for n in archive.namelist() if 'license' in n.lower() and n.lower().endswith('.txt')]
        if not licenses:raise ValueError('Bundled licence missing')
        license_text=archive.read(licenses[0]).decode('utf8','replace')
        if not re.search('CC0|Creative Commons Zero',license_text,re.I):raise ValueError('Bundled licence is not CC0')
        proof=evidence('kenney-'+slug,url,body,license_text)
        # One best available encoding per original sample; no WAV/OGG double count.
        members={}
        for member in archive.infolist():
            p=Path(member.filename)
            if p.suffix.lower() not in ['.wav','.ogg','.mp3'] or p.stem.lower().startswith('preview'):continue
            key=p.stem
            if key not in members or p.suffix.lower()=='.ogg':members[key]=member
        return [{'id':f'kenney:{slug}:{key}','file':m.filename,'pack':slug,'sourceUrl':url,'licenseEvidenceUrl':url,'licenseUrl':CC0,'license':'CC0-1.0','author':'Kenney','date':DATE,'archiveMember':m.filename,'archiveSha256':hashlib.sha256(raw).hexdigest(),'sourceBytes':m.file_size,'kind':'sting' if slug=='music-jingles' else 'voice-effort' if slug.startswith('voiceover') else 'sfx','licenseEvidence':proof} for key,m in members.items()]


def field_block(page,field):
    opening=re.search(r'<div\b[^>]*class=[\"\'][^\"\']*\b'+re.escape(field)+r'\b[^\"\']*[\"\'][^>]*>',page)
    if not opening:raise ValueError('Official content field missing: '+field)
    depth=0
    for tag in re.finditer(r'<(/?)div\b[^>]*>',page[opening.start():]):
        depth+=-1 if tag.group(1) else 1
        if depth==0:return page[opening.start():opening.start()+tag.end()]
    raise ValueError('Unclosed official content field')


def music(slug):
    url='https://opengameart.org/content/'+slug;body=fetch(url);page=body.decode()
    if not re.search(r'creativecommons.org/publicdomain/zero|>CC0<',field_block(page,'field-name-field-art-licenses')):raise ValueError('Official CC0 evidence missing')
    # Related works/comments have separate authors and licences. Never inherit the
    # main work's CC0 licence onto their attachments or count alternative encodes.
    links=set(re.findall(r'https://opengameart.org/sites/default/files/[^\s\"<>]+\.(?:mp3|ogg|wav)',field_block(page,'field-name-field-art-files')))
    preferred={}
    for link in sorted(links):
        key=Path(link).stem
        if key not in preferred or link.endswith('.ogg'):preferred[key]=link
    links=set(preferred.values())
    if not links:raise ValueError('Official music file absent')
    proof=evidence('oga-'+slug,url,body,'Official work page labels CC0 and MintoDog as author.')
    author=re.search(r'<meta name="dcterms.creator" content="([^\"]+)"',page)
    if not author:raise ValueError('Official creator metadata absent')
    return [{'id':'oga:'+slug+':'+Path(link).name,'file':Path(link).name,'pack':'music-b2','sourceUrl':url,'downloadUrl':html_module.unescape(link),'licenseUrl':CC0,'licenseEvidenceUrl':url,'license':'CC0-1.0','author':html_module.unescape(author.group(1)),'date':DATE,'kind':'music','licenseEvidence':proof} for link in sorted(links)]


if __name__=='__main__':
    jobs=[('kenney:'+x,kenney,x) for x in KENNEY]+[('freesound:'+str(x[1]),freesound,x) for x in FREESOUND]+[('oga:'+x,music,x) for x in MUSIC]
    def run(job):
        name,fn,arg=job
        try:return name,fn(arg),None
        except Exception as error:return name,[],str(error)
    rows=[];skipped=[]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for name,found,error in pool.map(run,jobs):
            rows.extend(found)
            if error:skipped.append({'source':name,'reason':error})
            print(name,len(found),'candidates' if not error else error,flush=True)
    skipped.extend([
        {'source':'https://freesound.org/people/ken788/sounds/386737/','reason':'Possible earlier CC-BY original flagged on page; reject ambiguous relicense.'},
        {'source':'https://kenney.nl/assets/foley-sounds','reason':'404; use licensed RPG/Impact/Casino foley instead.'},
        {'source':'https://sonniss.com/gdc-bundle-license/','reason':'Reviewed live v2.0, effective 2026-08-27. Finished synchronized projects allowed, standalone source redistribution restricted. Choose CC0 for this public source repository; no Sonniss audio downloaded or used for AI.'},
    ])
    (OUT/'CANDIDATES.json').write_text(json.dumps({'date':DATE,'files':rows,'skipped':skipped},indent=2)+'\n')
    print('Total',len(rows),'candidate files; no audio or ZIP files retained by research.')
