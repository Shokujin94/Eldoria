/* 0.43.2 — focused talent codex. All purchases use the existing allocation engine. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
const themes={
 war:{accent:'#dc9b82',colors:['#dc9b82','#a8bed2','#dfbd7c'],icons:['blade','guard','bleed'],paths:['Escola do carrasco','Disciplina da muralha','Ritmo da batalha'],focus:['Execução e sangramento','Guarda e resistência','Cadência e recursos']},
 ranger:{accent:'#a4cf91',colors:['#e0c58a','#a4cf91','#94cbb7'],icons:['bow','slow','poison'],paths:['Olho do falcão','Passos da vigília','Toxinas e armadilhas'],focus:['Precisão e crítico','Mobilidade e evasão','Veneno e controle']},
 mage:{accent:'#b9a9ef',colors:['#f0aa80','#9ed8f3','#b9a9ef'],icons:['fire','ice','arcane'],paths:['Fornalha dos mártires','Círculo do inverno','Constelação do éter'],focus:['Fogo e explosão','Gelo e controle','Mana e convergência']},
 cleric:{accent:'#efd296',colors:['#efd296','#a7d7ba','#b3c5ee'],icons:['holy','heal','guard'],paths:['Tribunal da luz','Liturgia da misericórdia','Voto de proteção'],focus:['Julgamento e dano','Cura e recuperação','Guarda e proteção']},
 necro:{accent:'#a3d5bc',colors:['#a3d5bc','#dc99ae','#b9a0e7'],icons:['dark','bleed','poison'],paths:['Ossuário de comando','Pacto vital','Livro da decadência'],focus:['Invocações e comando','Drenagem e sustento','Maldições e veneno']}
};
const passiveIcons={basic:'blade',str:'blade',dex:'bow',int:'arcane',wis:'holy',vit:'hp',hp:'hp',def:'guard',guard:'guard',heal:'holy',mana:'mp',regen:'mp',manaCost:'mp',lowManaCost:'mp',crit:'bow',critDamage:'blade',haste:'slow',dodge:'slow',move:'slow',tenacity:'guard',bleed:'bleed',burn:'fire',poison:'poison',execute:'blade',far:'bow',nearGuard:'guard',controlGuard:'ice',iceHit:'ice',slowHit:'slow',burnHit:'fire',shockHit:'arcane',spell:'arcane',holy:'holy',servant:'dark',duration:'dark',drain:'bleed',exposeHit:'expose',curseHit:'poison',killMana:'mp',killHeal:'hp',lowGuard:'guard',bossGuard:'guard',servantGuard:'dark',lowHit:'bleed',bossHit:'blade',bleedHit:'bleed',exposeDuration:'expose'};
let owner=null,identity='',branch=0,filter='all',selected=null,markup='';
const allNodes=()=>nodes().flat();
const keyFor=()=>state.cls+':'+state.subclass;
function model(){const b=nodes(),t=themes[state.cls];if(!t)return null;const asc=currentAsc12(),paths=b.map((arr,i)=>({arr,name:t.paths[i]||asc?.[0]||'Ascensão',focus:t.focus[i]||'Especialização avançada',color:t.colors[i]||ELEMENT12[asc?.[1]]?.[1]||t.accent,icon:t.icons[i]||ELEMENT12[asc?.[1]]?.[2]||'arcane'}));return {paths,t,all:Object.fromEntries(b.flat().map(n=>[n.id,n]))};}
const reqs=(n,all)=>(n.requires32||[]).map(id=>({id,name:all[id]?.name||id,need:Math.min(2,all[id]?.max||2),rank:rank(id)}));
function groups(arr,all){
 const depths={},visiting=new Set();
 function visit(id){if(depths[id]!==undefined)return depths[id];if(visiting.has(id))return 0;visiting.add(id);const parents=(all[id]?.requires32||[]).filter(k=>all[k]);const d=parents.length?1+Math.max(...parents.map(visit)):0;visiting.delete(id);return depths[id]=d;}
 const rows={};for(const n of arr)(rows[visit(n.id)]??=[]).push(n);
 return Object.entries(rows).map(([depth,list])=>({depth:+depth,list:list.sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name,'pt-BR'))}));
}
function icon(n,path){if(n.active){const k=SKILLS[state.cls].find(x=>x[0]===n.id);if(k)return skillIcon11(skillData(k));}const p=window.eldoria33?.passives[n.id];return icon11(passiveIcons[p?.type]||n.iconKey||path.icon,path.color);}
function preview(n,r){
 const k=SKILLS[state.cls].find(x=>x[0]===n.id);if(!k)return null;
 const old=state.talents[n.id],had=Object.hasOwn(state.talents,n.id);
 try{state.talents[n.id]=r;const d=skillData(k);return {d,desc:skillDescription(d)};}
 finally{if(had)state.talents[n.id]=old;else delete state.talents[n.id];}
}
function metrics(d){const pairs=[['Mana',nf(d.mana)+' PM'],['Recarga',nf(d.cd)+' s']];if(d.power&&!d.buff13)pairs.push(['Potência',nf(d.power)+'×']);if(d.heal)pairs.push(['Cura base',nf(d.heal*100)+'% PV']);if(d.guard)pairs.push(['Guarda','3 s']);if(d.buff13)pairs.push(['Duração',nf(d.buff13.duration)+' s']);return pairs.map(([k,v])=>'<div><small>'+esc(k)+'</small><b>'+esc(v)+'</b></div>').join('');}
function passive(n,r,path){const base=(n.desc||'').split(' · Sinergia:')[0].replace(/ por graduação\.?$/,'').replace(/ por ponto\.?$/,'');const p=window.eldoria33?.passives[n.id];const sy=window.eldoria46Synergy,root='t33_'+state.cls+'_'+path+'_0';const syn=n.id===root&&sy?.paths[state.cls]?.[path]?sy.description(sy.paths[state.cls][path],r):'';return '<p>'+esc(r>0?base+' por graduação · '+r+' '+(r===1?'graduação':'graduações'):base+' por graduação')+'</p>'+(p&&r>0?'<small class="tal47-raw">Contribuição nominal: '+nf(p.value*r*(Math.abs(p.value)<1?100:1))+(Math.abs(p.value)<1&&!['regen'].includes(p.type)?'%':'')+' (antes dos limites e demais bônus)</small>':'')+(syn?'<p class="tal47-syn">'+esc(syn)+'</p>':'');}
function details(n,m,compact=false){
 const i=m.paths.findIndex(p=>p.arr.some(a=>a.id===n.id)),p=m.paths[i],r=rank(n.id),next=Math.min(n.max,r+1),requirements=reqs(n,m.all),ready=nodeAvailable(n),available=Math.max(0,talentPoints()),ok=ready&&r<n.max&&available>0;
 const current=n.active?preview(n,Math.max(1,r)):null,future=n.active&&r>0&&r<n.max?preview(n,next):null;
 const desc=current?current.desc.split(' · ').map(s=>'<span>'+esc(s)+'</span>').join(''):passive(n,Math.max(1,r),i);
 return '<div class="tal47-detailhead"><span class="tal47-symbol">'+icon(n,p)+'</span><div><small>'+esc(n.active?'ATIVA':'PASSIVA')+' · '+esc(p.name)+'</small><h3>'+esc(n.name)+'</h3></div><strong>'+r+'/'+n.max+'</strong></div>'+
 '<div class="tal47-state '+(r===n.max?'max':ready?'ready':'locked')+'">'+(r===n.max?'Dominado':ready?(r?'Aprendido':'Disponível'):'Bloqueado')+'</div>'+
 '<h4>'+(r?'Efeito atual':'Efeito ao aprender')+'</h4>'+(current?'<div class="tal47-metrics">'+metrics(current.d)+'</div><div class="tal47-desc">'+desc+'</div>':desc)+
 (r<n.max&&r>0?'<h4>Próxima graduação · '+next+'/'+n.max+'</h4>'+(future?'<div class="tal47-metrics">'+metrics(future.d)+'</div><div class="tal47-desc">'+future.desc.split(' · ').filter(s=>!current.desc.split(' · ').includes(s)).map(s=>'<span>'+esc(s)+'</span>').join('')+'</div>':passive(n,next,i)):'')+
 '<h4>Requisitos</h4><div class="tal47-req '+(state.level>=n.level?'ok':'')+'"><span>Nível do personagem</span><b>'+state.level+' / '+n.level+'</b></div>'+requirements.map(q=>'<div class="tal47-req '+(q.rank>=q.need?'ok':'')+'">'+(compact?'<span>'+esc(q.name)+'</span>':'<button class="tal47-link" data-tal47-jump="'+esc(q.id)+'">'+esc(q.name)+'</button>')+'<b>'+q.rank+'/'+q.need+'</b></div>').join('')+
 (compact?'':'<div class="tal47-buy"><button class="primary" data-alloc43="talents" data-key43="'+esc(n.id)+'" data-qty43="1"'+(ok?'':' disabled')+'>'+ (r===n.max?'Dominado':!ready?'Requisitos pendentes':!available?'Sem pontos':'+1 ponto')+'</button><button class="secondary" data-alloc43="talents" data-key43="'+esc(n.id)+'" data-qty43="max"'+(ok&&Math.min(n.max-r,available)>1?'':' disabled')+'>+'+Math.max(0,Math.min(n.max-r,available))+' máx.</button></div>');
}
function matches(n){return filter==='all'||filter==='active'&&n.active||filter==='passive'&&!n.active||filter==='learned'&&rank(n.id)>0||filter==='ready'&&nodeAvailable(n)&&rank(n.id)<n.max;}
function card(n,p){const r=rank(n.id),ready=nodeAvailable(n),status=r===n.max?'max':r?'learned':ready?'ready':'locked';return '<button type="button" class="tal47-node '+status+(selected===n.id?' selected':'')+'" data-tal47-node="'+esc(n.id)+'" aria-pressed="'+(selected===n.id)+'" style="--node:'+p.color+'"><span class="tal47-symbol">'+icon(n,p)+'</span><span class="tal47-nodecopy"><small>'+(n.active?'ATIVA':'PASSIVA')+' · Nv '+n.level+'</small><b>'+esc(n.name)+'</b><span class="tal47-ranks">'+Array.from({length:n.max},(_,i)=>'<i'+(i<r?' class="on"':'')+'></i>').join('')+'</span></span><strong>'+r+'/'+n.max+'</strong></button>';}
skillTree=function(){
 const m=model();if(!m)return '';
 if(owner!==state||identity!==keyFor()){owner=state;identity=keyFor();branch=0;filter='all';selected=null;}
 if(!m.paths[branch])branch=0;
 const p=m.paths[branch],free=Math.max(0,talentPoints()),used=spent(state.talents),cost=window.eldoria47TalentResetCost();
 const visible=p.arr.filter(matches);if(!visible.some(n=>n.id===selected))selected=visible.find(n=>nodeAvailable(n)&&rank(n.id)<n.max)?.id||visible[0]?.id||null;
 return '<div class="tal47" style="--vocation:'+m.t.accent+';--path:'+p.color+'"><header class="tal47-top"><div><small>VOCAÇÃO · '+esc(C().name)+'</small><h2>Talentos</h2><span>'+used+' pontos investidos</span></div><div class="tal47-free"><strong>'+free+'</strong><small>PONTOS LIVRES</small></div><button class="secondary tal47-reset" data-tal47-reset'+(!used||state.gold<cost?' disabled':'')+'>Redistribuir<small>'+nf(cost)+' ouro</small></button></header>'+
 '<nav class="tal47-paths" aria-label="Caminhos">'+m.paths.map((q,i)=>'<button type="button" data-tal47-path="'+i+'" aria-pressed="'+(i===branch)+'" style="--node:'+q.color+'"><span class="tal47-symbol">'+icon11(q.icon,q.color)+'</span><span><b>'+esc(q.name)+'</b><small>'+esc(q.focus)+'</small><small>'+q.arr.reduce((s,n)=>s+rank(n.id),0)+' pontos</small></span></button>').join('')+'</nav>'+
 '<div class="tal47-tools"><nav aria-label="Filtrar talentos">'+[['all','Todos'],['active','Ativas'],['passive','Passivas'],['ready','Disponíveis'],['learned','Aprendidos']].map(([k,n])=>'<button type="button" data-tal47-filter="'+k+'" aria-pressed="'+(filter===k)+'">'+n+'</button>').join('')+'</nav><button class="secondary" data-v27-open>Maestria</button></div>'+
 '<div class="tal47-work"><section class="tal47-tree"><header><h3>'+esc(p.name)+'</h3><small>'+visible.length+'/'+p.arr.length+' talentos</small></header><div class="tal47-legend"><span>Disponível</span><span>Investido</span><span>Bloqueado</span></div><div class="tal47-grid"><svg class="tal47-edges" aria-hidden="true"></svg>'+groups(p.arr,m.all).map(g=>{const list=g.list.filter(matches);return list.length?'<section class="tal47-tier"><small>ETAPA '+(g.depth+1)+'</small><div>'+list.map(n=>card(n,p)).join('')+'</div></section>':'';}).join('')+(visible.length?'':'<p class="tal47-empty">Nenhum talento neste filtro.</p>')+'</div></section><aside class="tal47-details">'+(selected?details(m.all[selected],m):'<p class="tal47-empty">Selecione um talento.</p>')+'</aside></div>'+
 '<footer class="tal47-foot"><span>Saldo: <b>'+nf(state.gold)+' ouro</b></span><span>'+(!used?'Nenhum ponto para redistribuir':state.gold<cost?'Ouro insuficiente para reset':'Reset devolve '+used+' pontos')+'</span></footer></div>';
};
const root=$('content-talent'),tip=document.createElement('div');tip.id='tal47-tip';tip.hidden=true;tip.setAttribute('role','tooltip');document.body.append(tip);
let hovered=null;
function hideTip(){hovered=null;tip.hidden=true;}
function showTip(el){if(!el?.isConnected)return hideTip();const m=model(),n=m?.all[el.dataset.tal47Node];if(!n)return hideTip();hovered=el;tip.style.setProperty('--path',el.style.getPropertyValue('--node'));tip.innerHTML=details(n,m,true);tip.hidden=false;const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;tip.style.left=clamp(r.right+9+w<=innerWidth?r.right+9:r.left-w-9,6,Math.max(6,innerWidth-w-6))+'px';tip.style.top=clamp(r.top,6,Math.max(6,innerHeight-h-6))+'px';}
function connect(){
 const grid=root.querySelector('.tal47-grid'),svg=grid?.querySelector('svg');if(!grid||!svg)return;
 const m=model(),box=grid.getBoundingClientRect();if(!box.width||!box.height)return;
 const map=new Map([...grid.querySelectorAll('[data-tal47-node]')].map(el=>[el.dataset.tal47Node,el]));
 svg.setAttribute('viewBox','0 0 '+box.width+' '+box.height);let h='';
 for(const [id,el] of map){const n=m.all[id],r=el.getBoundingClientRect();for(const q of reqs(n,m.all)){const parent=map.get(q.id);if(!parent)continue;const f=parent.getBoundingClientRect(),x=f.left+f.width/2-box.left,y=f.bottom-box.top,X=r.left+r.width/2-box.left,Y=r.top-box.top,mid=(y+Y)/2;h+='<path class="'+(q.rank>=q.need?'lit':'')+'" d="M'+x+' '+y+' V'+mid+' H'+X+' V'+Y+'"/>';}}
 if(svg._edges47!==h){svg.innerHTML=h;svg._edges47=h;}
}
let observer=typeof ResizeObserver==='function'?new ResizeObserver(connect):null;
const render0=renderTab;renderTab=function(t){if(t!=='talent')return render0(t);if(!state.cls)return;const h=skillTree();if(h!==markup||!root.querySelector('.tal47')){const f=document.activeElement,id=f?.dataset?.tal47Node;hideTip();root.innerHTML=h;markup=h;observer?.disconnect();const g=root.querySelector('.tal47-grid');if(g)observer?.observe(g);if(id)[...root.querySelectorAll('[data-tal47-node]')].find(x=>x.dataset.tal47Node===id)?.focus({preventScroll:true});}connect();};
function repaint(){renderTab('talent');}
root.addEventListener('pointerover',e=>{const el=e.target.closest('[data-tal47-node]');if(el&&el!==hovered&&e.pointerType!=='touch')showTip(el);});
root.addEventListener('pointerout',e=>{if(hovered&&!hovered.contains(e.relatedTarget))hideTip();});
root.addEventListener('focusin',e=>{if(e.target.matches('[data-tal47-node]'))showTip(e.target);});
root.addEventListener('focusout',hideTip);
root.addEventListener('scroll',hideTip,true);
window.addEventListener('resize',()=>{hideTip();connect();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip();});
const modal=document.createElement('dialog');modal.id='tal47-reset-dialog';document.body.append(modal);let resetOwner=null,quoted=0;
function openReset(){const used=spent(state.talents),cost=window.eldoria47TalentResetCost();if(!used||state.gold<cost)return;resetOwner=state;quoted=cost;modal.innerHTML='<h3>Redistribuir talentos?</h3><p>Você recuperará <b>'+used+' pontos</b>. Habilidades aprendidas e bônus dos talentos serão removidos. Equipamentos sem requisitos poderão ser desequipados.</p><div class="tal47-req"><span>Custo</span><b>'+nf(cost)+' ouro</b></div><div class="tal47-req"><span>Saldo após reset</span><b>'+nf(state.gold-cost)+' ouro</b></div><div class="tal47-buy"><button class="secondary" data-tal47-cancel>Cancelar</button><button class="primary" data-tal47-confirm>Confirmar</button></div>';modal.showModal();}
modal.addEventListener('click',e=>{if(e.target.closest('[data-tal47-cancel]'))modal.close();if(e.target.closest('[data-tal47-confirm]')){if(state!==resetOwner||quoted!==window.eldoria47TalentResetCost()){modal.close();return;}if(window.eldoria43Points.reset('talents',true)){validateEquipment();const s=stats();state.hp=Math.min(state.hp,s.h);state.mana=Math.min(state.mana,s.mana);modal.close();render();save();}else modal.close();}});
root.addEventListener('click',e=>{const b=e.target.closest('[data-tal47-path],[data-tal47-filter],[data-tal47-node],[data-tal47-jump],[data-tal47-reset]');if(!b||b.disabled)return;e.preventDefault();e.stopImmediatePropagation();hideTip();if(b.hasAttribute('data-tal47-reset'))return openReset();if(b.dataset.tal47Path!==undefined){branch=+b.dataset.tal47Path;selected=null;filter='all';}else if(b.dataset.tal47Filter){filter=b.dataset.tal47Filter;}else if(b.dataset.tal47Node){selected=b.dataset.tal47Node;}else if(b.dataset.tal47Jump){const m=model(),i=m.paths.findIndex(p=>p.arr.some(n=>n.id===b.dataset.tal47Jump));if(i>=0){branch=i;filter='all';selected=b.dataset.tal47Jump;}}repaint();},true);
window.eldoria47Talents={groups,reqs,preview};
})();
