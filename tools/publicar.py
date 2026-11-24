#!/usr/bin/env python3
"""Exporta somente os arquivos públicos, com cache versionado. Python 3.9+."""
import argparse,re,shutil,json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('--versao',required=True);p.add_argument('--saida',default=str(root/'public'));a=p.parse_args()
if not re.fullmatch(r'[0-9]+(?:\.[0-9]+){1,3}(?:-[a-zA-Z0-9-]+)?',a.versao):p.error('versão inválida')
out=Path(a.saida).resolve();assert out!=root and root not in out.parents or out==root/'public', 'use a pasta public ou um diretório fora do projeto'
if out.exists() and any(out.iterdir()):raise SystemExit('A pasta de saída deve estar vazia. Não serão apagados arquivos automaticamente.')
out.mkdir(parents=True,exist_ok=True)
for name in ['js','css','assets','config']:
 shutil.copytree(root/name,out/name,dirs_exist_ok=True)
for name in ['index.html','_headers','.nojekyll']:shutil.copy2(root/name,out/name)
idx=out/'index.html';idx.write_text(re.sub(r'\?v=038', '?v='+a.versao,idx.read_text(encoding='utf-8')),encoding='utf-8')
cfg=out/'config/conteudo.js';cfg.write_text(re.sub(r"versao:\s*'[^']+'",f"versao: '{a.versao}'",cfg.read_text(encoding='utf-8'),count=1),encoding='utf-8')
# Images may be replaced by the editor without changing filenames. Bust their cache as well.
for f in list((out/'js').glob('*.js'))+list((out/'css').glob('*.css'))+[idx,cfg]:
 s=f.read_text(encoding='utf-8');s=re.sub(r'(assets/(?:images|maps)/[\w.-]+\.(?:png|jpg|webp|gif))(?![\w?])',r'\1?v='+a.versao,s);f.write_text(s,encoding='utf-8')
(out/'version.json').write_text(json.dumps({'version':a.versao})+'\n',encoding='utf-8')
print(f'Publicação {a.versao} preparada em {out}. Envie o conteúdo dessa pasta, não a pasta de saves.')
