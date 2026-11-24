/* 0.42 — Character allocation, forge and collection UX. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
const disabled=x=>x?' disabled':'';
const bar=(n,total)=>'<div class="progress43"><i style="width:'+clamp(total?n/total*100:0,0,100)+'%"></i></div>';
const cost43=kind=>kind==='talents'?100+state.level*50+spent(state.talents)*25:resetCost();
window.eldoria47TalentResetCost=()=>cost43('talents');
const resetHTML=kind=>{
 const n=spent(state[kind]),cost=cost43(kind),label=kind==='attrs'?'atributos':'talentos';
 return '<section class="reset43"><div><b>Redistribuir '+label+'</b><small>'+n+' pontos serão devolvidos · Saldo '+fmt(state.gold)+' ◈</small></div><button class="secondary" data-reset43="'+kind+'"'+disabled(!n||state.gold<cost)+'>Resetar · '+fmt(cost)+' ◈</button>'+(!n?' <small>Nenhum ponto investido.</small>':state.gold<cost?' <small class="bad09">Ouro insuficiente.</small>':'')+'</section>';
};
respec=resetHTML;
const points=(kind)=>{
 const free=kind==='attrs'?attrPoints():talentPoints(),used=spent(state[kind]),total=used+free;
 return '<section class="points43 '+(kind==='attrs'?'points43-attr':'points43-talent')+'"><div><small>PONTOS DISPONÍVEIS</small><strong>'+free+'</strong></div><div class="points43-progress"><b>'+used+' / '+total+' investidos</b>'+bar(used,total)+'<small>'+ (kind==='attrs'?'Distribua em qualquer atributo.':'Respeite os requisitos de cada caminho.')+'</small></div></section>';
};
window.eldoria43Attributes=function(){
 const s=stats(),free=attrPoints(),colors={str:'#e5a18a',dex:'#a5d39c',int:'#bdb1f2',vit:'#ef9d9b',wis:'#9ed3e7'};
 return '<section class="attrs43"><div class="title43"><h3>Atributos fundamentais</h3><small>Escolha sua build</small></div>'+points('attrs')+'<div class="attrs43-list">'+Object.entries(ATTR).map(([k,[n,d]])=>{
 const base=C().base[k],a=state.attrs[k]||0,g=gearAttr(k),other=s.a[k]-base-a-g;
 return '<article class="attr43" style="--stat:'+colors[k]+'"><header><span class="attr43-icon">'+esc(n[0])+'</span><div><b>'+esc(n)+'</b><small>'+(C().main===k?'Principal da vocação':'Atributo universal')+'</small></div><strong>'+num(s.a[k])+'</strong></header><p>'+esc(d)+'</p><div class="attr43-split"><span>Base <b>'+num(base)+'</b></span><span>Investidos <b>'+num(a)+'</b></span><span>Itens <b>'+num(g)+'</b></span><span>Outros <b>'+num(other)+'</b></span></div><div class="attr43-actions">'+[1,5,'max'].map(v=>'<button class="secondary" data-alloc43="attrs" data-key43="'+k+'" data-qty43="'+v+'"'+disabled(free<=0||(v===5&&free<5))+'>'+(v==='max'?'Todos':'+ '+v)+'</button>').join('')+'</div></article>';
 }).join('')+'</div>'+resetHTML('attrs')+'</section>';
};
attrTable=()=>window.eldoria43Attributes();
const tree0=skillTree;skillTree=function(){const h=tree0();return h.replace(/(<div class="t32"[^>]*>)/,'$1'+points('talents')).replace(/<button class="secondary" data-talent="([^"]+)"([^>]*)>([\s\S]*?)<\/button>/g,(m,id,attrs,label)=>{
 const n=nodes().flat().find(x=>x.id===id);if(!n)return m;const available=nodeAvailable(n),free=talentPoints(),left=n.max-rank(id),max=Math.min(free,left);
 return '<div class="talent43-actions"><button class="secondary" data-alloc43="talents" data-key43="'+esc(id)+'" data-qty43="1"'+disabled(!available||max<=0)+'>'+ (left===0?'Dominado':!available?'Bloqueado':free<=0?'Sem pontos':'+ 1 ponto')+'</button><button class="secondary" data-alloc43="talents" data-key43="'+esc(id)+'" data-qty43="max"'+disabled(!available||max<=1)+'>+'+Math.max(0,max)+'</button></div>';
 });};
function invest(kind,k,qty){
 if(qty!=='max'&&(!Number.isSafeInteger(qty)||qty<=0))return 0;
 if(kind==='attrs'&&Object.hasOwn(ATTR,k)){const free=attrPoints(),n=qty==='max'?free:Math.min(free,qty);if(n>0){state.attrs[k]=(state.attrs[k]||0)+n;return n;}}
 if(kind==='talents'){const t=nodes().flat().find(n=>n.id===k);if(!t||!nodeAvailable(t))return 0;const max=Math.min(talentPoints(),t.max-rank(k)),n=qty==='max'?max:Math.min(max,qty);if(n>0){state.talents[k]=rank(k)+n;return n;}}
 return 0;
}
function reset(kind,approved){if(!approved||!['attrs','talents'].includes(kind)||!spent(state[kind])||state.gold<cost43(kind))return false;state.gold-=cost43(kind);state[kind]=kind==='attrs'?Object.fromEntries(Object.keys(ATTR).map(k=>[k,0])):{};if(kind==='talents'){state.cooldowns={};state.skillBuffs13={};if(state.era20){state.era20.rotation=null;state.era20.conditions={};}}return true;}
window.eldoria43Points=Object.freeze({invest,reset});
function commit(){validateEquipment();const s=stats();state.hp=Math.min(state.hp,s.h);state.mana=Math.min(state.mana,s.mana);render();save();}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-alloc43],[data-reset43],[data-view43],[data-forge43]');if(!b||b.disabled||!state.cls)return;e.preventDefault();e.stopImmediatePropagation();
 if(b.dataset.view43){equipView43=b.dataset.view43==='list'?'list':'grid';renderRefined('bag');return;}
 if(b.dataset.forge43){forgeTab=b.dataset.forge43==='craft'?'craft':'upgrade';refreshWindows();return;}
 if(b.dataset.alloc43){const v=b.dataset.qty43,q=v==='max'?v:Number(v);if(q!=='max'&&![1,5].includes(q))return;if(invest(b.dataset.alloc43,b.dataset.key43,q))commit();}
 else if(b.dataset.reset43){const k=b.dataset.reset43;if(!['attrs','talents'].includes(k))return;const cost=cost43(k);if(confirm('Devolver todos os pontos de '+(k==='attrs'?'atributos':'talentos')+' por '+fmt(cost)+' ouro? Equipamentos sem requisitos poderão ser desequipados.')){if(reset(k,true))commit();}}
},true);
// Forge keeps the existing crafting rules, costs and event handlers.
let forgeTab='craft',forgeFeedback='',forgeOwner=null;
const recipeRows=req=>Object.entries(req).map(([k,n])=>{const m=MAT10[k],have=state.materials[k]||0;return '<div class="recipe43-row"><img src="'+materialIcon19(k)+'" alt=""><div><b style="color:'+RARITIES[m.rarity][1]+'">'+esc(m.name)+'</b><small>'+RARITIES[m.rarity][0]+'</small></div><div><b class="'+(have>=n?'ok43':'bad09')+'">'+fmt(have)+' / '+n+'</b>'+bar(Math.min(have,n),n)+'</div></div>';}).join('');
matRows10=recipeRows;
const check=(label,ok,value)=>'<div class="check43"><span>'+esc(label)+'</span><b class="'+(ok?'ok43':'bad09')+'">'+(ok?'✓ ':'✕ ')+esc(value)+'</b></div>';
craftPanel10=function(){
 const z=craftZone10,plan=craftPlan44(craftSlot10,z),{req,cost,odds,quality}=plan,[lo,hi]=window.eldoria41Loot.sourceRange(z,'forge'),ok=atCity()&&state.level>=ZONES[z].level&&state.inventory.length<120&&state.gold>=cost&&hasMat10(req);
 const chance=n=>n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2})+'%';
 const materials=plan.parts.map(([kind,n])=>{const r=craftMaterials44[kind],k=kind+':'+z+':'+r,m=MAT10[k];return '<div class="forge44-choice"><img src="'+materialIcon19(k)+'" alt=""><label><b style="color:'+RARITIES[r][1]+'">'+esc(m.name)+'</b><select data-craft-material44="'+kind+'" aria-label="Qualidade de '+esc(m.name)+'">'+RARITIES.map(([name],i)=>{const key=kind+':'+z+':'+i,have=state.materials[key]||0;return '<option value="'+i+'"'+(r===i?' selected':'')+'>'+esc(name)+' · '+fmt(have)+'/'+n+'</option>';}).join('')+'</select></label><strong class="'+((state.materials[k]||0)>=n?'ok43':'bad09')+'">'+fmt(state.materials[k]||0)+' / '+n+'</strong></div>';}).join('');
 return '<section class="forge43-recipe"><div class="title43"><h3>Fabricar equipamento</h3><small>1. Selecione a receita</small></div><div class="craft-select10"><label>Região<select id="craftZone10">'+ZONES.map((v,i)=>'<option value="'+i+'"'+(i===z?' selected':'')+'>'+esc(v.name)+'</option>').join('')+'</select></label><label>Peça<select id="craftSlot10">'+Object.entries(SLOTS).map(([k,v])=>'<option value="'+k+'"'+(k===craftSlot10?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label></div><div class="forge43-result" style="--rar:#c4ad80"><img src="'+itemIcon({slot:craftSlot10,rarity:0,name:SLOTS[craftSlot10]})+'" alt=""><div><small>RESULTADO ALEATÓRIO</small><b>'+esc(SLOTS[craftSlot10])+'</b><span>Nível de uso '+lo+'–'+hi+' · '+esc(C().name)+'</span><small>Raridade, qualidade, atributos e encaixes são sorteados.</small></div></div><div class="title43"><h3>Escolha os materiais</h3><small>2. Combine as qualidades</small></div>'+materials+(req['boss:'+z]?recipeRows({['boss:'+z]:req['boss:'+z]}):'')+'<section class="forge44-odds"><div class="title43"><h3>Chances de fabricação</h3><small>Qualidade média '+(quality+1).toLocaleString('pt-BR',{maximumFractionDigits:2})+'/5</small></div><div class="forge44-strip">'+odds.map((v,i)=>'<i style="width:'+v+'%;background:'+RARITIES[i][1]+'"></i>').join('')+'</div>'+odds.map((v,i)=>'<div class="forge44-odds-row"><span style="color:'+RARITIES[i][1]+'">'+esc(RARITIES[i][0])+'</span><b>'+chance(v)+'</b></div>').join('')+'<p class="muted">Materiais melhores aumentam as chances de raridades altas. Nenhuma raridade é garantida.</p></section><div class="forge43-checks">'+check('Materiais',hasMat10(req),hasMat10(req)?'Completos':'Insuficientes')+check('Ouro',state.gold>=cost,fmt(state.gold)+' / '+fmt(cost)+' ◈')+check('Nível',state.level>=ZONES[z].level,'Nv. '+ZONES[z].level+'+')+check('Inventário',state.inventory.length<120,state.inventory.length+'/120')+check('Local',atCity(),'Vespera')+'</div><button class="primary forge43-craft" data-craft10'+disabled(!ok)+'>3. Fabricar · '+fmt(cost)+' ◈</button></section>';
};
const forge0=forgePanel;forgePanel=function(){
 if(forgeOwner!==state){forgeOwner=state;forgeFeedback='';forgeTab='craft';}
 let h;
 if(forgeTab==='craft')h=craftPanel10();else{const all=forge0(),craft=craftPanel10(),at=all.indexOf(craft);h=at>=0?all.slice(0,at)+all.slice(at+craft.length):all;const it=selectedForge();if(it)h='<div class="forge43-upgrade"><b>Aprimoramento +'+it.upgrade+' / 10</b>'+bar(it.upgrade,10)+'<small>'+(it.upgrade>=10?'Nível máximo': 'Próximo nível: +'+(it.upgrade+1)+' · Sucesso garantido · '+fmt(forgeCost(it))+' ◈')+'</small></div>'+h;}
 return '<header class="forge43-head"><div><small>VESPERA · OFICINA DE BRAM</small><h2>Forja</h2></div><b>'+fmt(state.gold)+' ◈</b></header><nav class="forge43-tabs">'+[['craft','Fabricar'],['upgrade','Aprimorar e runas']].map(([k,n])=>'<button class="secondary '+(forgeTab===k?'active':'')+'" data-forge43="'+k+'">'+n+'</button>').join('')+'</nav>'+(forgeFeedback?'<p class="forge43-feedback" role="status">'+esc(forgeFeedback)+'</p>':'')+h;
};
const craft0=craft10;craft10=function(){const r=craft0();if(r){const it=state.inventory.at(-1);forgeFeedback='Fabricado: '+it.name+' · '+RARITIES[it.rarity][0]+' · iLvl '+window.eldoria45ItemPower(it);}return r;};
const up0=doUpgrade;doUpgrade=function(it){const ok=up0(it);if(ok)forgeFeedback=it.name+' aprimorado para +'+it.upgrade+'.';return ok;};
// Record only actual completed collection cycles; do not change the simulation.
let recent=null;
const round0=round;round=function(...args){
 if(!state.cls||state.mode!=='gather'||!state.active)return round0(...args);
 const p=profState10(),before=p.total,xp=p.xp,level=p.level,owner=state,prof=state.profession,z=state.profZone;
 const stocks=RARITIES.map((_,i)=>state.materials?.[prof+':'+z+':'+i]||0),r=round0(...args);
 if(state===owner&&p.total>before){recent={owner,prof,z,count:p.total-before,level:p.level,levelUp:p.level>level,delta:RARITIES.map((_,i)=>(state.materials[prof+':'+z+':'+i]||0)-stocks[i])};}return r;
};
const prof0=profPanel10;profPanel10=function(){
 const p=profState10(),v=PROF10[state.profession],z=state.profZone,running=state.mode==='gather'&&state.active,interval=6-(p.talents.speed||0),h=prof0();
 const latest=recent?.owner===state&&recent.prof===state.profession&&recent.z===z?recent:null;
 const dash='<section class="gather43-live"><div class="title43"><h3>'+ (running?'● Coleta em andamento':'○ Coleta pausada')+'</h3><small>'+esc(ZONES[z].name)+'</small></div><div class="gather43-cycle"><img src="'+materialIcon19(state.profession+':'+z+':0')+'" alt=""><div><b>'+esc(MAT10[state.profession+':'+z+':0']?.name||v.name)+'</b><small>Próximo ciclo '+Math.max(0,interval-p.ticks)+' s · intervalo '+interval+' s</small>'+bar(p.ticks,interval)+'</div></div><div class="gather43-last"><b>Última coleta</b><span>'+(latest?latest.delta.map((n,i)=>n>0?'<span style="color:'+RARITIES[i][1]+'">+'+n+' '+esc(RARITIES[i][0])+'</span>':'').filter(Boolean).join(' · ')||'+'+latest.count+' recursos':'Nenhum ciclo registrado nesta sessão')+'</span>'+(latest?.levelUp?'<strong>Nível '+latest.level+' alcançado!</strong>':'')+'</div></section>';
 return h.includes('data-p29-run')?h.replace('<section class="g29-panel"><div class="g29-between"><h3>Expedição de coleta</h3>',dash+'<section class="g29-panel"><div class="g29-between"><h3>Expedição de coleta</h3>').replace(/<div class="g29-between"><span>Próxima coleta<\/span>[\s\S]*?<div class="g29-actions">/,'<div class="g29-actions">'):h;
};
})();
