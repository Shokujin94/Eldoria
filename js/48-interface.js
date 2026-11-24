/* 0.43.3 — unified character window and shared inspection. */
(()=>{
'use strict';
const hero=$('content-hero'),sheet=$('sheetExtra'),gear=$('content-equip'),gearWindow=windows.equip;
if(!hero||!sheet||!gear||!gearWindow)return;
let page='sheet';
const tabs=document.createElement('nav');
tabs.className='character48-tabs';
tabs.setAttribute('aria-label','Seções do personagem');
tabs.innerHTML='<button type="button" class="secondary" data-character48="sheet" aria-controls="sheetExtra" aria-pressed="true">Ficha</button><button type="button" class="secondary" data-character48="gear" aria-controls="content-equip" aria-pressed="false">Equipamentos</button>';
sheet.before(tabs);
gear.classList.remove('window-body');
gear.classList.add('character48-gear');
sheet.after(gear);
gearWindow.classList.add('hidden');
const oldButton=document.querySelector('.quicknav [data-window="equip"]');
if(oldButton){oldButton.hidden=true;oldButton.setAttribute('aria-hidden','true');oldButton.tabIndex=-1;}
const heroButton=document.querySelector('.quicknav [data-window="hero"]');
if(heroButton){heroButton.title='Personagem · ficha e equipamentos';heroButton.setAttribute('aria-label','Personagem');const label=heroButton.querySelector('.navtext');if(label)label.textContent='Personagem';}
const head=windows.hero.querySelector('.window-head h2');
if(head){const svg=head.querySelector('svg');head.replaceChildren(...(svg?[svg]:[]),document.createTextNode(' Personagem'));}
windows.hero.setAttribute('aria-label','Personagem: ficha e equipamentos');
const close=windows.hero.querySelector('.window-head button');if(close)close.setAttribute('aria-label','Fechar personagem');
WINDOW_DEFS.hero[1]='Personagem';
WINDOW_DEFS.hero[2]=740;WINDOW_DEFS.hero[3]=680;
function select(next,paint=true){
 page=next==='gear'?'gear':'sheet';
 sheet.hidden=page!=='sheet';gear.hidden=page!=='gear';
 for(const b of tabs.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.character48===page));
 if(typeof tooltip!=='undefined'&&tooltip)tooltip.classList.add('hidden');
 if(paint&&state.cls){if(page==='gear')renderRefined('equip');else renderSheet();}
}
tabs.addEventListener('click',e=>{const b=e.target.closest('[data-character48]');if(b){select(b.dataset.character48);hero.scrollTop=0;}});
const open0=openWindow,toggle0=toggleWindow,close0=closeWindow;
openWindow=function(id){
 if(!['hero','attr','equip'].includes(id)||!state.cls)return open0(id);
 const next=id==='equip'?'gear':'sheet',changed=page!==next;
 select(next,false);const ret=open0('hero');
 if(page==='gear')renderRefined('equip');else renderSheet();
 if(changed)hero.scrollTop=0;
 return ret;
};
toggleWindow=function(id){
 if(!['hero','attr','equip'].includes(id))return toggle0(id);
 if(!state.cls)return;
 if(windows.hero.classList.contains('hidden')||id==='equip'&&page!=='gear'||id==='attr'&&page!=='sheet')return openWindow(id);
 return closeWindow('hero');
};
closeWindow=function(id){
 if(id==='hero'||id==='equip'||id==='attr'){if(typeof tooltip!=='undefined'&&tooltip)tooltip.classList.add('hidden');if(id==='equip'||id==='attr')return close0(id);}
 return close0(id);
};
const refresh0=refreshWindows;
refreshWindows=function(...args){
 const ret=refresh0(...args);
 if(state.cls&&page==='gear'&&!windows.hero.classList.contains('hidden'))renderRefined('equip');
 return ret;
};
// Keep the existing point allocation, reset and keyboard/touch tooltip handlers.
const attributes0=window.eldoria43Attributes;
if(typeof attributes0==='function')window.eldoria43Attributes=function(...args){
 const t=document.createElement('template');t.innerHTML=attributes0(...args);
 for(const card of t.content.querySelectorAll('.attr43')){
  const p=card.querySelector('p'),split=card.querySelector('.attr43-split');
  if(!p||!split)continue;
  const detail=document.createElement('button');detail.type='button';detail.className='detail38 attr48-detail';
  detail.dataset.detail38=[p.textContent.trim(),...[...split.querySelectorAll('span')].map(s=>s.textContent.trim())].join(' · ');
  detail.textContent='Composição e efeitos ⓘ';p.replaceWith(detail);split.remove();
 }
 return t.innerHTML;
};
select('sheet',false);
window.eldoria48Character={get page(){return page;},select};
})();
