"""Read-only validation of current documentation links and preserved sources."""
from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parents[2]
docs = root / 'docs'
names = ['specification.md', 'SOURCE_AUDIT.md', 'RULES_MATRIX.md', 'COVERAGE.md', 'CARD_ASSETS.md', 'ADDENDUM_1_AUDIT.md', 'CHANGELOG.md', 'DEMON_LIST_AUDIT.md', 'DEMON_COST_MATCHES.md', '../README.md', '../PLAN.md']
errors = []
links = 0
for name in names:
    path = docs / name
    for target in re.findall(r'\]\(([^)]+)\)', path.read_text(encoding='utf-8-sig')):
        if '://' in target or target.startswith('#'):
            continue
        local, _, anchor = target.partition('#')
        resolved = (path.parent / local).resolve()
        links += 1
        if not resolved.is_file():
            errors.append(f'{name}: missing {target}')
        elif anchor and resolved.suffix == '.md':
            headings = re.findall(r'^#+\s+(.*?)\s*$', resolved.read_text(encoding='utf-8-sig'), re.M)
            anchors = [re.sub(r'[^\w\- ]', '', h.lower()).replace(' ', '-') for h in headings]
            if anchor not in anchors:
                errors.append(f'{name}: missing anchor {target}')

manifest = json.loads((docs / 'sources' / 'manifest.json').read_text(encoding='utf-8'))
hashes = 0
for source in manifest['sources']:
    if source.get('sha256') and source.get('path'):
        source_path = root / source['path']
        hashes += 1
        actual = hashlib.sha256(source_path.read_bytes()).hexdigest()
        if actual != source['sha256']:
            errors.append(f"hash mismatch: {source['id']}")
    if source['id'] == 'card_images':
        for item in source['files']:
            hashes += 1
            if hashlib.sha256((root / item['path']).read_bytes()).hexdigest() != item['sha256']:
                errors.append(f"hash mismatch: {item['id']}")

attachment = Path('C:/Users/tomma/.codex/attachments/deb0a918-77b6-4cf2-9ad8-b046a8186519/pasted-text.txt')
assert attachment.read_bytes() == (docs / 'addendum-1.md').read_bytes()
author_attachment = Path('C:/Users/tomma/.codex/attachments/fd038fb2-bd82-45cf-8a09-c50c12fce742/pasted-text.txt')
assert author_attachment.read_bytes() == (docs / 'sources' / 'author-demons-2026-09-10.tsv').read_bytes()
base = (docs / 'sources' / 'base-specification-v1.md').read_text(encoding='utf-8-sig').strip()
assert (docs / 'specification.md').read_text(encoding='utf-8-sig').rstrip().endswith(base)
print(json.dumps(dict(links_checked=links, source_hashes_checked=hashes, addendum_byte_identical=True, author_list_byte_identical=True, base_spec_text_preserved=True, errors=errors), ensure_ascii=False))
if errors:
    raise SystemExit(1)
