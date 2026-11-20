"""Print only field names/counts/locations, never matched values."""
import json,re,collections,pathlib
root=pathlib.Path(__file__).resolve().parents[3]
rows=json.loads((root/'reports/v4-ship/S1/secrets-working.json').read_text())['findings']
byfile=collections.defaultdict(dict)
for row in rows:
    locations=byfile[row['file']]
    locations[row['line']]=locations.get(row['line'],0)+1
counts=collections.Counter();examples={}
for name,locations in byfile.items():
    last=max(locations)
    with (root/name).open(errors='replace') as file:
        for number,line in enumerate(file,1):
            if number in locations:
                match=re.search(r'^\s*"([^"\n]+)"\s*:',line[:300])
                key=match.group(1) if match else '(code)'
                group=(pathlib.Path(name).suffix,key)
                counts[group]+=locations[number]
                examples.setdefault(group,{'file':name,'line':number})
            if number>=last:break
for group,count in counts.most_common():
    print(json.dumps({'extension':group[0],'field':group[1],'count':count,'example':examples[group]}),flush=True)
