/* 0.42.1 — compact windows and session analysis. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(+v)?+v:0;
const nf=v=>num(v).toLocaleString('pt-BR',{maximumFractionDigits:1});
const time=v=>duration(Math.max(0,Math.floor(num(v))));
const sizes={bag:[620,610],hero:[650,640],equip:[660,650],attr:[650,640],talent:[710,650],dungeon:[900,650],analyzer:[460,630],forge:[650,640],prof:[680,640],zones:[880,650],sub:[520,600]};
for(const [id,def] of Object.entries(WINDOW_DEFS)){if(sizes[id]){def[2]=sizes[id][0];def[3]=sizes[id][1];}else{def[2]=Math.min(def[2],680);def[3]=Math.min(def[3],640);}}
function dimensions(w,h,vw,vh){return {w:Math.max(1,Math.min(w,vw-12)),h:Math.max(1,Math.min(h,vh-12))};}
window.eldoria44Dimensions=dimensions;
// Ignore old saved sizes, but retain positions and dragging.
fitWindow=function(w){
 if(!w||w.classList.contains('hidden'))return;
 const d=WINDOW_DEFS[w.id.slice(4)];if(!d)return;
 const size=dimensions(d[2],d[3],innerWidth,innerHeight),r=w.getBoundingClientRect();
 w.style.width=size.w+'px';w.style.height=size.h+'px';
 w.style.left=clamp(r.left,0,Math.max(0,innerWidth-size.w))+'px';
 w.style.top=clamp(r.top,0,Math.max(0,innerHeight-size.h))+'px';
};
const open0=openWindow;openWindow=function(id){const ret=open0(id),w=windows[id==='attr'?'hero':id];if(w&&!w.classList.contains('hidden'))fitWindow(w);return ret;};
let sheetTab='attributes';
window.eldoria44SheetSync=function(){
 const root=$('sheetExtra');if(!root)return;
 root.dataset.sheet44Active=sheetTab;
 for(const b of root.querySelectorAll('[data-sheet44]'))b.setAttribute('aria-pressed',String(b.dataset.sheet44===sheetTab));
};
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-sheet44]');if(!b)return;
 if(!['attributes','stats','effects'].includes(b.dataset.sheet44))return;
 e.preventDefault();e.stopImmediatePropagation();sheetTab=b.dataset.sheet44;window.eldoria44SheetSync();
},true);
// Enrich only newly recorded drops, without changing rewards or older saved entries.
const drop0=recordDrop;recordDrop=function(it){
 const result=drop0(it),a=state.analyzer,d=a?.drops?.[0];
 if(d&&d.id===it.id){d.elapsed44=num(a.seconds);d.source44=enemy().name;}
 return result;
};
let tab='summary',dropKind='items',dropSort='recent',owner=null;
const tabs={summary:'Resumo',combat:'Combate',drops:'Drops'};
const kinds={items:'Equipamentos',materials:'Materiais',runes:'Runas'};
function metrics(a){
 const seconds=Math.max(0,num(a.seconds)),gold=num(a.gold),value=num(a.itemValue),cost=num(a.consCost??num(a.potionsUsed)*POTION_VALUE),kills=num(a.kills),count=num(a.itemCount);
 const damage=Object.entries(a.damage20||{}).filter(([,v])=>num(v)>0).sort((a,b)=>b[1]-a[1]),total=damage.reduce((s,[,v])=>s+num(v),0);
 return {seconds,gold,value,cost,net:gold+value-cost,gross:gold+value,kills,count,damage,total,rate:v=>seconds>0?v*3600/seconds:null,perSecond:v=>seconds>0?v/seconds:null};
}
window.eldoria44AnalyzerMetrics=metrics;
const rate=v=>v===null?'—':nf(v);
const cash=v=>nf(v)+' ◈';
const card=(label,value,sub='',tone='')=>'<article class="an44-metric '+tone+'"><small>'+esc(label)+'</small><b>'+esc(value)+'</b>'+(sub?'<span>'+esc(sub)+'</span>':'')+'</article>';
const section=(title,body)=>'<section class="an44-section"><h3>'+esc(title)+'</h3>'+body+'</section>';
const row=(k,v,cls='')=>'<div class="an44-row"><span>'+esc(k)+'</span><b class="'+cls+'">'+esc(v)+'</b></div>';
const bar=(fraction,color)=>'<div class="an44-meter"><i style="width:'+clamp(fraction*100,0,100)+'%;background:'+color+'"></i></div>';
const empty=t=>'<p class="an44-empty">'+esc(t)+'</p>';
function rarity(a){return section('Raridades · equipamentos',RARITIES.map(([name,color],i)=>{const n=num(a.rarities?.[i]);return '<div class="an44-rarity"><span style="color:'+color+'">'+esc(name)+'</span><b>'+nf(n)+'</b><small>'+nf(a.itemCount?n/a.itemCount*100:0)+'%</small>'+bar(a.itemCount?n/a.itemCount:0,color)+'</div>';}).join(''));}
function best(a){const it=a.best;if(!it||!RARITIES[it.rarity])return '';return section('Melhor drop registrado','<div class="an44-best" style="--rar:'+RARITIES[it.rarity][1]+'"><img src="'+itemIcon(it)+'" alt=""><div><b>'+esc(it.name)+'</b><small>'+esc(RARITIES[it.rarity][0])+(it.loot41?.level?' · iLvl '+it.loot41.level:'')+'</small></div><strong>'+cash(it.value)+'</strong></div>');}
function summary(a,m){
 return '<div class="an44-grid">'+card('XP / hora',rate(m.rate(num(a.xp))),nf(a.xp)+' XP obtida','xp44')+card('Lucro estimado / h',m.seconds?cash(m.rate(m.net)):'—',cash(m.net)+' na sessão',m.net>=0?'green44':'red44')+card('Abates / hora',rate(m.rate(m.kills)),nf(m.kills)+' abates','blue44')+card('Equipamentos / h',rate(m.rate(m.count)),nf(m.count)+' itens','gold44')+'</div>'+
 section('Economia da caçada',row('Ouro recebido',cash(m.gold),'gold44')+row('Valor de venda do loot',cash(m.value))+row('Receita bruta estimada',cash(m.gross))+row('Custo de consumíveis','− '+cash(m.cost),'red44')+row('Lucro estimado',cash(m.net),m.net>=0?'green44':'red44')+'<p class="an44-note">O lucro considera o valor registrado de venda dos drops ao NPC e o custo de reposição dos consumíveis. Não representa ouro já realizado nem inclui compras e resets.</p>')+best(a)+rarity(a);
}
function combat(a,m){
 const enemies=Object.entries(a.enemies||{}).sort((a,b)=>b[1]-a[1]);
 return '<div class="an44-grid">'+card('DPS registrado',rate(m.perSecond(m.total)),nf(m.total)+' dano','blue44')+card('Dano recebido / s',rate(m.perSecond(num(a.received20))),nf(a.received20)+' recebido','red44')+card('Tempo / abate',m.kills?nf(m.seconds/m.kills)+' s':'—',nf(m.kills)+' abates','xp44')+card('Derrotas',nf(a.deaths),nf(a.consumablesUsed??a.potionsUsed)+' consumíveis usados','red44')+'</div>'+
 section('Fontes de dano',m.damage.length?m.damage.map(([k,n])=>'<div class="an44-source"><div>'+esc(k)+'<b>'+nf(n)+' · '+nf(n/m.total*100)+'%</b></div>'+bar(n/m.total,'#91bbde')+'</div>').join(''):empty('Nenhum dano registrado.'))+
 section('Inimigos derrotados',enemies.length?enemies.map(([k,n])=>row(k,nf(n))).join(''):empty('Nenhum abate registrado.'))+
 section('Consumíveis',row('Utilizados',nf(a.consumablesUsed??a.potionsUsed))+row('Poções encontradas',nf(a.potionsFound))+row('Custo estimado',cash(m.cost)))+'<p class="an44-note">Médias calculadas pelo tempo contabilizado na sessão, incluindo o período offline. Dano baseado nas fontes registradas pelo motor.</p>';
}
function drops(a,m){
 const mats=Object.entries(a.materialDrops||{}).filter(([k,n])=>MAT10[k]&&n>0),runes=Object.entries(a.runeDrops||{}).filter(([k,n])=>RUNES[k]&&n>0),sum=x=>x.reduce((s,[,n])=>s+num(n),0);
 const nav='<nav class="an44-subnav">'+Object.entries(kinds).map(([k,n])=>'<button class="secondary" data-an44-kind="'+k+'" aria-pressed="'+(k===dropKind)+'">'+n+' <b>'+nf(k==='items'?m.count:k==='materials'?sum(mats):sum(runes))+'</b></button>').join('')+'</nav>';
 if(dropKind!=='items'){
  const list=dropKind==='materials'?mats:runes,dict=dropKind==='materials'?MAT10:RUNES,icon=dropKind==='materials'?materialIcon19:runeIcon;
  return nav+section(dropKind==='materials'?'Materiais da sessão':'Runas da sessão',list.length?list.sort((a,b)=>b[1]-a[1]).map(([k,n])=>{const d=dict[k],r=RARITIES[d.rarity]||RARITIES[0];return '<div class="an44-drop" style="--rar:'+r[1]+'"><img src="'+icon(k)+'" alt=""><div><b>'+esc(d.name)+'</b><small>'+esc(r[0])+' · '+cash(d.price)+'/un.</small></div><strong>×'+nf(n)+'</strong></div>';}).join(''):empty('Nenhum recurso desta categoria.'))+'<p class="an44-note">Contagem acumulada na sessão. Preços unitários atuais de referência.</p>';
 }
 let list=(a.drops||[]).filter(it=>RARITIES[it.rarity]&&(!rareOnly||it.rarity>=2));
 if(dropSort==='rarity')list.sort((a,b)=>b.rarity-a.rarity||num(b.loot41?.level)-num(a.loot41?.level));
 if(dropSort==='value')list.sort((a,b)=>b.value-a.value);
 return nav+'<div class="an44-drop-tools"><span>'+list.length+' de '+nf(m.count)+' equipamentos</span><label>Ordenar <select id="an44-sort">'+[['recent','Recentes'],['rarity','Raridade / iLvl'],['value','Maior valor']].map(([k,n])=>'<option value="'+k+'"'+(k===dropSort?' selected':'')+'>'+n+'</option>').join('')+'</select></label></div>'+
 (list.length?list.map(it=>'<div class="an44-drop" style="--rar:'+RARITIES[it.rarity][1]+'"><img src="'+itemIcon(it)+'" alt=""><div><b title="'+esc(it.name)+'">'+esc(it.name)+'</b><small>'+esc(RARITIES[it.rarity][0])+' · '+esc(SLOTS[it.slot])+(it.loot41?.level?' · iLvl '+it.loot41.level:'')+'</small>'+(it.source44?'<small>'+esc(it.source44)+' · '+time(it.elapsed44)+'</small>':'')+'<details><summary>Atributos</summary><small>'+esc(modText(it))+'</small></details></div><strong>'+cash(it.value)+'</strong></div>').join(''):empty('Nenhum equipamento nesta seleção.'))+'<p class="an44-note">Histórico dos últimos 60 equipamentos. Contadores e valores abrangem toda a sessão.</p>';
}
function paint(el,h){
 if(el._html44===h)return;
 const opened=new Set([...el.querySelectorAll('details[open]')].map(d=>d.closest('.an44-drop')?.querySelector('b')?.textContent));
 const f=document.activeElement,keep=f?.id==='an44-sort'&&el.contains(f);el.innerHTML=h;el._html44=h;
 for(const d of el.querySelectorAll('details'))if(opened.has(d.closest('.an44-drop')?.querySelector('b')?.textContent))d.open=true;
 if(keep)el.querySelector('#an44-sort')?.focus({preventScroll:true});
}
renderAnalyzer=function(){
 const el=$('huntAnalyzer'),box=$('huntDrops'),a=state.analyzer;if(!el||!box)return;
 if(owner!==a){owner=a;tab='summary';dropKind='items';}
 $('newSession').disabled=!state.cls||!['hunt','dungeon','boss','trial'].includes(state.mode);
 const filter=$('lootFilter');filter.hidden=!a||tab!=='drops'||dropKind!=='items';filter.textContent=rareOnly?'Raros+':'Todos os drops';filter.setAttribute('aria-pressed',String(rareOnly));
 if(!a){paint(el,empty('Inicie uma caçada, dungeon ou chefe para registrar os resultados.'));paint(box,'');return;}
 const m=metrics(a),same=sameSession(a),active=state.active&&same,region=ZONES[a.zone]?.name||'Região',mode=MODES[a.mode]||a.mode;
 const header='<header class="an44-header"><div><small>SESSÃO DE COMBATE</small><h2>'+esc(region)+'</h2><span>'+esc(mode)+' · <b class="'+(active?'green44':'')+'">'+(active?'● Ativa':same?'○ Pausada':'○ Encerrada')+'</b></span></div><div class="an44-clock"><strong>'+time(m.seconds)+'</strong><small>Offline '+time(a.offline)+'</small></div></header><nav class="an44-nav">'+Object.entries(tabs).map(([k,n])=>'<button class="secondary" data-an44-tab="'+k+'" aria-pressed="'+(tab===k)+'">'+n+'</button>').join('')+'</nav>';
 paint(el,header+(tab==='summary'?summary(a,m):tab==='combat'?combat(a,m):''));
 paint(box,tab==='drops'?drops(a,m):'');
};
const root=$('content-analyzer');
root.addEventListener('click',e=>{const b=e.target.closest('[data-an44-tab],[data-an44-kind]');if(!b)return;if(Object.hasOwn(tabs,b.dataset.an44Tab))tab=b.dataset.an44Tab;if(Object.hasOwn(kinds,b.dataset.an44Kind))dropKind=b.dataset.an44Kind;renderAnalyzer();});
root.addEventListener('change',e=>{if(e.target.id==='an44-sort'){dropSort=e.target.value;renderAnalyzer();}});
})();
