
/* 0.27 — second balance pass and trade specializations. */
(()=>{'use strict';
const originalEnemy=enemy;enemy=function(){const e=originalEnemy();if(!state.cls||!['hunt','boss','dungeon'].includes(state.mode))return e;if(bossArena()){return {...e,hp:Math.round(e.hp*1.28),xp:Math.round(e.xp*1.13),gold:Math.round(e.gold*1.10)};}return e;};
const oldMovement27=moveCombat11;moveCombat11=function(now,dt){return oldMovement27(now,state.cls==='war'&&state.mode==='dungeon'&&!bossArena()?dt*1.45:dt);};
const prevStats=stats;stats=function(eq=state.equipment){const s=prevStats(eq);if(!state.cls)return s;const c=state.cls;if(state.level>=13){if(c==='mage'&&!bossArena())s.dmg*=.94;if(c==='war'&&state.mode==='dungeon'&&!bossArena())s.dmg*=1.20;if(c==='ranger'&&bossArena()){s.dmg*=1.08;s.reduction=Math.min(.52,s.reduction+.075);}}return s;};
const normal=normalizeWorld;normalizeWorld=function(){normal();if(!state.cls)return;if(!state.hpScale27){if(['boss','dungeon'].includes(state.mode)&&bossArena())state.enemyHp=Math.min(enemy().hp,Math.round(state.enemyHp*1.28));state.hpScale27=1;}};
// Artisan paths use the same materials and existing production ledger. No new currencies.
const specNames={mining:['Veio profundo','Lapidação'],wood:['Corte seletivo','Resinas antigas'],herb:['Colheita cuidadosa','Botânica ritual']};
function spec(p){return p.level>=15&&['yield','quality'].includes(p.spec27)?p.spec27:null;}
const odds=profOdds10;profOdds10=function(p){const a=odds(p);if(spec(p)==='quality'){const k=p.level>=40?1.8:1;a[0]-=k;a[2]+=.82*k;a[3]+=.16*k;a[4]+=.02*k;}a[0]+=100-a.reduce((x,y)=>x+y,0);return a;};
const add=matAdd10;matAdd10=function(k,n=1,analyze=false){const r=add(k,n,analyze);if(state.mode==='gather'&&state.active&&k.startsWith(state.profession+':')&&k===`${state.profession}:${state.profZone}:${k.split(':')[2]}`){const p=profState10();if(spec(p)==='yield'&&Math.random()<(p.level>=40?.16:.09)){add(k,1,analyze);p.total++;}}return r;};
const prof=profPanel10;profPanel10=function(){const p=profState10(),names=specNames[state.profession],current=spec(p),cost=120+p.level*8;return `<section class="v27-stage"><div class="v27-between"><b>Especialização de ofício</b><small>níveis 15 e 40</small></div><p>Selecione uma técnica por profissão. A troca exige ouro e deve ser feita em Vespera.</p><div class="v27-duo">${['yield','quality'].map((id,i)=>`<article><b>${names[i]}</b><p>${i?'Transfere 1 p.p. da chance comum para raro, épico e lendário; 1,8 p.p. no nível 40.':'9% de chance de recurso adicional; 16% no nível 40.'}</p><button class="secondary ${current===id?'active':''}" data-v27-prof="${id}" ${p.level<15||!atCity()||current===id||current&&state.gold<cost?'disabled':''}>${current===id?'Selecionado ✓':current?'Trocar · '+cost+' ouro':'Especializar'}</button></article>`).join('')}</div></section>`+prof();};
document.addEventListener('click',e=>{const btn=e.target.closest('[data-v27-prof]');if(!btn||btn.disabled||!atCity())return;const p=profState10(),v=btn.dataset.v27Prof,c=spec(p),cost=120+p.level*8;if(p.level<15||!['yield','quality'].includes(v)||c===v||c&&state.gold<cost)return;if(c)state.gold-=cost;p.spec27=v;render();save();},true);
// High rarity crafting is still scarce, but avoids requiring several independent ultra-rare profession drops.
const req=craftReq10;craftReq10=function(slot,z,r){const a=req(slot,z,r);if(r===4){for(const k of Object.keys(a)){if(k.endsWith(':4'))a[k]=1;}}return a;};
const oldSave=save;save=function(){const ret=oldSave();return ret;};
})();

