/* 0.44.0 — pure progression model. All formulas operate on character level, not selected region. */
(function(root){
'use strict';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const positive=n=>Math.max(0,Number.isFinite(n)?n:0);
const level=n=>Math.min(100,Math.max(1,positive(n)))+Math.log2(1+Math.max(0,positive(n)-100))*.4;
const soft=(n,k,s=.4)=>{n=positive(n);return Math.min(n,k)+Math.max(0,n-k)*s;};
const round=n=>Math.round(n*100)/100;
const itemFactors=Object.freeze({damage:.62,hp:.65,def:.70,str:.65,dex:.65,int:.65,vit:.65,wis:.65,skill:.55,crit:.70,haste:.70,tenacity:.75,mana:.75,regen:.65,r30reduction:.65,r30regen:.65,r30recovery:.65,r30dodge:.70,r30critmult:.65,r30special:.65,r30heal:.70,r30move:1});
function itemMod(k,n,starter=false){return round(positive(n)*(starter?1:(itemFactors[k]??1)));}
function damageParts(l,a,main,gear){const x=level(l);return {level:5+.72*x,primary:.58*soft(a[main],12+1.4*x),secondary:Object.entries({str:.22,dex:.14,int:.15,wis:.12}).reduce((sum,[k,w])=>sum+(k===main?0:w*soft(a[k],8+.8*x)),0),gear:positive(gear)};}
function hpBase(l,vit,gear){const x=level(l);return 52+3.8*x+4.8*soft(vit,10+.95*x)+positive(gear);}
function defenseBase(l,vit,gear){const x=level(l);return 1+.46*x+.32*soft(vit,10+x)+positive(gear);}
function mastery(n){return 1+.004*soft(n,100,.25);}
function armor(def,z){return Math.min(.56,positive(def)/(positive(def)+48+10*Math.max(0,z)));}
const regionHP=Object.freeze([1.25,1.23,1.20,1.14,1.08,1.04,1.02,1,1,1]);
const regionATK=Object.freeze([1.04,1.04,1.03,1.02,1,1,1,1,1,1]);
const limits=Object.freeze({crit:.42,critMult:2.5,haste:.25,reduction:.42,tenacity:.40,heal:.55,special:2.55,regen:6,servant:.44});
function finalStats(s,l,cls,main,gear){
 const p=damageParts(l,s.a,main,gear.damage),d=p.level+p.primary+p.secondary+p.gear,h=hpBase(l,s.a.vit,gear.hp);
 // Preserve vocation, sets, relics, buffs and talents, but taper stacking after a generous budget.
 s.dmg=Math.max(1,soft(s.dmg,d*1.45,.45));
 s.h=Math.max(1,Math.round(soft(s.h,h*1.30,.45)));
 s.def=Math.max(0,s.def);
 s.crit=clamp(s.crit,0,limits.crit);s.critMult=clamp(s.critMult,1.25,limits.critMult);
 s.dodge=clamp(s.dodge,0,cls==='ranger'?.24:.18);s.haste=clamp(s.haste,0,limits.haste);
 s.reduction=clamp(s.reduction,0,limits.reduction);s.tenacity=clamp(s.tenacity,0,limits.tenacity);
 s.special=clamp(1.25+soft(s.special-1.25,.70,.38),1.25,limits.special);
 s.heal=clamp(s.heal||0,0,limits.heal);
 s.mana=Math.max(1,Math.round(30+(s.mana-30)*.72));s.manaRegen=clamp(1+Math.max(0,s.manaRegen-1)*.65,0,limits.regen);
 if(cls==='necro')s.necroPower=clamp(s.necroPower*.88,0,limits.servant);
 return s;
}
function skill(d){d={...d};d.mana=Math.max(1,Math.ceil(d.mana*1.15));d.cd=Math.max(4,Math.ceil(d.cd));if(d.power)d.power=Math.min(1.8,d.power*.86);if(d.heal)d.heal=Math.min(.16,d.heal*.80);if(d.buff13){const b=d.buff13;d.buff13={...b,value:b.value*(['dmg','reduction'].includes(b.stat)?.75:.85)};}return d;}
function hitBudget(side,n,initial){if(!(initial>0)||!(n>0))return n;return side==='hero'?Math.min(n,Math.ceil(initial*1.40)):Math.max(n,Math.floor(initial*.70));}
const api=Object.freeze({soft,level,itemMod,itemFactors,damageParts,hpBase,defenseBase,mastery,armor,regionHP,regionATK,limits,finalStats,skill,hitBudget});
root.eldoria49Model=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
