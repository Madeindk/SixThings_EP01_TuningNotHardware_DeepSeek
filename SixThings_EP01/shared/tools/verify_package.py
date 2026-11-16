"""Read-only integrity verification. Run from anywhere, no third-party dependencies."""
from pathlib import Path
import hashlib,json,re,sys
root=Path(__file__).resolve().parents[2]
manifest=root/'SHA256SUMS.txt'
if not manifest.exists():raise SystemExit('Missing SHA256SUMS.txt at package root')
bad=[];checked=0
for line in manifest.read_text(encoding='utf-8').splitlines():
    digest,name=line.split('  ',1);p=root/name
    if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:bad.append(name)
    checked+=1
print(json.dumps({'checked_files':checked,'integrity_errors':bad},indent=2))
if bad:sys.exit(1)
print('Integrity verified only. Not factual, visual, audio or human approval.')
