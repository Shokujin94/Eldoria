/* 0.45.0 — collection and crafting, one validated transaction for every equipment recipe. */
(()=>{
'use strict';
const m=window.eldoria50Model,esc=s=>String(s??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k])),pct=n=>(n*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
const profile=()=>state.craft50??={level:1,xp:0,success:0,fail:0};
let owner=null,levelChoice=0,baseChoice=0,feedback='',bossRecipe=false,lastZone=-1,lastSlot='';
const sync=()=>{if(owner!==state){owner=state;levelChoice=0;baseChoice=0;feedback='';bossRecipe=false;lastZone=-1;lastSlot='';}if(lastZone!==craftZone10||lastSlot!==craftSlot10){lastZone=craftZone10;lastSlot=craftSlot10;levelChoice=0;baseChoice=0;if(craftSlot10!=='accessory'||!state.era20?.recipe?.[craftZone10])bossRecipe=false;}};
const previous=(slot,z)=>state.inventory.filter(it=>m.eligible(it,slot,z,state.cls,Object.values(state.equipment),Object.values(state.era20?.presets||{}).flatMap(p=>Object.values(p.equipment||{}))));
const option=(v,label,sel)=>'<option value="'+v+'"'+(sel?' selected':'')+'>'+esc(label)+'</option>';
const bar=(n,d)=>'<div class="g29-meter"><i style="width:'+Math.min(100,100*n/Math.max(1,d))+'%"></i></div>';
function plan(){
 ensure10();sync();const z=craftZone10,slot=craftSlot10,p=profile(),[lo,hi]=window.eldoria41Loot.sourceRange(z,'forge');
 const l=Number.isInteger(levelChoice)&&levelChoice>=lo&&levelChoice<=hi?levelChoice:lo;
 const rare=bossRecipe&&slot==='accessory'&&!!state.era20?.recipe?.[z];
 const normal=craftPlan44(slot,z),req=rare?{['boss:'+z]:1,['mining:'+z+':2']:4}:normal.req,cost=rare?150*(z+1):normal.cost,quality=rare?2:normal.quality;
 const candidates=z?previous(slot,z):[],base=z?candidates.find(it=>it.id===baseChoice):null,success=m.success(p.level,l,quality);
 const checks=[['Cidade',atCity(),'Vespera'],['Personagem',state.level>=l,'Nv. '+state.level+' / '+l],['Fabricação',p.level>=l,'Nv. '+p.level+' / '+l],['Materiais',hasMat10(req),'Receita completa'],['Ouro',state.gold>=cost,fmt(state.gold)+' / '+fmt(cost)],['Espaço',state.inventory.length<120||!!base,state.inventory.length+'/120'],['Peça anterior',!z||!!base,z?'Tier '+z:'Dispensada']];
 return {z,slot,p,lo,hi,l,rare,req,cost,quality,odds:rare?[0,0,0,100,0]:normal.odds,parts:normal.parts,candidates,base,success,checks,ok:checks.every(x=>x[1])};
}
function craftSound(ok){if(!audioReady11())return;soundNote11('fx',ok?430:120,.19,.06,'triangle',ok?760:48);soundNoise11('fx',.13,.045,ok?1800:280,'bandpass');}
craft10=function(){
 if(!state.cls||!ZONES[craftZone10]||!SLOTS[craftSlot10])return false;
 const q=plan();if(!q.ok){feedback='Requisitos não atendidos.';return false;}
 const won=Math.random()<q.success;
 let it=null;
 if(won){window.eldoria50CraftLevel=q.l;try{it=item(q.slot,q.z,craftRoll44(q.odds));}finally{delete window.eldoria50CraftLevel;}if(!it||it.loot41?.required!==q.l){feedback='Falha interna de receita; nenhum recurso consumido.';return false;}}
 takeMat10(q.req);state.gold-=q.cost;const gain=m.xp(q.p.level,q.l,won),old=q.p.level;
 if(won){if(q.base)state.inventory=state.inventory.filter(x=>x.id!==q.base.id);it.crafted=true;it.materialGrade=Math.floor(q.quality);it.materialQuality44=q.quality;state.inventory.push(it);q.p.success++;baseChoice=0;feedback='Sucesso · '+it.name+' · '+RARITIES[it.rarity][0];}
 else{q.p.fail++;feedback='Falha · materiais e ouro consumidos. '+(q.base?'Peça anterior preservada.':'');}
 m.advance(q.p,gain);feedback+=' · +'+gain+' XP'+(q.p.level>old?' · Fabricação Nv. '+q.p.level:'');log(feedback,won?'rare':'bad');craftSound(won);return won;
};
function craftProgress(p){return '<section class="craft50-progress"><div class="title43"><h3>Maestria de fabricação</h3><b>Nv. '+p.level+'/100</b></div>'+bar(p.xp,p.level===100?1:m.need(p.level))+'<small>'+(p.level===100?'Nível máximo':fmt(p.xp)+' / '+fmt(m.need(p.level))+' XP')+' · '+fmt(p.success)+' sucessos · '+fmt(p.fail)+' falhas</small></section>';}
craftPanel10=function(){
 const q=plan(),z=q.z,r=q.p;
 const selectors='<div class="craft-select10"><label>Região / Tier<select id="craftZone10">'+ZONES.map((v,i)=>option(i,'T'+(i+1)+' · '+v.name,i===z)).join('')+'</select></label><label>Peça<select id="craftSlot10">'+Object.entries(SLOTS).map(([k,v])=>option(k,v,k===q.slot)).join('')+'</select></label><label>Nível do item<select data-craft50-level>'+Array.from({length:q.hi-q.lo+1},(_,i)=>option(q.lo+i,'Nv. '+(q.lo+i),q.lo+i===q.l)).join('')+'</select></label></div>';
 const mats=Object.entries(q.req).map(([k,n])=>{const mat=MAT10[k],kind=k.split(':')[0],rar=mat.rarity,have=state.materials[k]||0;return '<div class="forge44-choice"><img src="'+materialIcon19(k)+'" alt=""><label><b style="color:'+RARITIES[rar][1]+'">'+esc(mat.name)+'</b>'+(!q.rare&&kind!=='boss'?'<select data-craft-material44="'+kind+'">'+RARITIES.map(([name],i)=>option(i,name+' · '+fmt(state.materials[kind+':'+z+':'+i]||0)+'/'+n,i===rar)).join('')+'</select>':'<small>'+esc(RARITIES[rar][0])+'</small>')+'</label><strong class="'+(have>=n?'ok43':'bad09')+'">'+fmt(have)+' / '+n+'</strong></div>';}).join('');
 const base=z?'<section class="craft50-section"><h3>Peça base · Tier '+z+'</h3><label>Mesmo tipo de equipamento<select data-craft50-base>'+option(0,'Selecione uma peça não equipada',!q.base)+q.candidates.map(it=>option(it.id,it.name+' · '+RARITIES[it.rarity][0]+' · #'+it.id,it.id===baseChoice)).join('')+'</select></label>'+(q.base?'<div class="craft50-base"><img src="'+itemIcon(q.base)+'" alt=""><span>'+esc(q.base.name)+'<small>Consumida somente em caso de sucesso.</small></span></div>':'<p class="muted">Peças protegidas, equipadas, de presets, relíquias e arma de aprendiz não são aceitas.</p>')+'</section>':'';
 return '<section class="forge43-recipe craft50">'+craftProgress(r)+(feedback?'<p class="forge43-feedback" role="status">'+esc(feedback)+'</p>':'')+'<div class="title43"><h3>Receita de equipamento</h3><small>Tier '+(z+1)+'</small></div>'+selectors+(q.slot==='accessory'&&state.era20?.recipe?.[z]?'<label><input type="checkbox" data-craft50-boss '+(q.rare?'checked':'')+'> Receita épica de chefe desbloqueada</label>':'')+'<div class="forge43-result"><img src="'+itemIcon({slot:q.slot,rarity:0,name:SLOTS[q.slot]})+'" alt=""><div><small>RESULTADO</small><b>'+esc(SLOTS[q.slot])+'</b><span>Nv. '+q.l+' · '+esc(C().name)+'</span></div></div>'+base+'<div class="title43"><h3>Materiais</h3><small>Qualidade influencia o resultado</small></div>'+mats+'<section class="craft50-section"><div class="title43"><h3>Chance de fabricação</h3><b>'+pct(q.success)+' sucesso</b></div><div class="craft50-chance"><i style="width:'+q.success*100+'%"></i></div><small>'+pct(1-q.success)+' falha · consome materiais e ouro; preserva a peça base.</small><details><summary>Raridade em caso de sucesso</summary>'+q.odds.map((v,i)=>'<div class="forge44-odds-row"><span style="color:'+RARITIES[i][1]+'">'+esc(RARITIES[i][0])+'</span><b>'+pct(v/100)+'</b></div>').join('')+'</details></section><div class="forge43-checks">'+q.checks.map(([label,ok,value])=>'<div><span>'+esc(label)+'</span><b class="'+(ok?'ok43':'bad09')+'">'+(ok?'✓ ':'✗ ')+esc(value)+'</b></div>').join('')+'</div><button class="primary forge43-craft" data-craft10 '+(q.ok?'':'disabled')+'>Fabricar · '+fmt(q.cost)+' ◈</button></section>';
};
const forgeRoot=$('content-forge');forgeRoot.addEventListener('change',e=>{const d=e.target.dataset;if(d.craft50Level!==undefined)levelChoice=+e.target.value;else if(d.craft50Base!==undefined)baseChoice=+e.target.value;else if(d.craft50Boss!==undefined)bossRecipe=e.target.checked;else return;refreshWindows();},true);
const prof0=profPanel10;profPanel10=function(){return craftProgress(profile())+prof0().replace(/(\+\d+ XP por coleta \(base\))/g,'XP de coleta depende do nível e da região').replace(/(<h3>Ofícios de fabricação<\/h3>)[\s\S]*?(<div class="g29-actions">)/,'$1<p>Ferraria e Joalheria compartilham a maestria de fabricação. Alquimia e encantamento mantêm os serviços próprios em Crônicas.</p>$2');};
// Original collection cycles remain authoritative for both online and offline rewards.
const live=()=>!suppress&&!catchingUp&&!document.hidden;
const sprite0=window.eldoria46GatherSprite,fx=new Map(),area=()=>state.mode+':'+state.zone+':'+state.profession;
let fxOwner=null,fxArea='';
function checkArea(){const a=area();if(fxOwner!==state||fxArea!==a){fx.clear();fxOwner=state;fxArea=a;}}
function capture(kind,z,index,now){try{
 const image=document.createElement('canvas');image.width=96;image.height=96;const c=image.getContext('2d',{willReadFrequently:true});if(!c)return null;
 sprite0(c,48,76,kind,z,index,now);const data=c.getImageData(0,0,96,96).data,parts=[];
 for(let y=0;y<76;y+=5)for(let x=0;x<96;x+=5){let opaque=false;for(let j=y;j<Math.min(y+5,76)&&!opaque;j++)for(let i=x;i<Math.min(x+5,96);i++)if(data[(j*96+i)*4+3]>85){opaque=true;break;}if(opaque)parts.push({x,y,vx:(x-48)*.8+(Math.random()-.5)*18,vy:-15-Math.random()*32,spin:(Math.random()-.5)*5});}
 return {image,parts,t:now};
 }catch{return null;}}
window.eldoria46GatherSprite=function(c,x,y,kind,z,i,now){
 checkArea();const f=fx.get(i);if(!f)return sprite0(c,x,y,kind,z,i,now);
 const t=(now-f.t)/1000;if(t>=1.15){fx.delete(i);return sprite0(c,x,y,kind,z,i,now);}
 if(t<0)return sprite0(c,x,y,kind,z,i,now);
 if(t<.85){c.save();try{c.translate(x,y);c.imageSmoothingEnabled=false;c.globalAlpha=1-Math.min(1,Math.max(0,(t-.28)/.57));for(const a of f.parts){c.save();c.translate(a.x-48+2.5+a.vx*t,a.y-76+2.5+a.vy*t+65*t*t);c.rotate(a.spin*t);c.drawImage(f.image,a.x,a.y,5,5,-2.5,-2.5,5,5);c.restore();}}finally{c.restore();}}
 if(t>.75){c.save();c.globalAlpha=Math.min(1,(t-.75)/.4);sprite0(c,x,y,kind,z,i,now);c.restore();}
};
function gatherSound(kind,z){if(!audioReady11())return;
 if(kind==='mining'){soundNote11('fx',720+z*40,.12,.085,'triangle',180);soundNoise11('fx',.18,.055,2600+z*100,'bandpass');soundNote11('fx',220,.18,.045,'sine',80,.05);}
 else if(kind==='wood'){soundNoise11('fx',.16,.085,700,'lowpass');soundNote11('fx',135,.19,.07,'triangle',52);soundNoise11('fx',.18,.04,1300,'bandpass',.08);}
 else {soundNoise11('fx',.22,.065,2300,'highpass');soundNote11('fx',410,.15,.025,'sine',240,.03);}
}
const round0=round;round=function(...args){
 if(!state.cls||state.mode!=='gather'||!state.active)return round0(...args);
 const p=profState10(),old=p.total,kind=state.profession,z=state.profZone,index=Math.floor(old)%18,show=live(),stock=show?RARITIES.map((_,i)=>state.materials?.[kind+':'+z+':'+i]||0):null;
 const ret=round0(...args);
 if(show&&p.total>old&&state.mode==='gather'&&state.profession===kind&&state.profZone===z){checkArea();const now=performance.now(),f=capture(kind,z,index,now);if(f)fx.set(index,f);gatherSound(kind,z);const drops=RARITIES.map((_,i)=>{const k=kind+':'+z+':'+i;return {name:MAT10[k].name,rar:i,src:materialIcon19(k),n:(state.materials[k]||0)-stock[i],kind:'Material'};}).filter(d=>d.n>0);window.eldoria50GatherLoot?.(gatherPoint34(index),drops);}
 return ret;
};
window.eldoria50OpenCraft=function(slot,z,rare=false){if(!state.cls)return;sync();craftSlot10=slot;craftZone10=z;levelChoice=0;baseChoice=0;lastZone=z;lastSlot=slot;bossRecipe=rare;document.querySelector('.era-modal')?.classList.add('hidden');openWindow('forge');document.querySelector('[data-forge43="craft"]')?.click();refreshWindows();};
})();
