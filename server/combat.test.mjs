import test from 'node:test';import assert from 'node:assert/strict';import * as c from './combat.mjs';
test('all five catalogues, valid prerequisites, rank gates and mana',()=>{for(const cls of ['war','ranger','mage','cleric','necro']){const s=c.normalize({level:2,skill:1,hp:100});const all=c.tree(cls,s).flatMap(p=>p.nodes);assert.equal(new Set(all.map(n=>n.id)).size,all.length);for(const n of all)for(const k of n.req)assert(all.some(x=>x.id===k),cls+' '+k);assert(c.canLearn(cls,s,'x'));s.talents.x=1;assert(!c.canLearn(cls,s,'x'));assert(!c.canLearn(cls,s,'s160'));const st={hp:100,mana:100,manaRegen:1,damage:10,crit:0,critMult:1.6,haste:0,special:1.5,heal:0,def:4,dodge:0,reduction:0};s.mana=100;const a={z:0,turn:2,enemy:{hp:100,atk:3},enemyHp:100,effects:{}};c.turn(cls,s,st,a,()=>.5,false);assert(s.mana<100);assert(a.enemyHp<100);assert(s.cooldowns.x>=4);assert(s.casts.x===1);assert.equal(typeof a.lastAttackElement,'string');assert.equal(typeof a.lastAttackSkill,'string');assert(!c.eligibleTrial(s));}});

test('potions consume stock, enforce cooldown and auto thresholds',()=>{const s=c.normalize({hp:20,mana:10,level:2});s.potions.hp1=2;s.autoPotion.hp=30;const st={hp:100,mana:100};c.autoPotion(s,st);assert.equal(s.hp,45);assert.equal(s.potions.hp1,1);assert.equal(c.usePotion(s,st,'hp1'),false);assert.equal(c.usePotion(s,st,'__proto__'),false);s.potionCD.hp=0;assert(c.usePotion(s,st,'hp1'));assert.equal(s.potions.hp1,0);});

test('movement approaches target without overlap; slowed enemy and servant',()=>{const s=c.normalize({level:2,servant:10}),a={positions:{hero:.25,enemy:.75,servant:.34},effects:{slow:{left:3}}};const st={move:0};c.move('necro',s,st,a,false);assert(a.positions.hero>.25);assert(a.positions.enemy<.75);assert(a.positions.servant>.34);for(let i=0;i<20;i++)c.move('necro',s,st,a,false);assert(a.positions.enemy-a.positions.hero>=.1199);assert(a.positions.enemy-a.positions.servant<=.16);});

test('affixes, elemental combo and boss warnings follow server rules',()=>{const a={mode:'dungeon',difficulty:4,wave:1,z:0,enemy:{hp:100,atk:20,xp:10,gold:10}};c.encounterTraits(a,()=>.5);assert.equal(a.affixes.length,3);assert.equal(new Set(a.affixes).size,3);a.effects={poison:{left:4}};assert.equal(c.combo(a,'fire',100),25);assert.equal(a.effects.poison,undefined);assert.equal(c.enemyResistance({mode:'hunt',z:0,affixes:['armor','ghost']},'physical',false),.60);const b={mode:'boss',z:0,enemy:{hp:100,atk:20},enemyHp:30,bossClock:6};const s=c.normalize({hp:25,defensive:true});const st={hp:100,reduction:0};c.bossMechanic(s,st,b,()=>.5);assert.equal(b.phase,2);assert.equal(b.warning,'Raízes');c.bossMechanic(s,st,b,()=>.5);assert.equal(s.hp,25);assert.equal(b.lastMechanic,'Recuo defensivo');assert.equal(b.mechanicEvent.kind,'retreat');s.defensive=false;b.warning='Raízes';c.bossMechanic(s,st,b,()=>.5);assert(s.hp<25);assert(b.heroEffects.slow);assert.equal(b.mechanicEvent.kind,'impact');});

test('grimoire roles and legacy normalization',()=>{const s=c.normalize({level:30});assert.equal(s.servantChoices.length,2);assert.equal(s.minions.length,0);assert.equal(Object.keys(c.servantRoles).length,4);c.clear(s);assert.equal(s.minions.length,0);});

test('minions strike independently of hero range and synchronize lifetime',()=>{const s=c.normalize({level:30,subclass:0,hp:100,mana:100,minions:[{role:'archer',x:.4,left:4,cd:0,guard:0},{role:'bone',x:.1,left:4,cd:0,guard:0}]});const a={z:0,mode:'hunt',enemy:{hp:100,atk:10},enemyHp:100,effects:{},positions:{hero:.1,enemy:.7,servant:.4}};const st={damage:100,hp:100,mana:100,manaRegen:1};assert.equal(c.minionStrike(s,st,a),0);assert(c.minionStrike(s,st,a)>0);assert.equal(s.minions[0].cd,4);assert.equal(s.minions[1].cd,0);c.tick(s,st,a);assert.equal(s.servant,3);assert.equal(s.minions[0].cd,3);s.hp=0;assert.equal(c.minionStrike(s,st,a),0);});

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
 assert.equal(c.minionStrike(s,st,a),0);assert(c.minionStrike(s,st,a)>0);
 assert(a.enemyHp<1000);
});

test('arena movement uses two axes and keeps melee outside overlap',()=>{
 const s=c.normalize({level:30});
 const a={mode:'dungeon',positions:{hero:.25,enemy:.75,servant:.34},effects:{}};
 const p=c.move('war',s,{move:0},a,false);
 assert(p.hero>.25&&p.heroY<.72);
 assert(p.enemy<.75&&p.enemyY>.51);
 for(let i=0;i<10;i++)c.move('war',s,{move:0},a,false);
 assert(Math.abs(Math.hypot(p.enemy-p.hero,(p.enemyY-p.heroY)*.75)-.12)<1e-6);
 assert(p.heroY>=224/600&&p.enemyY<=515/600);
});

test('legacy attack clocks track hero and enemy independently and reset on control',()=>{
 const a={index:3,positions:{hero:.30,enemy:.42},effects:{},heroEffects:{}};
 let hero=0,enemy=0;
 for(let tick=0;tick<20;tick++){
  hero+=Number(c.attackReady(a,'hero','war',false));
  enemy+=Number(c.attackReady(a,'enemy','war',false));
 }
 assert.equal(hero,17);
 assert.equal(enemy,13);
 a.heroEffects.stun={left:1};
 assert.equal(c.attackReady(a,'hero','war',false),false);
 assert.equal(a.attackClock.hero,0);
 delete a.heroEffects.stun;
 a.heroEffects.slow={left:20};
 for(let tick=0;tick<20;tick++)hero+=Number(c.attackReady(a,'hero','war',false));
 assert.equal(hero,29);
 a.positions.enemy=.9;
 const before=a.attackClock.enemy;
 assert.equal(c.attackReady(a,'enemy','war',false),false);
 assert.equal(a.attackClock.enemy,before);
});

test('ranged vocations retreat in hunts and sidestep when the arena border blocks retreat',()=>{
 const s=c.normalize({level:30});
 for(const cl of ['ranger','mage','cleric','necro']){
  const hunt={mode:'hunt',positions:{hero:.30,enemy:.42,servant:.34},effects:{stun:{left:1}}};
  assert(c.move(cl,s,{move:0},hunt,false).hero<.30);
  const arena={mode:'dungeon',positions:{hero:.11,enemy:.23,heroY:.6,enemyY:.6,servant:.34},effects:{stun:{left:1}}};
  const p=c.move(cl,s,{move:0},arena,false);
  assert.equal(p.hero,.11);
  assert.notEqual(p.heroY,.6);
  assert(Math.hypot(p.enemy-p.hero,(p.enemyY-p.heroY)*.75)>.12);
  const y=p.heroY;
  arena.heroEffects={freeze:{left:1}};
  c.move(cl,s,{move:0},arena,false);
  assert.equal(p.heroY,y);
 }
});

test('legacy ranged species engage at distance and back away when crowded',()=>{
 const s=c.normalize({level:30}),st={move:0};
 const caster={z:1,index:3,mode:'dungeon',heroEffects:{freeze:{left:8}},effects:{},
  positions:{hero:.4,enemy:.50,heroY:.6,enemyY:.6}};
 c.move('war',s,st,caster,false);
 assert(caster.positions.enemy>.50);
 caster.positions.enemy=.65;
 assert.equal(c.attackReady(caster,'enemy','war',false),false);
 assert.equal(c.attackReady(caster,'enemy','war',false),true);
 const melee={...caster,index:4,attackClock:undefined,positions:{...caster.positions}};
 assert.equal(c.attackReady(melee,'enemy','war',false),false);
 c.move('war',s,st,melee,false);
 assert(melee.positions.enemy<.65);
 const chief={...caster,attackClock:undefined,positions:{...caster.positions}};
 assert.equal(c.attackReady(chief,'enemy','war',true),false);
});

test('an arena escape routes around a stationary enemy without overlapping it',()=>{
 const s=c.normalize({level:30});
 const a={mode:'dungeon',retreatBlocked:2,positions:{hero:.11,enemy:.23,heroY:.6,enemyY:.6},
  effects:{stun:{left:12}}};
 const p=a.positions;
 for(let tick=0;tick<8;tick++){
  c.move('mage',s,{move:0},a,false);
  assert(Math.hypot(p.enemy-p.hero,(p.enemyY-p.heroY)*.75)>=.12-1e-9);
 }
 assert(p.hero>p.enemy);
 assert.equal(a.escapeRoute,undefined);
});
test('servants retry every tick while out of range and wait two ticks after landing a hit',()=>{
 const m={role:'bone',x:.20,left:8,nextStrike:2,cd:0,guard:0};
 const s=c.normalize({level:30,hp:100,minions:[m]}),st={damage:100,hp:100};
 const a={enemyHp:100,effects:{},positions:{enemy:.75}};
 assert.equal(c.minionStrike(s,st,a),0);
 assert.equal(c.minionStrike(s,st,a),0);
 assert.equal(s.minions[0].nextStrike,0);
 s.minions[0].x=.65;
 assert(c.minionStrike(s,st,a)>0);
 assert.equal(c.minionStrike(s,st,a),0);
 assert(c.minionStrike(s,st,a)>0);
});

test('ranged hunt escape crosses both ways and returns to the lane',()=>{
 const s=c.normalize({level:30});
 for(const [hero,enemy,direction] of [[.09,.21,1],[.91,.79,-1]]){
  const a={mode:'hunt',z:0,index:0,positions:{hero,enemy,servant:.34},effects:{stun:{left:20}}};
  const p=a.positions;
  c.move('mage',s,{move:0},a,false);
  assert.equal(a.huntEscape.direction,direction);
  assert(p.heroY>.84);
  for(let tick=0;tick<8;tick++)c.move('mage',s,{move:0},a,false);
  assert((p.hero-p.enemy)*direction>=.12-1e-9);
  assert(p.hero>=.09&&p.hero<=.91);
  assert.equal(a.huntEscape,undefined);
  assert.equal(p.heroY,undefined);
 }
});

test('shock and exposure affect damage in both directions and defense caps at 63 percent',()=>{
 const s=c.normalize({level:16,hp:100,mana:100,rotation:[]});
 const st={hp:100,mana:100,damage:100,crit:0,haste:0,dodge:0,reduction:0,def:0};
 const a={z:0,turn:2,enemy:{hp:1000,atk:100},enemyHp:1000,effects:{expose:{left:2}},heroEffects:{shock:{left:2}}};
 assert.equal(c.turn('war',s,st,a,()=>.5,false),96);
 a.effects={shock:{left:2}};
 a.heroEffects={expose:{left:2}};
 c.enemyStrike('war',s,st,a,()=>.5,false);
 assert.equal(s.hp,4);
 s.hp=100;
 a.effects={};a.heroEffects={};
 c.enemyStrike('war',s,{...st,reduction:.9},a,()=>.5,false);
 assert.equal(s.hp,63);
});

test('Voraz advances the enemy attack clock without striking through control',()=>{
 const a={index:0,affixes:['fast'],effects:{},positions:{hero:.25,enemy:.37}};
 assert.equal(c.attackReady(a,'enemy','war',false),true);
 assert(Math.abs(a.attackClock.enemy-.07)<1e-9);
 a.effects.freeze={left:2};
 assert.equal(c.attackReady(a,'enemy','war',false),false);
 assert.equal(a.attackClock.enemy,0);
});

test('boss special applies resistance at preparation and impact and keeps the prepared status power',()=>{
 const s=c.normalize({level:20,hp:100});
 const st={hp:100,advanced:{resist:{poison:.20}}};
 const a={mode:'boss',z:0,enemy:{hp:1000,atk:100},enemyHp:1000,warning:'Raízes'};
 c.bossMechanic(s,st,a,()=>.5);
 assert.equal(s.hp,58);
 assert.equal(a.heroEffects.slow.power,52);
});

test('tenacity shortens harmful boss effects using the legacy rounding',()=>{
 const a={mode:'boss',z:3,enemy:{hp:1000,atk:20},enemyHp:1000,warning:'Maré tóxica'};
 const s=c.normalize({level:31,hp:100});
 c.bossMechanic(s,{hp:100,tenacity:.40},a,()=>.5);
 assert.equal(a.heroEffects.poison.left,5);
});

test('legacy relic procs consume existing bleed and count only offensive skill casts',()=>{
 const run=(relics,charges=0,learn=true)=>{
  const s=c.normalize({level:30,hp:100,mana:100,talents:learn?{x:1}:{},relicEchoCharges:charges});
  const a={z:0,turn:2,enemy:{hp:1000},enemyHp:1000,effects:{bleed:{left:3,power:100}}};
  const st={damage:40,crit:0,haste:0,special:1.5,heal:0,hp:100,mana:100,advanced:{relics}};
  const damage=c.turn('mage',s,st,a,()=>.5,false);
  return {s,a,damage};
 };
 const baseline=run([]);
 const sentence=run([6]);
 assert.equal(sentence.damage,baseline.damage+25);
 assert.equal(sentence.a.effects.bleed,undefined);
 assert.equal(run([6],0,false).a.effects.bleed.left,3);
 assert.equal(run([8],0).damage,baseline.damage);
 const echo=run([8],4);
 assert.equal(echo.damage,baseline.damage+Math.round(baseline.damage*.40));
 assert.equal(echo.s.relicEchoCharges,0);
 assert.equal(run([8],4,false).s.relicEchoCharges,4);
});

test('ranged strikes report projectile damage already resolved by the server',()=>{
 const s=c.normalize({level:1,hp:100});
 const st={hp:100,def:0,reduction:0,dodge:0};
 const a={z:0,index:4,enemy:{atk:20},enemyHp:40,positions:{hero:.35,enemy:.62}};
 const hit=c.enemyStrike('war',s,st,a,()=>.5,false);
 assert(hit.damage>0);
 assert.equal(hit.damage,100-s.hp);
 assert.equal(typeof hit.element,'string');
 assert.equal(c.enemyStrike('war',s,st,{...a,index:0},()=>.5,false),undefined);
 s.hp=100;
 const launch=c.enemyStrike('war',s,st,a,()=>.5,false,true);
 assert.equal(launch.damage,undefined);
 assert.equal(s.hp,100);
 assert(a.pendingEnemyShot);
 c.landEnemyShot(s,st,a,()=>.5);
 assert.equal(s.hp,100-hit.damage);
 assert.equal(a.pendingEnemyShot,undefined);
 c.landEnemyShot(s,st,a,()=>.5);
 assert.equal(s.hp,100-hit.damage);
});

test('hero projectile consumes mana at launch and resolves only once',()=>{
 const s=c.normalize({level:2,hp:100,mana:100,talents:{x:1}});
 const a={z:0,index:0,enemy:{hp:100,atk:4},enemyHp:100,effects:{}};
 const st={hp:100,mana:100,damage:10,crit:0,critMult:1.6,haste:0,special:1.5,heal:0};
 const shot=c.turn('mage',s,st,a,()=>.5,false,true);
 assert.equal(typeof shot.element,'string');
 assert.equal(a.enemyHp,100);
 assert(s.mana<100);
 assert(s.cooldowns.x>0);
 assert.equal(s.casts.x,1);
 assert.equal(c.landHeroShot('mage',s,st,a,()=>.5,false),true);
 const remaining=a.enemyHp;
 assert(remaining<100);
 assert.equal(c.landHeroShot('mage',s,st,a,()=>.5,false),false);
 assert.equal(a.enemyHp,remaining);
 assert.equal(s.casts.x,1);
});

test('a projectile follows a moving target across multiple combat steps',()=>{
 const s=c.normalize({level:2,hp:100,mana:100});
 const a={z:0,index:0,enemy:{hp:100,atk:4},enemyHp:100,effects:{},positions:{hero:.2,enemy:.4}};
 const st={hp:100,mana:100,damage:10,crit:0,critMult:1.6,haste:0,special:1.5,heal:0};
 c.turn('mage',s,st,a,()=>.5,false,true);
 const launch={...a.positions};
 a.positions.enemy=.9;
 assert.equal(c.advanceCombatProjectiles('mage',s,st,a,()=>.5,false,launch).heroImpact,null);
 assert.equal(a.enemyHp,100);
 assert(a.pendingHeroShot.projectile.x>launch.hero*800);
 for(let i=0;i<4&&a.pendingHeroShot;i++)c.advanceCombatProjectiles('mage',s,st,a,()=>.5,false,a.positions);
 assert(a.enemyHp<100);
 assert.equal(a.pendingHeroShot,undefined);
});

test('a projectile contacts a wide creature before a narrow one at the same distance',()=>{
 const st={hp:100,mana:100,damage:10,crit:0,critMult:1.6,haste:0,special:1.5,heal:0};
 for(const [index,landed] of [[0,true],[4,false]]){
  const s=c.normalize({level:2,hp:100,mana:100});
  const a={z:0,index,mode:'hunt',enemy:{hp:100,atk:4},enemyHp:100,effects:{},positions:{hero:.2,enemy:.5},
   pendingHeroShot:{cast:null,projectile:{x:378,y:502,speed:.001,radius:1}}};
  const {heroImpact}=c.advanceCombatProjectiles('mage',s,st,a,()=>.5,false,a.positions);
  assert.equal(!!heroImpact,landed);
  if(heroImpact)assert.equal(heroImpact.x,.5);
  assert.equal(a.enemyHp<100,landed);
 }
});

test('recorded damage taken survives healing and excludes overkill',()=>{
 const s=c.normalize({level:1,hp:10,analyzer:{damageTaken:0}});
 const a={z:0,index:0,enemy:{atk:50},enemyHp:40,positions:{hero:.4,enemy:.52}};
 const st={hp:100,def:0,reduction:0,dodge:0};
 c.enemyStrike('war',s,st,a,()=>.5,false);
 assert.equal(s.analyzer.damageTaken,10);
 s.hp=100;
 c.enemyStrike('war',s,st,a,()=>.5,false);
 const remaining=s.hp;
 s.hp=100;
 assert.equal(s.analyzer.damageTaken,10+100-remaining);
});

test('elemental combo damage is credited separately without inflating overkill',()=>{
 const s=c.normalize({level:20,hp:100,mana:100,analyzer:{damageSources:{}}});
 const a={z:0,index:0,enemy:{hp:100,atk:4},enemyHp:11,effects:{freeze:{left:2}}};
 const st={hp:100,mana:100,damage:10,crit:0,critMult:1.6,haste:0,special:1.5,heal:0};
 c.turn('war',s,st,a,()=>.5,false);
 assert.equal(a.enemyHp,0);
 assert.deepEqual(Object.values(s.analyzer.damageSources),[10,1]);
 assert.equal(s.analyzer.damageSources[a.lastCombo],1);
});

test('extra attacks add 65 percent of basic damage within the same boss cap',()=>{
 const st={hp:100,mana:100,damage:20,crit:0,critMult:1.6,haste:1,special:1.5,heal:0};
 for(const [boss,expected] of [[false,33],[true,29]]){
  const s=c.normalize({level:20,hp:100,mana:100});
  const a={z:0,index:0,enemy:{hp:100,atk:4},enemyHp:100,effects:{}};
  c.turn('war',s,st,a,()=>.5,boss);
  assert.equal(100-a.enemyHp,expected);
 }
});

test('direct damage rounds down after variance and retains the one-point minimum',()=>{
 for(const [damage,roll,expected] of [[10.6,.5,10],[10.6,.01,9],[.2,.5,1]]){
  const st={hp:100,mana:100,damage,crit:0,critMult:1.6,haste:0,special:1.5,heal:0};
  const s=c.normalize({level:20,hp:100,mana:100});
  const a={z:0,index:0,enemy:{hp:100,atk:4},enemyHp:100,effects:{}};
  c.turn('war',s,st,a,()=>roll,false);
  assert.equal(100-a.enemyHp,expected);
 }
});

test('arena protection scales by vocation, level and dungeon difficulty',()=>{
 const st={hp:100,def:0,reduction:0,dodge:0};
 for(const [level,mode,difficulty,expected] of [[80,'boss',0,73],[50,'boss',0,87],[80,'dungeon',4,61],[80,'trial',0,100]]){
  const s=c.normalize({level,hp:100});
  const a={z:0,mode,difficulty,index:0,enemy:{atk:100,hp:100},enemyHp:100};
  c.enemyStrike('ranger',s,st,a,()=>.5,true);
  assert.equal(100-s.hp,expected);
 }
});

test('warrior dungeon room movement applies both legacy speed factors',()=>{
 const s=c.normalize({level:20}),st={move:0};
 const room={mode:'dungeon',z:0,index:0,positions:{hero:.2,enemy:.8,heroY:.65,enemyY:.65}};
 const other={...room,positions:{...room.positions}};
 c.move('war',s,st,room,false);
 c.move('cleric',s,st,other,false);
 const ratio=(room.positions.hero-.2)/(other.positions.hero-.2);
 assert.ok(Math.abs(ratio-1.45*1.30)<1e-10);
 assert.ok(Math.abs((.8-room.positions.enemy)/(.8-other.positions.enemy)-1.45*1.30)<1e-10);
});

test('boss-only rotation skips ordinary dungeon enemies and admits affixed enemies',()=>{
 const st={hp:100,mana:100,damage:20,crit:0,critMult:1.6,haste:0,special:1.5,heal:0};
 for(const [mode,affixes,boss,casts] of [['dungeon',[],false,0],['dungeon',['fast'],false,1],['hunt',['fast'],false,1],['trial',[],true,1]]){
  const s=c.normalize({level:20,hp:100,mana:100,talents:{x:1},rotation:['x'],rotationConditions:{x:'boss'}});
  const a={z:0,index:0,mode,affixes,enemy:{hp:100,atk:4},enemyHp:100,effects:{}};
  c.turn('war',s,st,a,()=>.5,boss);
  assert.equal(s.casts.x||0,casts,mode);
 }
});

test('low-mana talent discounts a spell only below the 35 percent threshold',()=>{
 const s=c.normalize({level:40,hp:100,mana:34,talents:{x:1},rotation:['x']});
 const talent=c.catalog('mage',s).flatMap(path=>path.nodes).find(n=>n.name==='Selo da nevasca');
 assert(talent);
 s.talents[talent.id]=3;
 const normal=c.learnedSkills('mage',s,undefined).find(k=>k.id==='x').mana;
 const discounted=c.learnedSkills('mage',s,100).find(k=>k.id==='x').mana;
 assert(discounted<normal);
 const tooltip=c.catalog('mage',s).flatMap(path=>path.nodes).find(n=>n.id==='x').skill;
 assert.equal(tooltip.mana,normal);
 assert.equal(tooltip.lowManaCost,discounted);
 const st={hp:100,mana:100,damage:20,crit:0,critMult:1.6,haste:0,special:1.5,heal:0};
 const a={z:0,index:0,enemy:{hp:100,atk:4},enemyHp:100,effects:{}};
 c.turn('mage',s,st,a,()=>.5,false,true);
 assert.equal(s.mana,34-discounted);
 s.mana=35;
 assert.equal(c.learnedSkills('mage',s,100).find(k=>k.id==='x').mana,normal);
});

test('funerary command extends only the shortest-lived servant',()=>{
 const s=c.normalize({level:40,hp:100,mana:100,talents:{x:1,t33_necro_0_0:1},rotation:['x'],
  minions:[{left:8},{left:4}],servant:8});
 const a={z:0,index:0,enemy:{hp:100,atk:4},enemyHp:100,effects:{}};
 const st={hp:100,mana:100,damage:10,crit:0,critMult:1.6,haste:0,special:1.5,heal:0};
 c.turn('necro',s,st,a,()=>.5,false);
 assert.deepEqual(s.minions.map(m=>m.left),[8,5]);
});

test('defensive path synergy reduces damage after the basic mitigation cap',()=>{
 const st={hp:100,def:0,reduction:.63,dodge:0};
 const a={z:0,index:0,enemy:{atk:100,hp:100},enemyHp:100,positions:{hero:.3,enemy:.45}};
 const s=c.normalize({level:20,hp:100,talents:{t33_ranger_1_0:3}});
 const skill=c.catalog('ranger',s)[1].nodes.find(n=>n.active);
 c.enemyStrike('ranger',s,st,a,()=>.5,false);
 assert.equal(s.hp,63);
 s.hp=100;s.talents[skill.id]=1;
 c.enemyStrike('ranger',s,st,a,()=>.5,false);
 assert.equal(s.hp,66);
});
