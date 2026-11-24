/* 0.45.0 — crafting progression model, independent of game rendering. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const need=l=>Math.round(24+5*l+.13*l*l);
const xp=(level,recipe,ok)=>Math.max(1,Math.round((28+recipe*2)*(ok?1:.35)*Math.max(.08,1-Math.max(0,level-recipe-4)*.06)));
const success=(level,recipe,quality)=>clamp(.72+.018*(level-recipe)+.025*quality,.72,.97);
function advance(p,n){p.xp+=n;while(p.level<100&&p.xp>=need(p.level)){p.xp-=need(p.level);p.level++;}if(p.level>=100)p.xp=0;return p;}
const eligible=(it,slot,tier,cls,equipped,presets=[])=>!!(it&&it.slot===slot&&it.tier===tier-1&&it.relic==null&&!it.locked&&!it.name?.includes('de aprendiz')&&(!it.vocation||it.vocation===cls)&&!equipped.includes(it.id)&&!presets.includes(it.id));
const gatherXP=(l,z)=>Math.max(1,Math.round((5+z*3)*Math.max(.15,1-Math.max(0,l-(z*10+10))*.035)));
const api={need,xp,success,advance,eligible,gatherXP};root.eldoria50Model=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
