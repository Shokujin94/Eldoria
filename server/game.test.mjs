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
 const c=await import('./content.mjs');assert.equal(c.enemy(0,0).hp,45);assert.equal(c.enemy(0,0).name,'Mucor, a Gosma Errante');assert.equal(c.sourceRange(4,'forge')[1],45);assert.equal(c.xpNeed(1),109);
 const item=c.generate({tier:2,rarity:4,quality:2,vocation:'war',slot:'weapon'},'hunt',2,()=>.5);assert(item.level>=25&&item.level<=27);assert.equal(item.affixes.length,4);assert(c.itemPower45({name:'Teste',slot:'weapon',baseMods:item.baseMods})>0);
 assert.equal(c.recipe('weapon',0,{}).cost,40);assert(c.recipe('weapon',1,{mob:3,mining:3,wood:3}).req['boss:1']===2);
 const db=new DatabaseSync(':memory:');schema(db);let now=100000;const g=game(db,{clock:()=>now,random:()=>.5});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('a','a','test',0);g.create('a','Alda','war');
 assert.throws(()=>g.action('a',{action:'attribute',key:'str',points:1}));g.action('a',{action:'start',mode:'gather',prof:'mining',zone:0});now+=6000;assert.throws(()=>g.action('a',{action:'grant',gold:999}));assert.equal(g.state('a').character.prof.mining.total,1);g.tickBatch();assert.equal(g.state('a').character.prof.mining.total,1);
 g.action('a',{action:'stop'});g.action('a',{action:'start',mode:'hunt',zone:0});const init=g.state('a').character;assert(init.activity.enemy.hp>0);assert.equal(init.kills,0);now+=2000;const next=g.state('a').character;assert(next.activity.enemyHp<init.activity.enemyHp);assert.equal(g.state('a').character.activity.enemyHp,next.activity.enemyHp);
 assert.throws(()=>g.action('a',{action:'start',mode:'boss',zone:0}));g.action('a',{action:'stop'});assert.throws(()=>g.action('a',{action:'start',mode:'dungeon',zone:0}));db.close();
});

test('talent purchases and account state remain authoritative',()=>{const db=new DatabaseSync(':memory:');schema(db);const g=game(db,{clock:()=>100000});db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('x','x','test',0);g.create('x','Xeno','mage');assert.throws(()=>g.action('x',{action:'talent',key:'x'}));assert.throws(()=>g.action('x',{action:'trial',index:0}));const row=db.prepare('SELECT data FROM characters WHERE account=?').get('x');const s=JSON.parse(row.data);s.level=2;db.prepare('UPDATE characters SET data=?,level=2 WHERE account=?').run(JSON.stringify(s),'x');const d=g.action('x',{action:'talent',key:'x'});assert.equal(d.character.talents.x,1);assert.equal(d.character.freeTalents,0);assert.throws(()=>g.action('x',{action:'talent',key:'x'}));db.close();});
