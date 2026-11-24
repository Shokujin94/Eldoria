/* 0.43.1 — resource scenery, refined navigation and vocation synergies. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.eldoria46MoreFilters=false;
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-bag46-filters]');if(b){e.preventDefault();window.eldoria46MoreFilters=!window.eldoria46MoreFilters;renderRefined('bag');}},true);
// A region-specific resource palette. Shapes remain distinct even at small scale.
const minerals=['#9da6a7','#c4d4e4','#a48ac2','#9bb5a1','#b7e1f4','#b9b2a1','#c6b19a','#ec9b64','#b79bd7','#df92b5'];
const timber=['#64865c','#5e8a88','#a27552','#6d8960','#89adb1','#949779','#a5a17a','#aa694d','#9680ad','#795b86'];
const herbs=['#c3dc97','#bca5e6','#edb079','#87d3a1','#b6e5fa','#d8cfb1','#d4bd83','#f0a17f','#c8a4ef','#ed9bba'];
window.eldoria46GatherSprite=function(c,x,y,kind,z,i,now){
 z=clamp(z|0,0,9);const n=1+(i%3)*.06;
 c.save();try{
 c.translate(Math.round(x),Math.round(y+9));c.scale(n,n);
 c.fillStyle='#0b11169c';c.beginPath();c.ellipse(0,0,kind==='wood'?24:19,6,0,0,Math.PI*2);c.fill();
 const poly=(color,points)=>{c.fillStyle=color;c.beginPath();points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill();};
 if(kind==='mining'){
 const hue=minerals[z];poly('#232a2d',[[-22,-3],[-19,-17],[-8,-28],[10,-26],[20,-15],[23,-3],[9,2],[-9,2]]);
 poly('#454b50',[[-19,-17],[-8,-28],[5,-21],[1,-7],[-18,-3]]);
 poly('#666b6b',[[5,-21],[10,-26],[20,-15],[16,-8],[1,-7]]);
 poly('#31373e',[[1,-7],[16,-8],[23,-3],[9,2]]);
 for(const [a,b,w,h] of [[-12,-15,7,10],[0,-21,8,13],[9,-13,6,8]]){poly(hue,[[a,b],[a+w*.5,b-h*.35],[a+w,b],[a+w*.6,b+h],[a,b+h*.65]]);poly('#fff8',[[a,b],[a+w*.5,b-h*.35],[a+w*.4,b+h*.3]]);}
 }else if(kind==='wood'){
 const hue=timber[z];poly('#30251f',[[-8,0],[-5,-44],[3,-46],[8,0],[16,2],[-17,2]]);
 poly('#88674b',[[-4,-46],[1,-43],[4,-5],[-2,-2]]);poly('#573e32',[[-4,-25],[-18,-43],[-13,-47],[2,-32],[15,-51],[19,-47],[5,-23]]);
 const crown=(cx,cy,w)=>{poly('#283a30',[[cx-w,cy],[cx-w*.75,cy-12],[cx,cy-21],[cx+w*.8,cy-12],[cx+w,cy],[cx+w*.35,cy+8],[cx-w*.5,cy+7]]);poly(hue,[[cx-w*.8,cy-3],[cx-w*.5,cy-13],[cx,cy-17],[cx+w*.65,cy-8],[cx+w*.2,cy+2],[cx-w*.5,cy+2]]);};
 crown(-14,-40,15);crown(14,-46,17);crown(0,-57,21);
 }else{
 const hue=herbs[z];for(const [a,b] of [[-12,-17],[0,-26],[12,-20]]){poly('#35543a',[[0,0],[a-3,b],[a,b-4],[a+3,b],[2,0]]);poly('#72975c',[[0,-4],[a-11,b-2],[a-4,b+9],[0,-1]]);poly(hue,[[a-7,b],[a-6,b-7],[a,b-11],[a+6,b-7],[a+7,b],[a,b+3]]);c.fillStyle='#f4e4a2';c.fillRect(a-2,b-5,4,4);}
 }
 const target=Math.floor(profState10().total)%18===i&&state.active;
 if(target){c.strokeStyle='#e9dca3';c.globalAlpha=.45+.18*Math.sin(now/260);c.lineWidth=1.4;c.beginPath();c.ellipse(0,0,kind==='wood'?28:23,8,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;c.font='bold 10px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#111519';c.fillStyle='#f3e8c8';const label=PROF10[kind]?.resource[z]||PROF10[kind]?.name||'';c.strokeText(label,0,19);c.fillText(label,0,19);}
 }finally{c.restore();}
};
// Distinct active/passive interactions for the three base paths of each vocation.
// Existing IDs, prerequisites, mana, rank limits and save format remain valid.
const paths={
 war:[
 {name:'Ferida de execução',condition:'alvo sangrando',effect:'dano',base:.05,per:.02,test:c=>c.bleed},
 {name:'Contra-guarda',condition:'guarda ativa',effect:'defesa',base:.03,per:.015,test:c=>c.guard},
 {name:'Ritmo de ferro',condition:'alvo exposto',effect:'mana',base:.012,per:.008,test:c=>c.expose}],
 ranger:[
 {name:'Disparo de precisão',condition:'distância ≥ 75% do alcance',effect:'dano',base:.06,per:.02,test:c=>c.far},
 {name:'Recuo tático',condition:'inimigo a menos de 55% do alcance',effect:'defesa',base:.025,per:.015,test:c=>c.near},
 {name:'Toxina recuperadora',condition:'alvo envenenado',effect:'mana',base:.015,per:.008,test:c=>c.poison}],
 mage:[
 {name:'Combustão',condition:'alvo queimando',effect:'dano',base:.06,per:.02,test:c=>c.burn},
 {name:'Prisma glacial',condition:'alvo lento ou congelado',effect:'defesa',base:.025,per:.015,test:c=>c.ice},
 {name:'Convergência elemental',condition:'elemento diferente da última habilidade ofensiva',effect:'mana',base:.025,per:.01,test:c=>c.alternate}],
 cleric:[
 {name:'Veredito sagrado',condition:'alvo exposto',effect:'dano',base:.05,per:.02,test:c=>c.expose},
 {name:'Misericórdia',condition:'habilidade de cura e PV abaixo de 60%',effect:'cura',base:.01,per:.006,test:c=>c.healing&&c.low60},
 {name:'Voto inabalável',condition:'guarda ativa',effect:'defesa',base:.03,per:.015,test:c=>c.guard}],
 necro:[
 {name:'Comando funerário',condition:'lacaio ativo',effect:'lacaio',base:1,per:0,test:c=>c.servant},
 {name:'Pacto de sangue',condition:'PV abaixo de 60%',effect:'dreno',base:.015,per:.008,test:c=>c.low60},
 {name:'Decomposição',condition:'alvo envenenado ou exposto',effect:'dano',base:.05,per:.02,test:c=>c.poison||c.expose}]
};
const id46=(cl,i)=>'t33_'+cl+'_'+i+'_0',pct=v=>Number((v*100).toFixed(2)).toLocaleString('pt-BR')+'%';
const amount=(p,r)=>p.effect==='lacaio'?1:p.base+p.per*r;
function description(p,r){
 const v=amount(p,Math.max(1,r));
 return p.name+' (requer a passiva raiz do caminho): se '+p.condition+', '+({dano:'+'+pct(v)+' de dano direto da habilidade',defesa:'−'+pct(v)+' de dano direto recebido (passiva com técnica do caminho aprendida)',mana:'recupera '+pct(v)+' da mana máxima no acerto',cura:'cura adicional de '+pct(v)+' do PV máximo',dreno:'recupera '+pct(v)+' do dano direto efetivamente causado como PV',lacaio:'prolonga o lacaio com menor duração em 1 s (até '+(12+r)+' s)'})[p.effect]+'.';
}
const nodes0=nodes;nodes=function(){return nodes0().map((arr,i)=>arr.map(n=>{
 const p=paths[state.cls]?.[i];if(!p||n.id!==id46(state.cls,i))return n;
 return {...n,desc:n.desc+' · Sinergia: '+description(p,rank(n.id))+(p.effect==='lacaio'?' O limite sobe 1 s por graduação.':' O efeito aumenta '+pct(p.per)+' por graduação.')};
}));};
function pathIndex(id){return window.eldoria33?.trees?.[state.cls]?.base?.findIndex(b=>b.some(n=>n.id===id))??-1;}
const skill0=skillDescription;skillDescription=function(k){const p=paths[state.cls]?.[pathIndex(k.id)];if(!p||k.buff13||p.effect==='defesa')return skill0(k);return skill0(k)+' · '+description(p,rank(id46(state.cls,pathIndex(k.id))));};
let memory={owner:null,element:null};
const spawn0=spawn;spawn=function(...args){memory={owner:state,element:null};return spawn0(...args);};
function context(s,cast){if(memory.owner!==state)memory={owner:state,element:null};const foe=enemyPoint(gameNow28()),d=Math.hypot(foe.x-pos.x,foe.y-pos.y),el=cast?skillElement12(cast.id):null,has=k=>hasStatus('enemy',k);return {bleed:has('bleed'),expose:has('expose'),poison:has('poison'),burn:has('burn'),ice:has('slow')||has('freeze'),guard:state.guardTurns>0,far:d>=range11()*.75,near:d<range11()*.55,low60:state.hp<s.h*.60,healing:!!cast?.heal,servant:!!state.necro30?.servants?.length,alternate:!!el&&!!memory.element&&el!==memory.element,element:el};}
const impact0=impact11;impact11=function(side,n,crit,cast,s){
 if(!state.cls||!state.active||state.rest||!['hunt','dungeon','boss','trial'].includes(state.mode)||!(n>0))return impact0(side,n,crit,cast,s);
 const owner=state,mode=state.mode,before=state.enemyHp,c=context(s,cast),ps=paths[state.cls]||[],i=cast&&!cast.buff13?pathIndex(cast.id):-1,p=ps[i],r=rank(id46(state.cls,i)),trigger=side==='hero'&&p&&r>0&&p.test(c);
 if(trigger&&p.effect==='dano')n=Math.round(n*(1+amount(p,r)));
 if(side==='enemy'){
  for(let j=0;j<ps.length;j++){const q=ps[j],pr=rank(id46(state.cls,j)),learned=window.eldoria33.trees[state.cls].base[j].some(t=>t.active&&rank(t.id)>0);if(q.effect==='defesa'&&pr>0&&learned&&q.test(c)){n=Math.max(1,Math.round(n*(1-amount(q,pr))));break;}}
 }
 const ret=impact0(side,n,crit,cast,s);
 if(side!=='hero'||state!==owner||state.mode!==mode||state.enemyHp>=before||!cast||cast.buff13)return ret;
 memory.element=c.element;
 if(trigger){window.eldoria35Proc?.(id46(state.cls,i));const v=amount(p,r);if(p.effect==='mana')state.mana=Math.min(s.mana,state.mana+Math.max(1,Math.round(s.mana*v)));else if(p.effect==='cura')state.hp=Math.min(s.h,state.hp+Math.max(1,Math.round(s.h*v)));else if(p.effect==='dreno')state.hp=Math.min(s.h,state.hp+Math.round((before-state.enemyHp)*v));else if(p.effect==='lacaio'){const a=(state.necro30?.servants||[]).reduce((best,a)=>!best||a.left<best.left?a:best,null);if(a&&a.left<12+r)a.left=Math.min(12+r,a.left+1);}}
 return ret;
};
window.eldoria46Synergy={paths,description,amount};
// Keep the equipment table available without pushing the selected slot out of view.
let gearPage='gear';
const gear0=gearPanel;gearPanel=function(){
 const h=gear0(),at=h.indexOf('<h3 class="gear-heading">');if(at<0)return h;
 return '<nav class="gear46-tabs"><button class="secondary" data-gear46="gear" aria-pressed="'+(gearPage==='gear')+'">Equipado</button><button class="secondary" data-gear46="stats" aria-pressed="'+(gearPage==='stats')+'">Bônus e conjuntos</button></nav>'+(gearPage==='gear'?h.slice(0,at):h.slice(at));
};
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-gear46]');if(b){gearPage=b.dataset.gear46==='stats'?'stats':'gear';renderRefined('equip');}},true);
})();
