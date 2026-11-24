/* Histórico de patches e aviso de atualização. Acrescente novas entradas no início. */
(()=>{
'use strict';
const history=[
 {version:'0.39.0',date:'2026-11-24',title:'Horizontes de combate',groups:[
 ['Combate à distância',['Arqueiro: alcance 225; Mago: 245; Clérigo: 170; Necromante: 200 unidades de mapa.','Reposicionamento com recuo limitado, pausa para conjurar e perseguição inimiga mais rápida. O alcance não concede invulnerabilidade.','Flechas e magias saem da altura das mãos, com trilhas coloridas e efeitos no ponto de impacto.']],
 ['Lacaios',['Posições de ataque persistentes, evitando alternância contínua de objetivos.','Transições suaves entre movimento e ataque; passagem espectral temporária em corredores bloqueados.']],
 ['Interface e atualização',['Menu Patch com histórico, data, resumo por categoria e indicador de conteúdo não lido.','Verificação periódica de versões, aviso visível e atualização manual com salvamento prévio.']]
 ]},
 {version:'0.38.1',title:'Ajustes de publicação e lacaios',groups:[['Correções',['Posições de ataque dos lacaios, espaçamento de sprites e publicação versionada.']]]}
];
const current=window.ELDORIA_CONFIG.versao,base=current.split('-')[0],key='eldoria.patch.seen';
let seen='';try{seen=localStorage.getItem(key)||'';}catch(_){}
const nav=document.querySelector('.quicknav');
const button=document.createElement('button');button.className='direct14 patch39-button';button.title='Histórico de patches';button.setAttribute('aria-haspopup','dialog');
button.innerHTML='<span class="navicon" aria-hidden="true">✦</span><span class="navtext">Patch</span><span class="patch39-badge" aria-hidden="true">!</span>';
nav?.append(button);
const badge=button.querySelector('.patch39-badge');
function badgeSync(){badge.hidden=seen===base;button.setAttribute('aria-label',seen===base?'Patch':'Patch: novas mudanças');}
badgeSync();
const dialog=document.createElement('dialog');dialog.id='patch39';dialog.setAttribute('aria-labelledby','patch39-title');
const head=document.createElement('header');head.innerHTML='<div><small>ELDORIA · REGISTRO DE ATUALIZAÇÕES</small><h2 id="patch39-title">Notas de patch</h2></div>';
const close=document.createElement('button');close.className='secondary';close.textContent='Fechar';close.onclick=()=>dialog.close();head.append(close);dialog.append(head);
const version=document.createElement('p');version.className='patch39-version';version.textContent='Versão instalada: '+current;dialog.append(version);
const body=document.createElement('div');body.className='patch39-body';dialog.append(body);
for(const entry of history){const details=document.createElement('details');details.open=entry===history[0];const summary=document.createElement('summary');summary.textContent='v'+entry.version+' · '+entry.title;details.append(summary);const date=document.createElement('p');date.className='patch39-date';date.textContent=entry.date?'Data: '+entry.date.split('-').reverse().join('/'):'Data não registrada';details.append(date);for(const [label,items] of entry.groups){const h=document.createElement('h3');h.textContent=label;details.append(h);const ul=document.createElement('ul');for(const item of items){const li=document.createElement('li');li.textContent=item;ul.append(li);}details.append(ul);}body.append(details);}
document.body.append(dialog);
button.onclick=()=>{if(!dialog.open)dialog.showModal();seen=base;try{localStorage.setItem(key,seen);}catch(_){}badgeSync();};
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
const style=document.createElement('style');style.textContent='#patch39{box-sizing:border-box;width:min(620px,calc(100vw - 24px));max-height:85vh;padding:20px;color:#e5d7bb;background:#18171b;border:1px solid #947a51;border-radius:8px;box-shadow:0 20px 80px #000b;font:14px system-ui}#patch39::backdrop{background:#09090bb0}#patch39 header{display:flex;align-items:center;justify-content:space-between;gap:12px}#patch39 header h2{margin:4px 0;font-size:24px}#patch39 small,#patch39 .patch39-date{color:#b6a180;font-size:12px}#patch39 .patch39-version{padding:8px;background:#252229;border-radius:4px;overflow-wrap:anywhere}#patch39 details{border:1px solid #69563d;border-radius:5px;padding:12px;margin:10px 0}#patch39 summary{cursor:pointer;font-weight:600;color:#f0d49e}#patch39 h3{font-size:14px;margin:15px 0 4px;color:#e8c98d}#patch39 li{margin:6px 0;line-height:1.5}#patch39 ul{padding-left:20px}.patch39-button{position:relative}.patch39-badge{position:absolute;right:0;top:0;background:#ad403b;color:white;border-radius:50%;width:17px;height:17px;display:grid;place-items:center;font:bold 12px system-ui}.patch39-badge[hidden]{display:none!important}#update38{top:12px!important;right:12px!important;z-index:2000!important;max-width:min(370px,calc(100vw - 24px));padding:14px!important;border-radius:6px}#update38 strong,#update38 p{display:block;margin:0 0 8px}#update38 .update39-actions{display:flex;gap:6px;flex-wrap:wrap}';document.head.append(style);
let pending=false,remote='',dismissed='';
function showUpdate(v){
 if(v===dismissed)return;let box=document.getElementById('update38');if(!box){box=document.createElement('aside');box.id='update38';box.setAttribute('role','status');document.body.append(box);}
 box.replaceChildren();const h=document.createElement('strong');h.textContent='Nova versão disponível';const p=document.createElement('p');p.textContent='Eldoria '+v+' está pronto. Atualize quando desejar; seu combate não será interrompido automaticamente.';
 const actions=document.createElement('div');actions.className='update39-actions';const apply=document.createElement('button');apply.className='primary';apply.textContent='Salvar e atualizar';apply.onclick=()=>{if(state.cls&&!save()){p.textContent='Não foi possível salvar seu progresso. Tente novamente antes de atualizar.';return;}const url=new URL(location.href);url.searchParams.set('build',v);location.replace(url.href);};
 const later=document.createElement('button');later.className='secondary';later.textContent='Mais tarde';later.onclick=()=>{dismissed=v;box.remove();};actions.append(apply,later);box.append(h,p,actions);
}
async function checkVersion(){if(pending||!/^https?:$/.test(location.protocol))return;pending=true;try{const url=new URL('version.json',location.href);url.searchParams.set('_',String(Date.now()));const res=await fetch(url,{cache:'no-store'});if(!res.ok)return;const v=(await res.json()).version;if(typeof v!=='string'||! /^\d+(?:\.\d+){1,3}(?:-[a-zA-Z0-9-]+)?$/.test(v)||v===current)return;if(v!==remote){remote=v;showUpdate(v);}}catch(_){}finally{pending=false;}}
if(/^https?:$/.test(location.protocol)){checkVersion();setInterval(checkVersion,30000);window.addEventListener('focus',checkVersion);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkVersion();});}
})();
