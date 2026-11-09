#!/bin/sh
set -eu
pattern=${1:?Provide an A-OUTBOX entry regex}
sync=/Users/bao/taskbar-hero-cardrpg-sync
last=${V5_LAST_READ_LINE:-1258}
while :; do
  fetched=0
  for backoff in 0 2 4 8 16; do
    [ "$backoff" = 0 ] || sleep "$backoff"
    if git -C "$sync" pull --rebase -q; then fetched=1; break; fi
  done
  if [ "$fetched" = 1 ]; then
    if python3 - "$sync/coord/cardrpg-big/A-OUTBOX.md" "$last" "$pattern" <<'PY'
import re,sys
from pathlib import Path
text='\n'.join(Path(sys.argv[1]).read_text().splitlines()[int(sys.argv[2]):])
entries=re.split(r'(?m)(?=^## )',text)
for entry in entries:
    if re.search(sys.argv[3],entry):
        print(entry);sys.exit(0)
sys.exit(1)
PY
    then exit 0; fi
  fi
  sleep 300
done
