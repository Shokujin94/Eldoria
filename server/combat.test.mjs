import test from 'node:test';import assert from 'node:assert/strict';import * as c from './combat.mjs';
test('all five catalogues, valid prerequisites, rank gates and mana',()=>{for(const cls of ['war','ranger','mage','cleric','necro']){const s=c.normalize({level:2,skill:1,hp:100});const all=c.tree(cls,s).flatMap(p=>p.nodes);assert.equal(new Set(all.map(n=>n.id)).size,all.length);for(const n of all)for(const k of n.req)assert(all.some(x=>x.id===k),cls+' '+k);assert(c.canLearn(cls,s,'x'));s.talents.x=1;assert(!c.canLearn(cls,s,'x'));assert(!c.canLearn(cls,s,'s160'));const st={hp:100,mana:100,manaRegen:1,damage:10,crit:0,critMult:1.6,haste:0,special:1.5,heal:0,def:4,dodge:0,reduction:0};s.mana=100;const a={z:0,turn:2,enemy:{hp:100,atk:3},enemyHp:100,effects:{}};c.turn(cls,s,st,a,()=>.5,false);assert(s.mana<100);assert(a.enemyHp<100);assert(s.cooldowns.x>=4);assert(s.casts.x===1);assert(!c.eligibleTrial(s));}});

test('potions consume stock, enforce cooldown and auto thresholds',()=>{const s=c.normalize({hp:20,mana:10,level:2});s.potions.hp1=2;s.autoPotion.hp=30;const st={hp:100,mana:100};c.autoPotion(s,st);assert.equal(s.hp,45);assert.equal(s.potions.hp1,1);assert.equal(c.usePotion(s,st,'hp1'),false);assert.equal(c.usePotion(s,st,'__proto__'),false);s.potionCD.hp=0;assert(c.usePotion(s,st,'hp1'));assert.equal(s.potions.hp1,0);});

test('movement approaches target without overlap; slowed enemy and servant',()=>{const s=c.normalize({level:2,servant:10}),a={positions:{hero:.25,enemy:.75,servant:.34},effects:{slow:{left:3}}};const st={move:0};c.move('necro',s,st,a,false);assert(a.positions.hero>.25);assert(a.positions.enemy<.75);assert(a.positions.servant>.34);for(let i=0;i<20;i++)c.move('necro',s,st,a,false);assert(a.positions.enemy-a.positions.hero>=.1199);assert(a.positions.enemy-a.positions.servant<=.16);});

test('affixes, elemental combo and boss warnings follow server rules',()=>{const a={mode:'dungeon',difficulty:4,wave:1,z:0,enemy:{hp:100,atk:20,xp:10,gold:10}};c.encounterTraits(a,()=>.5);assert.equal(a.affixes.length,3);assert.equal(new Set(a.affixes).size,3);assert.equal(a.enemy.hp,196);a.effects={poison:{left:4}};assert.equal(c.combo(a,'fire',100),25);assert.equal(a.effects.poison,undefined);assert.equal(c.enemyResistance({mode:'hunt',z:0,affixes:['armor','ghost']},'physical',false),.60);const b={mode:'boss',z:0,enemy:{hp:100,atk:20},enemyHp:30,bossClock:6};const s=c.normalize({hp:25,defensive:true});const st={hp:100,reduction:0};c.bossMechanic(s,st,b,()=>.5);assert.equal(b.phase,2);assert.equal(b.warning,'Raízes');c.bossMechanic(s,st,b,()=>.5);assert.equal(s.hp,25);assert.equal(b.lastMechanic,'Recuo defensivo');s.defensive=false;b.warning='Raízes';c.bossMechanic(s,st,b,()=>.5);assert(s.hp<25);assert(b.heroEffects.slow);});

test('grimoire roles and legacy normalization',()=>{const s=c.normalize({level:30});assert.equal(s.servantChoices.length,2);assert.equal(s.minions.length,0);assert.equal(Object.keys(c.servantRoles).length,4);c.clear(s);assert.equal(s.minions.length,0);});

test('minions strike independently of hero range and synchronize lifetime',()=>{const s=c.normalize({level:30,subclass:0,hp:100,mana:100,minions:[{role:'archer',x:.4,left:4,cd:0,guard:0},{role:'bone',x:.1,left:4,cd:0,guard:0}]});const a={z:0,mode:'hunt',enemy:{hp:100,atk:10},enemyHp:100,effects:{},positions:{hero:.1,enemy:.7,servant:.4}};const st={damage:100,hp:100,mana:100,manaRegen:1};assert(c.minionStrike(s,st,a)>0);assert.equal(s.minions[0].cd,4);assert.equal(s.minions[1].cd,0);c.tick(s,st,a);assert.equal(s.servant,3);assert.equal(s.minions[0].cd,3);s.hp=0;assert.equal(c.minionStrike(s,st,a),0);});

test('automatic potion uses selected strength',()=>{const s=c.normalize({hp:20,mana:10,level:2});s.potions.hp1=5;s.potions.hp2=1;s.autoPotion.hp=50;s.autoPotion.hpKey='hp2';const st={hp:100,mana:100};c.autoPotion(s,st);assert.equal(s.hp,65);assert.equal(s.potions.hp1,5);assert.equal(s.potions.hp2,0);s.hp=20;s.potionCD.hp=0;c.autoPotion(s,st);assert.equal(s.hp,20);});

test('two legacy servants reach separate lanes and stay in attack range',()=>{
 const s=c.normalize({level:30,subclass:0,hp:100,minions:[
  {role:'bone',x:.25,left:8,cd:0,guard:0},
  {role:'bone',x:.25,left:8,cd:0,guard:0}
 ]});
 const a={z:0,mode:'hunt',enemy:{hp:1000,atk:10},enemyHp:1000,effects:{},positions:{hero:.25,enemy:.75,servant:.34}};
 const st={move:0,damage:100,hp:100};
 for(let i=0;i<10;i++)c.move('necro',s,st,a,false);
 const [far,near]=s.minions;
 assert(far.x>a.positions.enemy&&near.x<a.positions.enemy);
 assert(far.y>0&&near.y<0);
 assert(Math.abs(far.y)<=52/1200&&Math.abs(near.y)<=52/1200);
 assert(c.minionStrike(s,st,a)>0);
 assert(a.enemyHp<1000);
});
