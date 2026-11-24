/* 0.41.1 — original creature cues and contextual inspection. */
(()=>{
'use strict';
const fight=()=>state.cls&&state.active&&!state.rest&&['hunt','dungeon','boss','trial'].includes(state.mode)&&!window.eldoria31Interlude?.();
const live=()=>fight()&&audioReady11();
const profile=()=>bossArena()?creatureSound11():CREATURE_SOUND11[ALIAS16[state.enemy]||state.enemy]||creatureSound11();
const note=(f,d,a,w,end,delay=0)=>soundNote11('fx',f,d,a,w,end,delay);
const noise=(d,a,f,type='bandpass',delay=0)=>soundNoise11('fx',d,a,f,type,delay);
function attack(){if(!live())return;const [f,end,w,n]=profile();note(f,.24,.105,w,end);noise(.19,.10,n);note(bossArena()?68:88,.23,.085,'triangle',30);noise(.14,.065,320,'lowpass');if(bossArena())note(48,.38,.06,'sine',24);}
function death(p){const [f,end,w,n]=p;note(f*.8,.42,.10,w,Math.max(28,end*.48));noise(.39,.105,n*.72);noise(.21,.085,1450,'bandpass',.09);note(84,.38,.10,'triangle',25);noise(.28,.07,230,'lowpass',.04);}
const launch0=launch11;launch11=function(side,...args){if(side==='enemy')attack();return launch0(side,...args);};
const impact0=impact11;impact11=function(side,...args){if(side==='enemy'&&!foeRanged11())attack();return impact0(side,...args);};
const sfx0=window.eldoria32SFX;window.eldoria32SFX=function(kind,...args){if(kind==='incoming'){if(live()){noise(.13,.075,620);note(72,.15,.07,'triangle',29);}return;}const r=sfx0?.(kind,...args);if(audioReady11()&&['attack','servant','defeat'].includes(kind)){note(kind==='attack'?105:80,.18,.08,'triangle',30);noise(.13,.065,kind==='attack'?950:460);}return r;};
const win0=win;win=function(...args){const show=live(),p=show?profile():null,k=state.kills;const r=win0(...args);if(show&&state.kills>k&&audioReady11())death(p);return r;};
let enemySkill=false;const status0=enemyStatus;enemyStatus=function(...args){const prev=enemySkill;enemySkill=true;try{return status0(...args);}finally{enemySkill=prev;}};
const apply0=applyStatus;applyStatus=function(side,key,...args){const r=apply0(side,key,...args);if(r&&side==='hero'&&enemySkill&&live()){const tones={burn:[140,55,620],poison:[180,48,470],freeze:[880,340,2200],shock:[470,90,1700],bleed:[200,75,1400],slow:[280,90,440],stun:[95,31,360],expose:[340,160,980]};const [f,end,n]=tones[key]||[260,100,850];note(f,.34,.09,key==='shock'?'triangle':'sine',end);noise(.29,.085,n);note(f*1.5,.22,.04,'sine',end*1.5,.05);note(92,.24,.07,'triangle',32);}return r;};
const tone43=tone10;tone10=function(kind){const r=tone43(kind);if(audioReady11()){note(95,.20,.07,'triangle',29);noise(.15,.055,['freeze','shock','holy'].includes(kind)?1550:480);}return r;};
// Explicit inspection works on touch, keyboard and mouse without changing equip actions.
const dialog=document.createElement('dialog');dialog.id='inspect42';dialog.setAttribute('aria-label','Detalhes do equipamento');
const head=document.createElement('header');const title=document.createElement('h2');title.textContent='Detalhes do equipamento';const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='Fechar';close.onclick=()=>dialog.close();head.append(title,close);const content=document.createElement('div');dialog.append(head,content);document.body.append(dialog);
window.eldoria42OpenItem=function(id){const it=state.inventory.find(x=>x.id===id)||vaultState11().find(x=>x.id===id);if(!it)return;tooltip.classList.add('hidden');content.innerHTML=window.eldoria42Inspect(it,true);if(!dialog.open)dialog.showModal();};
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-inspect42]');if(b){e.preventDefault();e.stopImmediatePropagation();window.eldoria42OpenItem(+b.dataset.inspect42);}},true);
document.addEventListener('focusin',e=>{const b=e.target.closest?.('[data-itemid],[data-gearitem],[data-v-id]');if(!b||!state.cls||!b.matches(':focus-visible'))return;const id=Number(b.dataset.itemid||b.dataset.gearitem||b.dataset.vId),it=state.inventory.find(x=>x.id===id)||vaultState11().find(x=>x.id===id);if(!it)return;tooltip.innerHTML=itemInfo(it);tooltip.classList.remove('hidden');const r=b.getBoundingClientRect();tooltip.style.left=Math.max(4,Math.min(r.right+8,innerWidth-tooltip.offsetWidth-6))+'px';tooltip.style.top=Math.max(4,Math.min(r.top,innerHeight-tooltip.offsetHeight-6))+'px';});
document.addEventListener('keydown',e=>{const b=e.target.closest?.('[data-itemid],[data-gearitem],[data-v-id]');if(b&&e.key==='i'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.eldoria42OpenItem(Number(b.dataset.itemid||b.dataset.gearitem||b.dataset.vId));}});
})();
