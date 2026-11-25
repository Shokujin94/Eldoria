import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {schema,game,quote} from './game.mjs';
test('server-only state, elapsed time, ranking, custody and gold burn',()=>{
 const db=new DatabaseSync(':memory:');schema(db);let now=100000;const g=game(db,{clock:()=>now,random:()=>.05});
 for(const id of ['a','b','c'])db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run(id,id,'test',0);
 g.create('a','Alda','war');g.create('b','Breno','mage');assert.throws(()=>g.create('c','alda','war'));assert.throws(()=>g.create('a','Outro','war'));g.create('c','Cora','cleric');
 assert.throws(()=>g.action('a',{action:'grant',gold:99999}));assert.throws(()=>g.action('a',{action:'start',mode:'gather',prof:'mining',zone:9}));
 g.action('a',{action:'start',mode:'gather',prof:'mining',zone:0});assert.equal(g.state('a').character.prof.mining.total,0);now+=60000;assert.equal(g.state('a').character.prof.mining.total,10);assert.equal(g.state('a').character.prof.mining.total,10);
 assert.equal(g.ranking('mined').rows[0].name,'Alda');assert.equal(g.ranking('collected').rows[0].score,10);assert.throws(()=>g.ranking('x;drop table'));
 g.action('a',{action:'stop'});assert.throws(()=>g.trade('a',{action:'list',itemId:g.state('a').items[0].id,price:5000}));
 db.prepare('INSERT INTO items(id,owner,name,slot,tier,level,rarity,source,power,data) VALUES(?,?,?,?,?,?,?,?,?,?)').run('item','a','Espada','weapon',4,41,3,'boss',80,'{"mods":{"damage":40}}');db.prepare('UPDATE characters SET gold=10000 WHERE account=?').run('b');
 const q=quote({level:41,rarity:3,source:'boss'},5000);assert.deepEqual(q,{bps:900,burn:450,net:4550,price:5000});assert.throws(()=>g.trade('c',{action:'list',itemId:'item',price:5000}));
 const {id}=g.trade('a',{action:'list',itemId:'item',price:5000});assert.throws(()=>g.trade('a',{action:'list',itemId:'item',price:5000}));assert.throws(()=>g.action('a',{action:'equip',itemId:'item'}));assert.throws(()=>g.trade('a',{action:'buy',id,price:5000}));assert.throws(()=>g.trade('c',{action:'buy',id,price:5000}));assert.throws(()=>g.trade('b',{action:'buy',id,price:1}));
 g.trade('b',{action:'buy',id,price:5000});assert.equal(g.state('b').character.gold,5000);assert.equal(g.state('a').character.gold,4550);assert(g.state('b').items.some(i=>i.id==='item'));assert.equal(g.market('b').totals.burned,450);assert.throws(()=>g.trade('b',{action:'buy',id,price:5000}));
 const next=g.trade('b',{action:'list',itemId:'item',price:100}).id;assert.throws(()=>g.trade('a',{action:'cancel',id:next}));g.trade('b',{action:'cancel',id:next});
 assert.throws(()=>g.action('b',{action:'equip',itemId:'item'}));db.close();
});

test('regional port, real item ranges, timed battles, attributes and failed-action settlement',async()=>{
 const c=await import('./content.mjs');assert.equal(c.enemy(0,0).hp,25);assert.equal(c.enemy(0,0).name,'Mucor, a Gosma Errante');assert.equal(c.sourceRange(4,'forge')[1],45);assert.equal(c.xpNeed(1),170);assert.equal(c.xpNeed(50),72830);assert.equal(c.xpNeed(101),361474);
 const item=c.generate({tier:2,rarity:4,quality:2,vocation:'war',slot:'weapon'},'hunt',2,()=>.5);assert(item.level>=25&&item.level<=27);assert.equal(item.affixes.length,4);assert(c.itemPower45({name:'Teste',slot:'weapon',baseMods:item.baseMods})>0);
 assert.equal(c.recipe('weapon',0,{}).cost,40);assert(c.recipe('weapon',1,{mob:3,mining:3,wood:3}).req['boss:1']===2);
 const db=new DatabaseSync(':memory:');schema(db);let now=100000;const g=game(db,{clock:()=>now,random:()=>.5});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);g.create('a','Alda','war');
 assert.throws(()=>g.action('a',{action:'attribute',key:'str',points:1}));g.action('a',{action:'start',mode:'gather',prof:'mining',zone:0});now+=6000;assert.throws(()=>g.action('a',{action:'grant',gold:999}));assert.equal(g.state('a').character.prof.mining.total,1);g.tickBatch();assert.equal(g.state('a').character.prof.mining.total,1);
 g.action('a',{action:'stop'});g.action('a',{action:'start',mode:'hunt',zone:0});const init=g.state('a').character;assert(init.activity.enemy.hp>0);assert.equal(init.kills,0);now+=2000;const approach=g.state('a').character;assert(approach.activity.positions.hero>init.activity.positions.hero);assert.equal(approach.activity.enemyHp,init.activity.enemyHp);now+=2000;const next=g.state('a').character;assert(next.activity.enemyHp<init.activity.enemyHp);assert.equal(g.state('a').character.activity.enemyHp,next.activity.enemyHp);
 assert.throws(()=>g.action('a',{action:'start',mode:'boss',zone:0}));g.action('a',{action:'stop'});assert.throws(()=>g.action('a',{action:'start',mode:'dungeon',zone:0}));db.close();
});

test('talent purchases and account state remain authoritative',()=>{const db=new DatabaseSync(':memory:');schema(db);const g=game(db,{clock:()=>100000});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('x','x','test',0);g.create('x','Xeno','mage');assert.throws(()=>g.action('x',{action:'talent',key:'x'}));assert.throws(()=>g.action('x',{action:'trial',index:0}));const row=db.prepare('SELECT data FROM characters WHERE account=?').get('x');const s=JSON.parse(row.data);s.level=2;db.prepare('UPDATE characters SET data=?,level=2 WHERE account=?').run(JSON.stringify(s),'x');const d=g.action('x',{action:'talent',key:'x'});assert.equal(d.character.talents.x,1);assert.equal(d.character.freeTalents,0);assert.throws(()=>g.action('x',{action:'talent',key:'x'}));db.close();});

test('server purchase of potions and skill form gates',()=>{const db=new DatabaseSync(':memory:');schema(db);const g=game(db,{clock:()=>100000});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('p','p','test',0);g.create('p','Potion','war');assert.throws(()=>g.action('p',{action:'buyPotion',key:'hp1',count:1}));db.prepare('UPDATE characters SET gold=100 WHERE account=?').run('p');let d=g.action('p',{action:'buyPotion',key:'hp1',count:2});assert.equal(d.character.gold,84);assert.equal(d.character.potions.hp1,2);assert.throws(()=>g.action('p',{action:'buyPotion',key:'hp1',count:-1}));assert.throws(()=>g.action('p',{action:'skillForm',key:'x',form:'power'}));d=g.action('p',{action:'autoPotion',key:'hp',threshold:40});assert.equal(d.character.autoPotion.hp,40);db.close();});

test('equipment transactions protect escrow, stock and existing item power',()=>{const db=new DatabaseSync(':memory:');schema(db);const g=game(db,{clock:()=>100000,random:()=>.5});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('e','e','test',0);g.create('e','Equipador','war');const d=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('e').data);d.materials={'mob:0:1':20,'mining:0:1':20};d.runeStock={r30_weapon_might_0:2,r30_head_memory_0:1};db.prepare('UPDATE characters SET gold=5000,data=? WHERE account=?').run(JSON.stringify(d),'e');db.prepare('INSERT INTO items(id,owner,name,slot,tier,level,rarity,source,power,data) VALUES(?,?,?,?,?,?,?,?,?,?)').run('gear','e','Espada','weapon',0,1,2,'hunt',10,JSON.stringify({baseMods:{damage:10},mods:{damage:6.2},vocation:'war',sockets:1}));let a=g.action('e',{action:'upgrade',itemId:'gear'});assert.equal(a.items.find(i=>i.id==='gear').data.upgrade,1);assert.equal(a.character.gold,4900);assert.throws(()=>g.action('e',{action:'socketRune',itemId:'gear',rune:'r30_head_memory_0'}));a=g.action('e',{action:'socketRune',itemId:'gear',rune:'r30_weapon_might_0'});assert.equal(a.character.runeStock.r30_weapon_might_0,1);assert.throws(()=>g.action('e',{action:'socketRune',itemId:'gear',rune:'r30_weapon_might_0'}));const l=g.trade('e',{action:'list',itemId:'gear',price:200}).id;assert.throws(()=>g.action('e',{action:'upgrade',itemId:'gear'}));g.trade('e',{action:'cancel',id:l});a=g.action('e',{action:'removeRune',itemId:'gear',index:0});assert.equal(a.items.find(i=>i.id==='gear').data.runes.length,0);assert.equal(a.character.runeStock.r30_weapon_might_0,1);db.close();});

test('advanced services consume resources once and preserve custody',()=>{const db=new DatabaseSync(':memory:');schema(db);const g=game(db,{clock:()=>100000,random:()=>.5});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);g.create('a','Alfa','war');const s=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);s.materials={'herb:0:0':10,'boss:0':10,'mining:0:1':10};db.prepare('UPDATE characters SET gold=100000,data=? WHERE account=?').run(JSON.stringify(s),'a');db.prepare('INSERT INTO items(id,owner,name,slot,tier,level,rarity,source,power,data) VALUES(?,?,?,?,?,?,?,?,?,?)').run('gear','a','Espada','weapon',0,1,3,'hunt',10,JSON.stringify({baseMods:{damage:10},mods:{damage:6.2},vocation:'war',upgrade:5,sockets:1}));assert.throws(()=>g.action('a',{action:'enchant',itemId:'gear',element:'__proto__'}));let v=g.action('a',{action:'enchant',itemId:'gear',element:'fire'});assert.equal(v.character.materials['herb:0:0'],7);assert.equal(v.items.find(i=>i.id==='gear').data.enchant,'fire');assert.throws(()=>g.action('a',{action:'corrupt',itemId:'gear'}));v=g.action('a',{action:'corrupt',itemId:'gear',confirm:true});assert.equal(v.items.find(i=>i.id==='gear').data.corrupt,'ward');assert.throws(()=>g.action('a',{action:'corrupt',itemId:'gear',confirm:true}));v=g.action('a',{action:'awaken',itemId:'gear'});assert(v.items.find(i=>i.id==='gear').data.awake);v=g.action('a',{action:'addSocket',itemId:'gear'});assert.equal(v.items.find(i=>i.id==='gear').data.sockets,2);const l=g.trade('a',{action:'list',itemId:'gear',price:100}).id;assert.throws(()=>g.action('a',{action:'enchant',itemId:'gear',element:'ice'}));assert.equal(g.market('a').offers.find(i=>i.id===l).data.corrupt,'ward');db.close();});
test('regional relic catalogue',async()=>{const eq=await import('./equipment.mjs');assert.equal(eq.relics.length,10);const d=eq.relicData(2,'cleric');assert.equal(d.baseMods.wis,10);assert.equal(d.baseMods.int,undefined);const i={tier:2,slot:'ring',rarity:4,data:d};assert.equal(eq.itemData(i).setId,null);assert.equal(eq.advancedBonuses([i]).special,.20);assert.equal(eq.advancedBonuses([i,i]).special,.20);});

test('merchant, inventory protection, training and mastery are authoritative',async()=>{const db=new DatabaseSync(':memory:');schema(db);let now=100000;const g=game(db,{clock:()=>now,random:()=>.5});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);g.create('a','Mercador','war');const s=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);s.materials={'mining:0:0':10};s.level=2;db.prepare('UPDATE characters SET data=?,gold=1000,level=2 WHERE account=?').run(JSON.stringify(s),'a');db.prepare('INSERT INTO items(id,owner,name,slot,tier,level,rarity,source,power,data) VALUES(?,?,?,?,?,?,?,?,?,?)').run('gear','a','Espada','weapon',0,1,0,'hunt',10,JSON.stringify({baseMods:{damage:10},mods:{damage:6.2},quality:0,sockets:0}));g.action('a',{action:'lockItem',itemId:'gear',locked:true});assert.throws(()=>g.action('a',{action:'sellItem',itemId:'gear',confirm:true}));assert.throws(()=>g.trade('a',{action:'list',itemId:'gear',price:100}));g.action('a',{action:'lockItem',itemId:'gear',locked:false});let d=g.action('a',{action:'sellItem',itemId:'gear',confirm:true});assert.equal(d.character.gold,1006);assert.throws(()=>g.action('a',{action:'sellItem',itemId:'gear',confirm:true}));d=g.action('a',{action:'sellMaterial',key:'mining:0:0',count:4});assert.equal(d.character.gold,1018);assert.equal(d.character.materials['mining:0:0'],6);assert.throws(()=>g.action('a',{action:'sellMaterial',key:'mining:0:0',count:-1}));d=g.action('a',{action:'buyRune',key:'r30_weapon_might_0',count:1});assert.equal(d.character.runeStock.r30_weapon_might_0,1);assert.equal(d.character.gold,978);g.action('a',{action:'talent',key:'x'});assert.throws(()=>g.action('a',{action:'rotation',ids:['x','x']}));assert.throws(()=>g.action('a',{action:'rotation',ids:['unknown']}));g.action('a',{action:'rotation',ids:['x']});g.action('a',{action:'trackCreature',key:'0:2'});assert.equal(g.state('a').character.trackCreature,'0:2');g.action('a',{action:'start',mode:'train',zone:0});for(let i=0;i<40;i++){now+=1500;d=g.state('a');}assert(d.character.skill>1);assert.equal(d.character.skillXpNeed,Math.round((12+d.character.skill*3)*1.2));assert.equal(d.character.gold,978);assert.equal(d.character.xp,0);assert.equal(d.character.kills,0);assert.equal(d.items.length,1);const trained=d.character.skillXp;now+=10000;d=g.state('a');assert.equal(d.character.activity,null);assert.equal(d.character.skillXp,trained);g.action('a',{action:'start',mode:'hunt',zone:0});now+=120000;d=g.state('a');assert.equal(Object.values(d.character.bestiary).reduce((a,b)=>a+b,0),d.character.kills);assert.equal(d.character.creatureCatalog.length,60);const session=d.character.analyzer||d.character.history[0];assert(session.seconds>0);assert.equal(session.offlineSeconds,session.seconds);db.close();});

test('vault prevents trade/equip, tower difficulty and legacy gates',()=>{const db=new DatabaseSync(':memory:');schema(db);let now=100000;const g=game(db,{clock:()=>now,random:()=>.5});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);g.create('a','Explorador','war');db.prepare('INSERT INTO items(id,owner,name,slot,tier,level,rarity,source,power,data) VALUES(?,?,?,?,?,?,?,?,?,?)').run('gear','a','Espada','weapon',0,1,0,'hunt',10,JSON.stringify({baseMods:{damage:10},mods:{damage:6.2}}));let d=g.action('a',{action:'deposit',itemId:'gear'});assert.equal(d.items.length,1);assert.equal(d.vault.length,1);assert.throws(()=>g.trade('a',{action:'list',itemId:'gear',price:100}));assert.throws(()=>g.action('a',{action:'equip',itemId:'gear'}));d=g.action('a',{action:'withdraw',itemId:'gear'});assert.equal(d.vault.length,0);assert.equal(d.items.length,2);assert.throws(()=>g.action('a',{action:'legacy',key:'power'}));const x=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);x.level=100;x.legacyXP=100;x.rareEvent={z:0,k:0};db.prepare('UPDATE characters SET data=?,level=100 WHERE account=?').run(JSON.stringify(x),'a');d=g.action('a',{action:'legacy',key:'power'});assert.equal(d.character.legacy.power,1);assert.throws(()=>g.action('a',{action:'legacy',key:'power'}));d=g.action('a',{action:'resolveEvent'});assert.equal(d.character.gold,5);assert.throws(()=>g.action('a',{action:'resolveEvent'}));assert.throws(()=>g.action('a',{action:'start',mode:'dungeon',zone:0,difficulty:5}));d=g.action('a',{action:'start',mode:'dungeon',zone:0,difficulty:4,tower:true});assert.equal(d.character.activity.difficulty,4);assert.equal(d.character.activity.floor,1);assert(d.character.activity.enemy.hp>100);db.close();});

test('profession talents, tools and oath gates are authoritative',async()=>{const db=new DatabaseSync(':memory:');schema(db);let now=100000;const g=game(db,{clock:()=>now,random:()=>.01});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);g.create('a','Oficial','war');const s=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);s.prof.mining.level=15;s.materials={'mining:0:0':10};s.level=30;s.subclass=0;s.zoneDungeons[2]=1;s.zoneBosses[2]=1;db.prepare('UPDATE characters SET data=?,gold=1000,level=30 WHERE account=?').run(JSON.stringify(s),'a');let d=g.action('a',{action:'professionTalent',prof:'mining',key:'speed'});assert.equal(d.character.prof.mining.talents.speed,1);d=g.action('a',{action:'professionTool',prof:'mining'});assert.equal(d.character.prof.mining.tool,1);assert.equal(d.character.gold,900);assert.equal(d.character.materials['mining:0:0'],5);g.action('a',{action:'professionSpec',prof:'mining',key:'yield'});assert.throws(()=>g.action('a',{action:'professionTalent',prof:'wood',key:'quality'}));g.action('a',{action:'oath',index:0,choice:0});assert.throws(()=>g.action('a',{action:'oath',index:1,choice:0}));d=g.action('a',{action:'oath',index:0,choice:1});assert.equal(d.character.gold,450);assert.equal(d.character.oaths[0],1);g.action('a',{action:'energyProfile',key:'boss'});g.action('a',{action:'start',mode:'gather',prof:'mining',zone:0});now+=5000;d=g.state('a');assert.equal(d.character.prof.mining.total,3);assert.throws(()=>g.action('a',{action:'professionTool',prof:'mining'}));assert.equal(g.state('a').character.prof.mining.total,3);db.close();});

test('loot rules, presets, rare crafting and bounded history',()=>{const db=new DatabaseSync(':memory:');schema(db);let now=100000;const g=game(db,{clock:()=>now,random:()=>.01});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);g.create('a','Artesao','war');const s=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);s.level=5;s.craft.level=5;s.recipes={0:true};s.materials={'boss:0':1,'mining:0:2':4};db.prepare('UPDATE characters SET data=?,gold=1000,level=5 WHERE account=?').run(JSON.stringify(s),'a');assert.throws(()=>g.action('a',{action:'lootRules',protect:2,sell:3,notify:0}));g.action('a',{action:'lootRules',protect:3,sell:0,notify:0});assert.throws(()=>g.action('a',{action:'rareCraft',zone:0,level:6}),/Nível da receita inválido/);let d=g.action('a',{action:'rareCraft',zone:0,level:4});const jewel=d.items.find(i=>i.slot==='accessory');assert.equal(jewel.rarity,3);assert.equal(jewel.level,4);assert.equal(jewel.data.quality,0);assert.equal(jewel.data.materialQuality,2);assert.equal(jewel.data.materialGrade,2);assert.equal(jewel.data.locked,true);assert.equal(d.character.gold,850);assert.throws(()=>g.action('a',{action:'rareCraft',zone:0}));g.action('a',{action:'equip',itemId:jewel.id});g.action('a',{action:'presetSave',index:1});g.action('a',{action:'unequip',itemId:jewel.id});g.action('a',{action:'lockItem',itemId:jewel.id,locked:false});assert.throws(()=>g.action('a',{action:'sellItem',itemId:jewel.id,confirm:true}));assert.throws(()=>g.trade('a',{action:'list',itemId:jewel.id,price:100}));d=g.action('a',{action:'presetLoad',index:1});assert(d.items.find(i=>i.id===jewel.id).equipped);db.prepare('INSERT INTO items(id,owner,name,slot,tier,level,rarity,source,power,data) VALUES(?,?,?,?,?,?,?,?,?,?)').run('junk','a','Sucata','head',0,1,0,'hunt',1,JSON.stringify({baseMods:{hp:1},mods:{hp:1},quality:0,sockets:0}));g.action('a',{action:'start',mode:'hunt',zone:0});now+=4000;d=g.action('a',{action:'stop'});assert(!d.items.some(i=>i.id==='junk'));assert(d.items.some(i=>i.id===jewel.id));assert.equal(d.character.history.length,1);assert.equal(d.character.history[0].seconds,4);assert(d.character.history[0].damage>0);assert(d.character.lastCombat.seq>0);assert.equal(d.character.lastCombat.mode,'hunt');assert(Number.isFinite(d.character.lastCombat.positions.enemy));assert(d.character.lastAutoSale.items>=1);db.close();});

test('artisan XP and crafted supplies are server-owned',()=>{const db=new DatabaseSync(':memory:');schema(db);const g=game(db,{clock:()=>100000,random:()=>.5});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);g.create('a','Artesao','war');const s=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);s.materials={'herb:0:0':9,'mining:0:0':3};db.prepare('UPDATE characters SET gold=100,data=? WHERE account=?').run(JSON.stringify(s),'a');assert.throws(()=>g.action('a',{action:'brew',key:'hp3',count:1}));let d=g.action('a',{action:'brew',key:'hp1',count:2});assert.equal(d.character.potions.hp1,2);assert.equal(d.character.tradeXP.alch,20);assert.equal(d.character.gold,84);d=g.action('a',{action:'basicJewel'});assert.equal(d.character.gold,54);assert.equal(d.character.tradeXP.jewel,10);assert(d.items.some(i=>i.slot==='ring'&&i.rarity===1));assert.throws(()=>g.action('a',{action:'basicJewel'}));db.close();});

test('batch talent allocation is atomic and respects rank and free points',()=>{const db=new DatabaseSync(':memory:');schema(db);const g=game(db,{clock:()=>100000});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('batch','batch','test',0);g.create('batch','Batch Mage','mage');const s=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('batch').data);s.level=3;db.prepare('UPDATE characters SET data=?,level=3 WHERE account=?').run(JSON.stringify(s),'batch');const key='t33_mage_0_0';assert.throws(()=>g.action('batch',{action:'talent',key,points:3}));assert.equal(g.state('batch').character.talents[key]||0,0);assert.throws(()=>g.action('batch',{action:'talent',key,points:4}));assert.equal(g.action('batch',{action:'talent',key,points:2}).character.talents[key],2);assert.equal(g.state('batch').character.freeTalents,0);assert.throws(()=>g.action('batch',{action:'talent',key,points:1}));db.close();});

test('original titles unlock and grant one server-side bonus',()=>{const db=new DatabaseSync(':memory:');schema(db);const g=game(db,{clock:()=>100000});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('t','t','test',0);g.create('t','Titulos','war');assert.throws(()=>g.action('t',{action:'title',key:'survive'}));const s=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('t').data);s.kills=1000;db.prepare('UPDATE characters SET data=? WHERE account=?').run(JSON.stringify(s),'t');const before=g.state('t').character.stats.a;let c=g.action('t',{action:'title',key:'survive'}).character;assert.equal(c.stats.a.vit,before.vit+1);c=g.action('t',{action:'title',key:'hunter'}).character;assert.equal(c.stats.a.vit,before.vit);assert.equal(c.stats.a.dex,before.dex+1);assert.equal(g.action('t',{action:'title',key:'none'}).character.activeTitle,null);db.close();});
test('elixirs expire offline and cannot stack',()=>{const db=new DatabaseSync(':memory:');schema(db);let now=100000;const g=game(db,{clock:()=>now});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('e','e','test',0);g.create('e','Elixires','war');db.prepare('UPDATE characters SET gold=200 WHERE account=?').run('e');const initial=g.state('e').character.stats.a.str;let c=g.action('e',{action:'buyPotion',key:'might',count:2}).character;assert.equal(c.gold,110);c=g.action('e',{action:'usePotion',key:'might'}).character;assert.equal(c.stats.a.str,initial+3);assert.equal(c.elixirs.might,180);assert.throws(()=>g.action('e',{action:'usePotion',key:'might'}));now+=180000;c=g.state('e').character;assert.equal(c.stats.a.str,initial);assert.equal(c.elixirs.might,undefined);assert.equal(c.potions.might,1);assert.throws(()=>g.action('e',{action:'autoPotion',key:'hp',threshold:50,potion:'mp1'}));c=g.action('e',{action:'autoPotion',key:'hp',threshold:95,potion:'hp2'}).character;assert.equal(c.autoPotion.hpKey,'hp2');db.close();});

test('common forging retains the weighted grade of consumed materials',()=>{
 const db=new DatabaseSync(':memory:');schema(db);
 const g=game(db,{clock:()=>100000,random:()=>.01});
 db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);
 g.create('a','Artesao','war');
 const s=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);
 s.materials={'mob:0:1':5,'mining:0:2':4,'wood:0:0':2};
 db.prepare('UPDATE characters SET data=?,gold=1000 WHERE account=?').run(JSON.stringify(s),'a');
 const d=g.action('a',{action:'craft',zone:0,slot:'weapon',level:1,grades:{mob:1,mining:2,wood:0}});
 const item=d.items.find(i=>i.source==='craft');
 assert.equal(item.data.materialQuality,13/11);
 assert.equal(item.data.materialGrade,1);
 assert.equal(item.data.quality,0);
 assert.equal(d.character.gold,1000-Math.ceil(40*32/11));
 db.close();
});

test('defeating a boss clears its phase, clock and pending attack before the next encounter',()=>{
 const db=new DatabaseSync(':memory:');schema(db);
 let now=100000;
 const g=game(db,{clock:()=>now,random:()=>.5});
 db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);
 g.create('a','Alda','war');
 const read=()=>JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);
 const write=s=>db.prepare('UPDATE characters SET data=?,level=? WHERE account=?').run(JSON.stringify(s),s.level,'a');
 const hero=read();hero.level=5;write(hero);
 g.action('a',{action:'start',mode:'boss',zone:0});
 const s=read(),a=s.activity;
 a.enemyHp=1;a.phase=3;a.bossClock=5;a.lastMechanic='Raízes';
 a.positions={hero:.25,enemy:.37,heroY:.65,enemyY:.65,servant:.34};
 a.attackClock.hero=.9;write(s);
 now+=1000;
 const result=g.state('a').character;
 assert.equal(result.zoneBosses[0],1);
 assert.notEqual(result.activity.encounter,a.encounter);
 assert.equal(result.activity.phase,0);
 assert.equal(result.activity.bossClock,0);
 assert.equal(result.activity.warning,undefined);
 assert.equal(result.activity.lastMechanic,undefined);
 db.close();
});

test('support casts produce a scene event even when nobody takes damage',()=>{
 const db=new DatabaseSync(':memory:');schema(db);
 let now=100000;
 const g=game(db,{clock:()=>now,random:()=>.5});
 db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('hero','hero','test',0);
 g.create('hero','Alda','war');
 const read=()=>JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('hero').data);
 const write=s=>db.prepare('UPDATE characters SET data=?,level=? WHERE account=?').run(JSON.stringify(s),s.level,'hero');
 const save=read();save.level=12;save.talents.s13c=1;save.mana=100;write(save);
 g.action('hero',{action:'start',mode:'hunt',zone:0});
 const s=read();
 Object.assign(s.activity,{attackClock:{hero:.9,enemy:0},positions:{hero:.25,enemy:.37,servant:.34},effects:{stun:{left:4}}});
 write(s);
 now+=1000;
 const result=g.state('hero').character;
 assert.equal(result.lastCombat.dealt,0);
 assert.equal(result.lastCombat.received,0);
 assert.deepEqual(result.lastCombat.support,{skill:'Brado de guerra',element:'physical'});
 assert(result.buffs.s13c.left>0);
 db.close();
});

test('experience advances beyond level 100 and also credits the legacy',()=>{
 const db=new DatabaseSync(':memory:');schema(db);
 let now=100000;
 const g=game(db,{clock:()=>now,random:()=>.5});
 db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);
 g.create('a','Alda','war');
 const read=()=>JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);
 const write=s=>db.prepare('UPDATE characters SET data=?,level=? WHERE account=?').run(JSON.stringify(s),s.level,'a');
 const hero=read();hero.level=100;hero.xp=344200;write(hero);
 g.action('a',{action:'start',mode:'hunt',zone:0});
 const s=read(),a=s.activity;
 a.enemyHp=1;
 a.positions={hero:.25,enemy:.37,servant:.34};
 a.attackClock.hero=.9;
 write(s);
 now+=1000;
 const result=g.state('a').character;
 assert.equal(result.level,101);
 assert.equal(result.xp,a.enemy.xp-1);
 assert.equal(result.xpNeed,361474);
 assert(result.legacyXP>0);
 db.close();
});

test('base vocation attributes and secondary stat gains match the legacy coefficients',()=>{
 const db=new DatabaseSync(':memory:');schema(db);
 const g=game(db,{clock:()=>100000,random:()=>.5});
 const bases={war:[8,3,2,7,0],ranger:[3,9,2,6,0],mage:[2,3,10,5,0],cleric:[3,2,0,7,8],necro:[2,3,9,5,1]};
 const keys=['str','dex','int','vit','wis'];
 const mana={war:38,ranger:38,mage:61,cleric:44,necro:60};
 const special={war:1.637805,ranger:1.637805,mage:1.951598,cleric:1.666394,necro:1.755374};
 const hp={war:60,ranger:54,mage:53,cleric:58,necro:54};
 const def={war:5.7,ranger:5.38,mage:5.06,cleric:3.7,necro:5.56};
 const regen={war:1.103081,ranger:1.103081,mage:1.497559,cleric:1.591872,necro:1.521295};
 for(const [cl,base] of Object.entries(bases)){
  db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run(cl,cl,'test',0);
  const start=g.create(cl,cl,cl).character;
  assert.deepEqual(keys.map(k=>start.stats.a[k]),base);assert.equal(start.stats.mana,mana[cl]);assert.equal(start.stats.hp,hp[cl]);assert(Math.abs(start.stats.def-def[cl])<1e-9);
  assert(Math.abs(start.stats.special-special[cl])<1e-6);
  assert(Math.abs(start.stats.manaRegen-regen[cl])<1e-6);
 }
 const row=db.prepare('SELECT data FROM characters WHERE account=?').get('necro');
 const save=JSON.parse(row.data);save.level=20;
 db.prepare('UPDATE characters SET level=20,data=? WHERE account=?').run(JSON.stringify(save),'necro');
 const stats=g.state('necro').character.stats;
 for(const [key,stat,delta] of [['str','critMult',.015],['dex','haste',.01],['vit','tenacity',.015],['wis','heal',.01]]){
  const next=g.action('necro',{action:'attribute',key,points:5}).character.stats;
  assert(Math.abs(next[stat]-stats[stat]-delta)<1e-9);
 }
 db.close();
});

test('legacy subclass passives affect the intended stats and restrict hunter damage to arenas',()=>{
 const db=new DatabaseSync(':memory:');schema(db);
 const g=game(db,{clock:()=>100000,random:()=>.5});
 const cases={war:[['damage'],['hp','reduction'],['crit','critMult']],
  ranger:[['crit','critMult'],['dodge','damage'],[]],
  mage:[['special','damage'],['hp','reduction'],[]],
  cleric:[['damage','special'],['hp','reduction'],['heal']],
  necro:[['hp'],['special'],['heal']]};
 for(const [cl,passives] of Object.entries(cases)){
  db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run(cl,cl,'test',0);
  const base=g.create(cl,cl,cl).character.stats;
  const save=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get(cl).data);
  for(const [subclass,fields] of passives.entries()){
   save.subclass=subclass;
   db.prepare('UPDATE characters SET data=? WHERE account=?').run(JSON.stringify(save),cl);
   const next=g.state(cl).character.stats;
   for(const field of fields)assert(next[field]>base[field],cl+':'+subclass+' '+field);
   if(cl==='ranger'&&subclass===2)assert.equal(next.damage,base.damage);
  }
  if(cl==='ranger'){
   save.level=16;
   db.prepare('UPDATE characters SET level=16,data=? WHERE account=?').run(JSON.stringify(save),cl);
   const town=g.state(cl).character.stats.damage;
   const hunt=g.action(cl,{action:'start',mode:'hunt',zone:0}).character.stats.damage;
   assert.equal(hunt,town);
   g.action(cl,{action:'stop'});
   const dungeon=g.action(cl,{action:'start',mode:'dungeon',zone:0}).character.stats.damage;
   assert(dungeon>town);
  }
 }
 db.close();
});

test('legacy set bonuses unlock at two, three, four and five equipped pieces',async()=>{
 const equipment=await import('./equipment.mjs');
 const slots=['head','armor','legs','hands','feet'];
 const pieces=slots.map(slot=>({slot,tier:2,rarity:2,data:{}}));
 const excluded={slot:'armor',tier:2,rarity:4,data:{relic:0}};
 assert.deepEqual(equipment.setBonuses([pieces[0],excluded]).active,[]);
 assert.deepEqual(equipment.setBonuses(pieces.slice(0,2)).active[0].effects,[{pieces:2,hp:.05}]);
 assert.deepEqual(equipment.setBonuses(pieces.slice(0,3)).active[0].effects.at(-1),{pieces:3,damage:.12});
 assert.equal(equipment.setBonuses(pieces.slice(0,4)).reduction,.04);
 assert(Math.abs(equipment.setBonuses(pieces).special-.08)<1e-9);
 const set0=slots.slice(0,3).map(slot=>({slot,tier:0,rarity:3,data:{}}));
 assert(Math.abs(equipment.setBonuses(set0).hp-(1.05*1.10-1))<1e-9);
 const set1=slots.slice(0,3).map(slot=>({slot,tier:1,rarity:3,data:{}}));
 assert.equal(equipment.setBonuses(set1).def,10);
});

test('each legacy rare event is identified and settles its original reward once',()=>{
 const db=new DatabaseSync(':memory:');schema(db);
 const g=game(db,{clock:()=>100000,random:()=>.5});
 db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('hero','hero','test',0);
 g.create('hero','Alda','war');
 const names=['Mercador itinerante','Baú amaldiçoado','Mini-boss errante','Portal secreto','Altar antigo','Criatura rara'];
 for(const [k,name] of names.entries()){
  const s=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('hero').data);
  s.hp=20;s.materials={};s.rareEvent={k,z:2};
  db.prepare('UPDATE characters SET data=?,gold=0 WHERE account=?').run(JSON.stringify(s),'hero');
  assert.equal(g.state('hero').character.rareEventName,name);
  const result=g.action('hero',{action:'resolveEvent'}).character;
  assert.equal(result.rareEventName,null);
  assert.equal(result.gold,k===0?15:k===1||k===4?36:0);
  assert.equal(result.hp,k===1||k===4?result.stats.hp:20);
  assert.equal(result.materials['mob:2:1']??0,[2,3,5].includes(k)?2:0);
  assert.throws(()=>g.action('hero',{action:'resolveEvent'}));
 }
 db.close();
});

test('dungeons advance after three elites per floor and tower bosses advance the tower record',async()=>{
 const content=await import('./content.mjs');
 const regional=content.enemy(0,4,'boss'),final=content.enemy(0,4,'dungeon',4);
 assert.equal(regional.hp,295);assert.equal(final.hp,324);
 assert.equal(regional.atk,11);assert.equal(final.atk,11);
 assert.equal(final.xp,41);
 const db=new DatabaseSync(':memory:');schema(db);
 let now=100000;
 const g=game(db,{clock:()=>now,random:()=>.5});
 db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);
 g.create('a','Alda','war');
 const read=()=>JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);
 const write=s=>db.prepare('UPDATE characters SET data=?,level=? WHERE account=?').run(JSON.stringify(s),s.level,'a');
 const save=read();save.level=5;write(save);
 for(const tower of [false,true]){
  g.action('a',{action:'start',mode:'dungeon',zone:0,tower});
  let result;
  for(let kill=1;kill<=10;kill++){
   const s=read(),a=s.activity;
   a.enemyHp=1;a.recovery=0;a.attackClock.hero=.9;
   a.positions={hero:.25,enemy:.37,heroY:.65,enemyY:.65,servant:.34};
   write(s);now+=1000;result=g.state('a').character;
   assert.equal(result.activity.wave,kill===10?1:Math.floor(kill/3)+1);
   assert.equal(result.activity.floorKills,kill===10?0:kill%3);
  }
  assert.equal(result.activity.floor,tower?2:1);
  assert.equal(result.towerRecord,tower?1:0);
  assert.equal(result.zoneDungeons[0],tower?2:1);
  g.action('a',{action:'stop'});
 }
 db.close();
});

test('encounter layers combine before overlevel and regional reward rounding',async()=>{
 const {enemy}=await import('./content.mjs');
 const encounter=enemy(1,2,'dungeon',2,40,{difficulty:3,floor:3,affixes:2});
 assert.deepEqual(encounter,{name:'Voraz das Catacumbas de elite',hp:1162,atk:59,xp:61,gold:8});
 const final=enemy(0,4,'dungeon',4);
 assert.equal(final.xp,41);
 assert.equal(final.gold,11);
});

test('existing encounters migrate early life proportions once without altering rewards',()=>{
 const db=new DatabaseSync(':memory:');schema(db);
 const g=game(db,{clock:()=>100000,random:()=>.5});
 db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);
 g.create('a','Alda','war');
 g.action('a',{action:'start',mode:'hunt',zone:0});
 const save=JSON.parse(db.prepare('SELECT data FROM characters WHERE account=?').get('a').data);
 delete save.earlyBalanceApplied;save.hp=54;save.activity.index=0;
 save.activity.enemy={name:'Teste',hp:100,atk:20,xp:12,gold:4};save.activity.enemyHp=40;
 db.prepare('UPDATE characters SET data=? WHERE account=?').run(JSON.stringify(save),'a');
 const after=g.state('a').character;
 assert.equal(after.hp,30);
 assert.equal(after.activity.enemy.hp,56);
 assert.equal(after.activity.enemyHp,22);
 assert.equal(after.activity.enemy.atk,11);
 assert.equal(after.activity.enemy.xp,12);
 assert.equal(after.activity.enemy.gold,4);
 assert.deepEqual(g.state('a').character.activity,after.activity);
 db.close();
});
