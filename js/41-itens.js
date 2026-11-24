/* 0.41.0 — regional equipment, independent rolls and conditional item powers. */
(()=>{
'use strict';
const clamp41=(x,a,b)=>Math.max(a,Math.min(b,x)),pick=(a,rng)=>a[Math.min(a.length-1,Math.floor(rng()*a.length))],roll=(a,b,rng)=>a+Math.floor(clamp41(rng(),0,.999999999)*(b-a+1));
const qFactor=[.85,1,1.12,1.25],rarFactor=[1,1.19,1.43,1.73,2.10],affixCount=[0,1,2,3,4];
const slotBase={
 weapon:{damage:7.5},offhand:{def:2.0,damage:1.3},armor:{def:3.1,hp:12},head:{def:1.3,hp:5},legs:{def:1.7,hp:4.5},hands:{damage:1.2,crit:1},feet:{def:1.1,dex:1},ring:{crit:1,skill:1.5},accessory:{crit:1.7,mana:3}
};
const pools={
 weapon:['damage','crit','skill','haste','str','dex','int','wis','r30critmult','r30special'],
 offhand:['def','hp','mana','vit','crit','tenacity','r30reduction','r30regen','wis'],
 armor:['def','hp','vit','tenacity','r30reduction','str','dex','int','wis'],
 head:['hp','def','mana','vit','int','wis','tenacity','r30heal','r30regen'],
 legs:['hp','def','vit','dex','tenacity','r30recovery','r30dodge','str','wis'],
 hands:['damage','crit','haste','skill','str','dex','int','wis','r30critmult'],
 feet:['def','dex','vit','haste','tenacity','r30dodge','r30recovery','mana'],
 ring:['crit','skill','mana','regen','haste','r30critmult','r30special','r30heal','int','wis'],
 accessory:['hp','mana','crit','regen','wis','int','vit','r30special','r30heal','r30regen']
};
const affixNames={damage:'Ferocidade',def:'Proteção',hp:'Vigor',crit:'Precisão',skill:'Maestria',str:'Força',dex:'Agilidade',int:'Intelecto',vit:'Resiliência',wis:'Discernimento',mana:'Reserva arcana',regen:'Fluxo',haste:'Cadência',tenacity:'Firmeza',r30reduction:'Égide',r30regen:'Meditação',r30recovery:'Renovação',r30dodge:'Evasão',r30critmult:'Devastação',r30special:'Ritual',r30heal:'Graça'};
const powers={
 execute:{name:'Fúria do Ocaso',min:8,max:12,desc:v=>'+'+v+'% de dano direto contra inimigos abaixo de 30% de PV.'},
 ward:{name:'Última Vigília',min:5,max:8,desc:v=>'Reduz em '+v+'% o dano direto recebido enquanto seu PV estiver abaixo de 40%.'},
 resonance:{name:'Ressonância Arcana',min:5,max:9,desc:v=>'+'+v+'% de dano direto de habilidades enquanto tiver ao menos 60% de mana.'},
 harvest:{name:'Colheita Vital',min:1,max:2,desc:v=>'Recupera '+v+'% do PV máximo ao derrotar um inimigo em combate.'},
 pact:{name:'Pacto Sepulcral',min:2,max:4,desc:v=>'+'+v+' pontos percentuais de poder dos lacaios do Necromante (limite total de 60%).'}
};
function regionRange(z){const a=ZONES[z]?.level||1,b=ZONES[z+1]?.level;return [a,b?b-1:a+9];}
function sourceRange(z,mode,id){
 const [lo,hi]=regionRange(z);
 if(mode==='hunt'){const i=Math.max(0,ZONES[z].enemy.indexOf(id));return [Math.min(hi,lo+i*2),Math.min(hi,lo+i*2+2)];}
 if(mode==='dungeon')return [Math.min(hi,lo+3),hi];
 if(mode==='boss')return [Math.min(hi,lo+6),hi];
 return [lo,Math.min(hi,lo+4)];
}
function bounds(k,n,level,rarity,quality,affix=false){
 const scale=1+(level-1)*.105,rf=rarFactor[rarity],q=qFactor[quality];
 const small={crit:[.75,1,5],haste:[.75,1,5],tenacity:[.75,1,6],regen:[.45,.34,3],r30regen:[1,.6,6],r30reduction:[.65,.32,3],r30recovery:[.65,.24,3],r30dodge:[.65,.32,3],r30critmult:[1.2,.70,7],r30special:[1,.45,4],r30heal:[1,.40,4]};
 let center;
 if(small[k]){const [base,slope,cap]=small[k];center=Math.min(cap,(base+slope*Math.sqrt(scale-1))*rf*q*(affix?.85:1));}
 else if(k==='damage'&&!affix&&n>=7){center=(4+3.5*scale)*rf*q;}
 else {center=n*scale*rf*q*(affix?1:1);}
 const low=Math.max(1,Math.floor(center*.84)),high=Math.max(low+1,Math.ceil(center*1.16));
 const cap=small[k]?.[2];return cap?[Math.min(cap,low),Math.min(cap,high)]:[low,high];
}
function generate(it,mode,id,rng=Math.random){
 const z=it.tier,r=clamp41(it.rarity|0,0,4),q=clamp41(it.quality??1,0,3)|0,v=it.vocation||state.cls;
 const [lo,hi]=sourceRange(z,mode,id),level=roll(lo,hi,rng),main=CLASSES[v].main;
 const inherent={...slotBase[it.slot]},raw={},ranges={},affixes=[];
 inherent[main]=(inherent[main]||0)+1;
 if(['armor','head','legs','offhand'].includes(it.slot)){const k=v==='ranger'?'dex':v==='mage'?'int':'vit';inherent[k]=(inherent[k]||0)+.65;}
 if(['mage','cleric','necro'].includes(v)&&['weapon','offhand','ring','accessory'].includes(it.slot))inherent.mana=(inherent.mana||0)+2.4;
 if(v==='ranger'&&['weapon','hands','feet'].includes(it.slot))inherent.haste=1;
 if(v==='war'&&['armor','offhand'].includes(it.slot))inherent.tenacity=1;
 if(v==='necro'&&it.slot==='ring')inherent.regen=1;
 function add(k,n,affix){const [min,max]=bounds(k,n,level,r,q,affix),value=roll(min,max,rng);raw[k]=value;ranges[k]=[min,max];if(affix)affixes.push(k);}
 for(const [k,n] of Object.entries(inherent))add(k,n,false);
 const options=pools[it.slot].filter(k=>!Object.hasOwn(raw,k));
 for(let i=0;i<affixCount[r]&&options.length;i++){
  const k=pick(options,rng);options.splice(options.indexOf(k),1);
  const weight=k==='hp'?5.5:k==='mana'?3:k==='damage'?1.5:k==='def'?1.25:k==='skill'?1.2:.8;
  add(k,weight,true);
 }
 const pool=Object.keys(powers).filter(k=>k!=='pact'||v==='necro');
 let power=null;if(r>=3&&rng()<(r===3?.12:.30)){const key=pick(pool,rng),p=powers[key];power={key,value:roll(p.min,p.max,rng)};}
 return {level,required:level,source:mode||'forge',ranges,affixes,power,baseMods:raw};
}
let lootMode=null;
const loot0=addLoot;addLoot=function(mode,...args){const prev=lootMode;lootMode=mode;try{return loot0(mode,...args);}finally{lootMode=prev;}};
const item0=item;item=function(...args){
 const it=item0(...args);if(it.relic!==null||!ZONES[it.tier]||!slotBase[it.slot])return it;
 const data=generate(it,lootMode,state.enemy);it.baseMods=data.baseMods;delete data.baseMods;it.loot41=data;return rebuildItem(it);
};
function meta(it){const m=it?.loot41;return m&&Number.isInteger(m.level)&&m.level>=1&&m.level<=100&&m.required===m.level&&m.ranges&&Array.isArray(m.affixes)?m:null;}
const req0=reqItem;reqItem=function(it){const r=req0(it),m=meta(it);if(!m)return r;return {...r,level:m.required,value:Math.min(Math.round(3+m.level*(r.key==='vit'?.36:.49)+it.rarity*.5),Math.floor((m.level-1)*.65)+5)};};
function bestPower(eq,key){let best=0;const p=powers[key];for(const id of Object.values(eq||{})){const it=state.inventory.find(x=>x.id===id),a=meta(it)?.power;if(a?.key===key&&Number.isInteger(a.value)&&a.value>=p.min&&a.value<=p.max)best=Math.max(best,a.value);}return best;}
const stats0=stats;stats=function(eq=state.equipment){const s=stats0(eq);if(state.cls==='necro')s.necroPower=Math.min(.60,s.necroPower+bestPower(eq,'pact')/100);return s;};
const combat=()=>state.active&&!state.rest&&['hunt','dungeon','boss','trial'].includes(state.mode)&&!window.eldoria31Interlude?.();
const impact0=impact11;impact11=function(side,n,crit,cast,s){
 if(state.cls&&combat()&&n>0){if(side==='hero'){
  let bonus=0;if(state.enemyHp<enemy().hp*.30)bonus+=bestPower(state.equipment,'execute');if(cast&&state.mana>=s.mana*.60)bonus+=bestPower(state.equipment,'resonance');
  n=Math.round(n*(1+Math.min(18,bonus)/100));
 }else if(state.hp<s.h*.40)n=Math.max(1,Math.round(n*(1-bestPower(state.equipment,'ward')/100)));}
 return impact0(side,n,crit,cast,s);
};
const win0=win;win=function(...args){const eligible=state.cls&&['hunt','dungeon','boss'].includes(state.mode),bonus=eligible?bestPower(state.equipment,'harvest'):0,owner=state;const r=win0(...args);if(bonus&&state===owner&&state.hp>0&&['hunt','dungeon','boss'].includes(state.mode)){const h=stats().h;state.hp=Math.min(h,state.hp+Math.round(h*bonus/100));}return r;};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceNames={hunt:'Caçada',dungeon:'Dungeon',boss:'Chefe',forge:'Forja'};
const info0=itemInfo;itemInfo=function(it){
 const m=meta(it),base=info0(it);if(!m)return base+'<div class="loot41-legacy">Equipamento anterior à 0.41 · valores preservados'+(it.relic!==null?' · Relíquia exclusiva':'')+'</div>';
 const rows=Object.entries(m.ranges).filter(([k,r])=>Array.isArray(r)&&r.length===2&&r.every(Number.isFinite)&&Number.isFinite(it.baseMods?.[k])).map(([k,[min,max]])=>{
  const value=it.baseMods[k],p=max===min?100:clamp41(Math.round((value-min)/(max-min)*100),0,100),affix=m.affixes.includes(k);
  return '<div class="loot41-row"><span title="'+esc(affix?affixNames[k]||k:'Atributo base')+'">'+(affix?'◆ ':'')+esc(modNames[k]||k)+'</span><b>'+value+'</b><small>'+min+'–'+max+'</small><i style="--roll:'+p+'%"></i></div>';
 }).join('');
 const u=m.power,p=u&&powers[u.key];
 return '<div class="loot41-meta"><b>iLvl '+m.level+'</b><span>Nv. '+m.required+' · '+esc(ZONES[it.tier].name)+' · '+esc(it.crafted?'Forja':sourceNames[m.source]||'Regional')+'</span></div>'+base+
 '<section class="loot41-rolls"><h4>Faixas originais · ◆ Afixo</h4><div class="loot41-row loot41-label"><span>Atributo</span><b>Valor</b><small>Faixa</small><i></i></div>'+rows+'<small>Valores antes de aprimoramentos, refinamento e runas.</small></section>'+
 (p&&Number.isFinite(u.value)?'<div class="loot41-power"><b>✦ '+p.name+'</b><p>'+esc(p.desc(u.value))+'</p><small>Faixa: '+p.min+'–'+p.max+(u.key==='pact'?' p.p.':'%')+' · não acumula com o mesmo poder.</small></div>':'');
};
const atlas0=atlasLoot;atlasLoot=function(z,mode,id){const [lo,hi]=sourceRange(z,mode,id);return '<p class="loot41-atlas"><b>Nível de equipamento: '+lo+'–'+hi+'</b> · Atributos variam com nível, raridade e qualidade. Afixos de 0 a 4.</p>'+atlas0(z,mode,id);};
const craft0=craftPanel10;craftPanel10=function(){const [lo,hi]=sourceRange(craftZone10,'forge');return craft0().replace('</h3>','</h3><p class="loot41-atlas">Nível de equipamento: <b>'+lo+'–'+hi+'</b> · atributos e afixos são sorteados na fabricação.</p>');};
const attr0=attrTable;attrTable=function(){const s=stats(),p=window.eldoria41DamageParts(s.a),fmt=n=>Number(n.toFixed(1)).toLocaleString('pt-BR');return attr0()+'<section class="loot41-breakdown"><h3>Composição do dano base</h3><div><span>Nível e base</span><b>'+fmt(p.level)+'</b><span>'+ATTR[C().main][0]+' (principal)</span><b>'+fmt(p.primary)+'</b><span>Atributos secundários</span><b>'+fmt(p.secondary)+'</b><span>Dano dos equipamentos</span><b>'+fmt(p.gear)+'</b></div><p>Dano médio final: <b>'+fmt(s.dmg)+'</b>. Maestria, talentos, buffs e ajustes de vocação são aplicados sobre a base; crítico, resistência e poderes condicionais são calculados no acerto.</p></section>';};
// Expose pure generation helpers for balancing and reproducible tests, not for save mutation.
window.eldoria41Loot=Object.freeze({regionRange,sourceRange,generate,affixCount:Object.freeze([...affixCount])});
})();
