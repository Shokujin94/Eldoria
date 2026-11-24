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
