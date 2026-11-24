/* 0.40.0 — Grimoire of summons, role-specific attacks, and safe saving. */
(()=>{
'use strict';
const roles={
 bone:{name:'Servo original',icon:'⚔',desc:'Combate corpo a corpo; mantém o dano base e os golpes tradicionais.',reach:0,mult:1},
 sentinel:{name:'Sentinela Óssea',icon:'⛨',desc:'Defesa · absorve 12% de um ataque direto a cada 4 s, se estiver a até 150 unidades do dono. Dano: 70% do servo original.',reach:0,mult:.70,guard:true,color:'#c5d1bf'},
 archer:{name:'Arqueiro Espectral',icon:'➶',desc:'Distância · alcance 165; flecha perfurante causa +30% de dano a cada 4 s. Dano base: 85% do servo original.',reach:165,mult:.85,color:'#a6e9bf'},
 herald:{name:'Arauto das Cinzas',icon:'✦',desc:'Suporte · alcance 140; Selo de Cinzas aplica lentidão por 2 s a cada 5 s. Dano: 65% do servo original.',reach:140,mult:.65,color:'#c3a3e8'}
};
const role=a=>Object.hasOwn(roles,a?.type40)?roles[a.type40]:roles.bone;
const choices=()=>Array.isArray(state.necro30?.choices40)?state.necro30.choices40:[];
window.eldoria40ServantRole=role;
window.eldoria40ServantChoice=i=>Object.hasOwn(roles,choices()[i])?choices()[i]:'bone';
const live=()=>!suppress&&!document.hidden&&!catchingUp;
const fighting=()=>state.active&&!state.rest&&['hunt','boss','dungeon','trial'].includes(state.mode)&&!window.eldoria31Interlude?.();
window.eldoria40ServantStrike=function(a,amount){
 const r=role(a);let n=amount*r.mult;
 if(a.type40==='archer'&&!(a.skillCD40>0)){n*=1.30;a.skillCD40=4;if(live()){a.special40=gameNow28();statusText('enemy','Flecha perfurante',r.color);}}
 if(a.type40==='herald'&&!(a.skillCD40>0)){
  a.skillCD40=5;const old=statusState().enemy.slow?.left||0;
  if(applyStatus('enemy','slow',amount)){statusState().enemy.slow.left=Math.max(old,2);if(live()){a.special40=gameNow28();statusText('enemy','Selo de Cinzas',r.color);}}
 }
 return Math.max(1,Math.round(n));
};
const hit=impact11;impact11=function(side,n,...args){
 if(side==='enemy'&&n>0&&state.cls==='necro'&&fighting()){
  const list=state.necro30?.servants||[];
  const a=list.find((v,i)=>{if(v.type40!=='sentinel'||v.left<=0||v.guardCD40>0)return false;const p=window.eldoria36Minions.position(v,i);return !(p.phaseLeft381>0)&&Math.hypot(p.x-pos.x,p.y-pos.y)<=150;});
  if(a){a.guardCD40=4;n=Math.max(1,Math.round(n*.88));if(live()){a.guardFlash40=gameNow28();statusText('hero','Proteção óssea','#c5d1bf');}}
 }
 return hit(side,n,...args);
};
// Character options are persistent; switching is only permitted in the safe city.
const sub0=subPanel;subPanel=function(){
 const body=sub0();if(state.cls!=='necro')return body;
 const count=state.subclass===0?2:1,can=atCity(),row=i=>{
  const selected=window.eldoria40ServantChoice(i);
  return '<div class="soul40-slot"><small>Invocação '+(i+1)+'</small><div class="soul40-grid">'+Object.entries(roles).map(([id,r])=>'<button type="button" class="secondary soul40-choice '+(selected===id?'selected':'')+'" data-soul40="'+id+'" data-soul-slot40="'+i+'" aria-pressed="'+(selected===id)+'" title="'+r.desc+'" '+(!can?'disabled':'')+'><b>'+r.icon+' '+r.name+'</b><small>'+(selected===id?'Selecionado':r.reach?'Distância':r.guard?'Defesa':'Corpo a corpo')+'</small></button>').join('')+'</div><p class="soul40-desc">'+roles[selected].desc+'</p></div>';
 };
 return '<section class="service-card soul40"><h3>Grimório de invocações</h3><p>Escolha o papel de cada lacaio. As próximas evocações respeitam a seleção. '+(can?'Escolhas disponíveis.':'Retorne a Vespera para alterar.')+'</p>'+Array.from({length:count},(_,i)=>row(i)).join('')+'</section>'+body;
};
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-soul40]');if(!b||state.cls!=='necro'||!atCity())return;
 const i=Number(b.dataset.soulSlot40),id=b.dataset.soul40;if(!Object.hasOwn(roles,id)||!Number.isInteger(i)||i<0||i>=(state.subclass===0?2:1))return;
 state.necro30??={servants:[],damage:0};if(!Array.isArray(state.necro30.choices40))state.necro30.choices40=['bone','bone'];state.necro30.choices40[i]=id;save();refreshWindows();
});
const css=document.createElement('style');css.textContent='.soul40-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.soul40-choice{display:flex!important;flex-direction:column;align-items:flex-start;text-align:left;gap:3px;min-height:48px}.soul40-choice.selected{border-color:#9cbb95!important;box-shadow:inset 0 0 0 1px #9cbb95}.soul40-choice small,.soul40-slot>small{color:#b7b49b}.soul40-slot{margin:12px 0}.soul40-desc{font-size:12px;color:#c9c2af}.quick40-save{position:relative}.quick40-save.saved{color:#a8e6a0!important}#quick40-status{position:fixed;bottom:18px;right:18px;z-index:1100;background:#1b201c;border:1px solid #708963;color:#e5e4d5;padding:9px 14px;border-radius:5px;font:13px system-ui;pointer-events:none}#quick40-status[hidden]{display:none}';document.head.append(css);
// Three original canvas silhouettes; no network asset dependency. Keep existing servant art for the original option.
function shape(c,points,fill,stroke='#2b332e',width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function line(c,x1,y1,x2,y2,color,width=1.5){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
window.eldoria40DrawServant=function(a,p,now){
 const r=role(a);if(r===roles.bone)return false;
 const strike=Number.isFinite(a.attack31)&&now>=a.attack31&&now-a.attack31<420,phase=strike?(now-a.attack31)/420:0;
 const pulse=Math.sin(phase*Math.PI),h=(state.mode==='hunt'?72:111.6)*window.ELDORIA_CONFIG.visual.servantScale;
 actor23((c,x,y)=>{
  c.save();try{
   c.translate(x,y+11);c.globalAlpha*=p.phaseLeft381>0?.65:1;c.fillStyle='#101a1788';c.beginPath();c.ellipse(0,-1,16,5,0,0,Math.PI*2);c.fill();
   c.scale((p.dir||1)*h/64,h/64);c.translate(0,Math.sin(now/150)*(p.motion39||0)*1.3);
   c.shadowColor=r.color;c.shadowBlur=3;
   if(a.type40==='sentinel'){
    shape(c,[[-10,-50],[-6,-58],[5,-58],[10,-50],[8,-43],[-8,-43]],'#d6dbce');
    shape(c,[[-11,-42],[11,-42],[16,-28],[9,-12],[-9,-12],[-16,-28]],'#778b7c');
    for(const y0 of [-38,-32,-26])line(c,-7,y0,7,y0,'#d7ddca',3);
    line(c,-7,-14,-9,-2,'#b6c5b3',5);line(c,7,-14,10,-2,'#b6c5b3',5);
    shape(c,[[9,-38],[25,-42],[28,-20],[20,-12],[10,-20]],'#5c796d','#d5d8b9',1.8);
    line(c,19,-36,19,-20,'#d8d6bd',2);line(c,13,-29,25,-29,'#d8d6bd',2);
    line(c,-12,-31,-20-pulse*8,-17,'#c5d1bf',3);line(c,-20-pulse*8,-17,-25-pulse*10,-8,'#eef0dc',3);
   }else if(a.type40==='archer'){
    shape(c,[[-11,-44],[0,-60],[12,-44],[7,-42],[-7,-42]],'#4a7c66');
    shape(c,[[-8,-45],[-6,-52],[6,-52],[8,-45],[0,-40]],'#b3d1bb');
    shape(c,[[-11,-40],[9,-40],[14,-16],[3,-11],[-13,-16]],'#43745e');
    line(c,-6,-16,-9,-2,'#a6c8b6',4);line(c,6,-16,10,-2,'#a6c8b6',4);
    line(c,6,-34,19,-35,'#b8e3cb',3);line(c,-7,-33,10-pulse*7,-35,'#b8e3cb',3);
    c.strokeStyle='#c5e6b5';c.lineWidth=2.2;c.beginPath();c.moveTo(19,-50);c.quadraticCurveTo(37,-34,19,-17);c.stroke();line(c,19,-50,19-pulse*8,-17,'#9fce9c',1);line(c,9,-35,29,-35,'#dbecd0',1.6);
   }else{
    shape(c,[[-14,-42],[-6,-60],[6,-60],[14,-42],[8,-38],[-8,-38]],'#675279');
    shape(c,[[-6,-49],[6,-49],[5,-42],[-5,-42]],'#c7b7db');line(c,-4,-46,-1,-46,'#6d468c',2);line(c,1,-46,4,-46,'#6d468c',2);
    shape(c,[[-10,-39],[10,-39],[21,-6],[5,-10],[0,-2],[-8,-10],[-20,-5]],'#655079','#a88bc4');
    line(c,9,-34,23,-31,'#c8b3df',3);line(c,23,-56,23,-3,'#a38bbb',2);
    c.fillStyle='#e1bfff';c.beginPath();c.arc(23,-57,5+pulse*2,0,Math.PI*2);c.fill();
   }
   if(a.type40!=='herald'){c.fillStyle='#163a2d';c.fillRect(-5,-49,3,2);c.fillRect(2,-49,3,2);}
  }finally{c.restore();}
 },p.x,p.y);
 if(strike&&r.reach){const e=enemyPoint(now),t=phase,sy=p.y-h*.50,ey=e.y-(state.mode==='hunt'?28:45),x=p.x+(e.x-p.x)*t,y=sy+(ey-sy)*t;ctx.save();try{ctx.globalAlpha=1-t*.65;ctx.shadowColor=r.color;ctx.shadowBlur=8;ctx.strokeStyle=r.color;ctx.lineWidth=a.type40==='archer'?2:3;ctx.beginPath();ctx.moveTo(p.x+(x-p.x)*.65,sy+(y-sy)*.65);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=r.color;ctx.beginPath();ctx.arc(x,y,a.type40==='archer'?2:5,0,Math.PI*2);ctx.fill();}finally{ctx.restore();}}
 const guardAge=now-(a.guardFlash40??-1e9);if(guardAge>=0&&guardAge<500){ctx.save();ctx.strokeStyle=r.color;ctx.globalAlpha=1-guardAge/500;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(pos.x,pos.y-25,23,33,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 return true;
};
// The normal verified save remains the single source of truth.
window.eldoria40QuickSave=function(){if(!state.cls||!window.eldoriaBoot251?.ready)return false;advance();return !!save();};
const nav=document.querySelector('.quicknav'),button=document.createElement('button');button.type='button';button.className='direct14 quick40-save';button.title='Salvar progresso imediatamente';button.innerHTML='<span class="navicon" aria-hidden="true">▣</span><span class="navtext">Salvar</span>';button.setAttribute('aria-label','Quick save: salvar progresso');
const status=document.createElement('div');status.id='quick40-status';status.hidden=true;status.setAttribute('role','status');document.body.append(status);nav?.append(button);
let timer;
button.onclick=()=>{const ok=window.eldoria40QuickSave();button.classList.toggle('saved',ok);status.textContent=ok?'Progresso salvo e verificado.':'Não foi possível salvar. Exporte um backup.';status.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{status.hidden=true;button.classList.remove('saved');},2400);};
function autosave(){if(state.cls&&window.eldoriaBoot251?.ready)window.eldoria40QuickSave();}
setInterval(autosave,15000);
window.addEventListener('beforeunload',autosave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)autosave();else if(state.huntDeath40&&state.cls){delete state.huntDeath40;if($('notice')){$('notice').textContent='Você foi derrotado enquanto estava ausente e retornou a Vespera. A caçada foi encerrada.';$('notice').classList.remove('hidden');}save();}});
})();
