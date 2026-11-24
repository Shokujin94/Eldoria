#!/usr/bin/env python3
"""Valida referências estáticas do pacote antes do deploy."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from html.parser import HTMLParser
import json, re, sys
root = Path(sys.argv[1]).resolve()
errors = []
class Refs(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, val in attrs:
            if key in ('src','href') and val and tag in ('script','link','img'):
                check(val, 'index.html')
def check(val, source):
    u = urlsplit(val)
    if u.scheme or u.netloc or not u.path:
        return
    if u.path.startswith('/'):
        errors.append(f'{source}: caminho absoluto incompatível com Pages de projeto: {val}')
        return
    target = root / unquote(u.path)
    if not target.is_file(): errors.append(f'{source}: referência ausente: {val}')
parser = Refs()
parser.feed((root/'index.html').read_text(encoding='utf-8'))
version = json.loads((root/'version.json').read_text())['version']
config = (root/'config/conteudo.js').read_text(encoding='utf-8')
if not re.search(r"versao:\s*['\"]"+re.escape(version)+r"['\"]", config):
    errors.append('Versão da configuração não coincide com version.json')
assets=set()
for f in [*root.glob('js/*.js'), *root.glob('css/*.css'), root/'config/conteudo.js']:
    for val in re.findall(r'assets/(?:images|maps)/[\w.-]+\.(?:png|jpg|webp|gif)(?:\?v=[\w.-]+)?',f.read_text(encoding='utf-8')):
        assets.add(val.split('?')[0]); check(val,f.name)
if errors:
    raise SystemExit('\n'.join(dict.fromkeys(errors)))
print(f'OK: versão {version}; {len(assets)} referências de arte; HTML e configuração válidos.')
