/* Run: node tools/testar_balanceamento.js — pure model regression tests, not a game simulation. */
const assert=require('node:assert/strict'),m=require('../js/49-modelo.js');
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const classes={war:'str',ranger:'dex',mage:'int',cleric:'wis',necro:'int'};
let count=0;
for(const [cls,main] of Object.entries(classes)){
 let lastD=0,lastH=0;
 for(let z=0;z<10;z++){
  const l=1+z*10,a={str:3,dex:3,int:3,vit:6,wis:3};a[main]+=5+(l-1)*1.5;a.vit+=(l-1)*.75;
  const g=m.itemMod('damage',3+z*13),h=m.itemMod('hp',z*42);
  const d=sum(m.damageParts(l,a,main,g))*m.mastery(l-1),hp=m.hpBase(l,a.vit,h);
  assert(d>lastD&&hp>lastH,cls+' growth');lastD=d;lastH=hp;
  assert(sum(m.damageParts(l,a,main,g+1))>sum(m.damageParts(l,a,main,g)));
  assert(m.hpBase(l,a.vit+1,h)>hp);assert(m.armor(100000,z)<=.56);count++;
 }
}
assert.equal(m.itemMod('damage',100),62);assert.equal(m.itemMod('damage',3,true),3);
assert.equal(m.skill({mana:10,cd:2,power:3,heal:.4}).power,1.8);
assert.equal(m.hitBudget('hero',300,100),140);assert.equal(m.hitBudget('enemy',20,100),70);
console.log(count+' combinações de vocação/região verificadas; limites e retornos marginais OK.');
