/* 0.44.0 — final balance layer, existing inventory/save IDs retained. */
(()=>{
'use strict';
const m=window.eldoria49Model;
const fighting=()=>state.cls&&['hunt','boss','dungeon','trial'].includes(state.mode);
const starter=it=>typeof it.name==='string'&&it.name.includes('de aprendiz');
const rebuild0=rebuildItem;
rebuildItem=function(it){const r=rebuild0(it);for(const k of Object.keys(it.mods||{}))it.mods[k]=m.itemMod(k,it.mods[k],starter(it));return r;};
const item0=item;item=function(...args){return rebuildItem(item0(...args));};
// Static region curves. No level matching or hidden weakening of the player in old zones.
for(const [z,region] of ZONES.entries()){
 for(const id of region.enemy){const e=ENEMIES[id];e.hp=Math.round(e.hp*m.regionHP[z]);e.atk=Math.round(e.atk*m.regionATK[z]);}
 RELICS[z].hp=Math.round(RELICS[z].hp*m.regionHP[z]);RELICS[z].atk=Math.round(RELICS[z].atk*m.regionATK[z]);
}
window.eldoria26.armor=m.armor;
const stat0=stats;stats=function(eq=state.equipment){const s=stat0(eq);if(!state.cls)return s;return m.finalStats(s,state.level,state.cls,C().main,{damage:gearAttr('damage',eq),hp:gearAttr('hp',eq)});};
const sd0=skillData;skillData=function(k){return m.skill(sd0(k));};
const skillDesc0=skillDescription;skillDescription=function(k){return skillDesc0(k)+' · Potência, cura e recarga refletem o balanceamento atual.';};
// Preserve individual procs, but stop multiplicative conditional stacks from dominating a hit.
let context=null;
window.eldoria49HitBudget=(side,n)=>context?.side===side?m.hitBudget(side,n,context.n):n;
const hit0=impact11;impact11=function(side,n,crit,cast,s){
 if(!fighting()||!(n>0))return hit0(side,n,crit,cast,s);
 const prev=context,owner=state,mode=state.mode,hp=state.hp,mp=state.mana;
 context={side,n};try{return hit0(side,n,crit,cast,s);}finally{
 context=prev;
 if(state===owner&&state.mode===mode&&side==='hero'){
  if(state.hp>hp)state.hp=Math.min(s.h,hp+Math.min(state.hp-hp,Math.max(1,Math.round(s.h*.20))));
  if(state.mana>mp)state.mana=Math.min(s.mana,mp+Math.min(state.mana-mp,Math.max(1,Math.round(s.mana*.12))));
 }
 }
};
const victory0=win;win=function(...args){const owner=state,mode=state.mode,l=state.level,k=state.kills,hp=state.hp;const r=victory0(...args);if(state===owner&&state.mode===mode&&state.level===l&&state.kills>k&&fighting()&&state.hp>hp){const h=stats().h;state.hp=Math.min(h,hp+Math.min(state.hp-hp,Math.max(1,Math.round(h*.08))));}return r;};
// Existing saves: recalculated equipment from original rolls, retain encounter percentage and clamp resources.
const fresh0=fresh;fresh=function(...args){const d=fresh0(...args);d.balance49=1;return d;};
const norm0=normalizeWorld;normalizeWorld=function(...args){
 const migrating=!!state.cls&&!state.balance49,oldHP=state.enemyHp,had28=!!state.balance28;
 const r=norm0(...args);if(!state.cls)return r;
 if(migrating){if(fighting()&&had28&&Number.isFinite(oldHP)){const e=enemy(),f=state.mode==='trial'?1:m.regionHP[state.zone];state.enemyHp=Math.max(0,Math.min(e.hp,Math.round(oldHP*f)));}
 state.balance49=1;}
 const s=stats();state.hp=clamp(state.hp,0,s.h);if(Number.isFinite(state.mana))state.mana=clamp(state.mana,0,s.mana);
 return r;
};
const req0=skillNeed;skillNeed=function(){return Math.max(1,Math.round(req0()*1.20));};
// Tooltip descriptions use the new base formulas, before additional class and talent modifiers.
ATTR.str[1]='Força: 0,58 de dano base por ponto para Guerreiro; 0,22 como secundário. Retornos decrescentes após o limite de atributo por nível; melhora dano crítico.';
ATTR.dex[1]='Destreza: 0,58 de dano base por ponto para Arqueiro; 0,14 como secundário. Retornos decrescentes; melhora crítico, esquiva e ataque extra, sujeitos aos limites.';
ATTR.int[1]='Inteligência: 0,58 de dano base por ponto para Mago e Necromante; 0,15 como secundário. Retornos decrescentes; melhora mana, habilidades e lacaios.';
ATTR.wis[1]='Sabedoria: 0,58 de dano base por ponto para Clérigo; 0,12 como secundário. Retornos decrescentes; melhora cura, mana e lacaios.';
ATTR.vit[1]='Vitalidade: 4,8 PV e 0,32 defesa base por ponto antes dos retornos decrescentes; melhora tenacidade.';
window.eldoria49Balance=Object.freeze({model:m,version:'0.44.0'});
})();
