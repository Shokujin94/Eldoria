import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
test('HTTP: private accounts, no state uploads, restart persistence, staging allowlist', {timeout:30000}, async()=>{
 const dir=await mkdtemp(join(tmpdir(),'eldoria-http-'));let child;
 async function start(extra={}){child=spawn(process.execPath,['server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,DB_PATH:join(dir,'test.sqlite'),PORT:'0',HOST:'127.0.0.1',SERVE_PREVIEW:'1',ALLOWED_ORIGINS:'https://test.example',...extra},stdio:['ignore','pipe','pipe']});const port=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Startup timeout')),7000);child.stdout.on('data',c=>{log+=c;const m=log.match(/Eldoria online API (\d+)/);if(m){clearTimeout(timer);resolve(+m[1]);}});child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',c=>{clearTimeout(timer);reject(Error('Server exit '+c));});});return 'http://127.0.0.1:'+port;}
 async function stop(){if(child&&child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');await done;}child=null;}
 try{let base=await start();const send=async(path,method='GET',payload,token,origin)=>{const r=await fetch(base+path,{method,headers:{...(payload?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(origin?{Origin:origin}:{})},...(payload?{body:JSON.stringify(payload)}:{})});return {status:r.status,body:await r.json()};};
 assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/js/51-online.js')).status,200);assert.equal((await fetch(base+'/js/52-scene.js')).status,200);assert.equal((await fetch(base+'/assets/maps/city.webp')).status,200);assert.equal((await fetch(base+'/assets/images/'+ 'fc285902303c2825aa7c.png')).status,200);assert.equal((await send('/assets/maps/not-allowed.webp')).status,401);
 assert.equal((await send('/server/server.mjs')).status,401);assert.equal((await send('/state')).status,401);
 assert.equal((await send('/health','GET',null,null,'https://evil.example')).status,403);
 const auth=await send('/auth/register','POST',{username:'alfa',password:'Senha de teste 123!'});assert.equal(auth.status,200);const token=auth.body.token;assert.match(token,/^[a-f0-9]{64}$/);
 assert.equal((await send('/auth/login','POST',{username:'alfa',password:'errada senha 123'})).status,401);
 assert.equal((await send('/character','POST',{name:'Alfa',cls:'war',level:100,gold:999999},token)).status,201);
 const state=await send('/state','GET',null,token);assert.equal(state.body.character.level,1);assert.equal(state.body.character.gold,0);assert(!JSON.stringify(state).includes('password'));
 assert.equal((await send('/state','POST',{gold:999999},token)).status,404);
 assert.equal((await send('/action','POST',{action:'grant',gold:999999},token)).status,400);
 assert.equal((await send('/auth/logout','POST',{},token)).status,200);assert.equal((await send('/state','GET',null,token)).status,401);
 await stop();base=await start();const login=await send('/auth/login','POST',{username:'alfa',password:'Senha de teste 123!'});assert.equal(login.status,200);assert.equal((await send('/state','GET',null,login.body.token)).body.character.name,'Alfa');
 assert.equal((await send('/server/server.mjs','GET',null,login.body.token)).status,404);
 // Competing HTTP purchases against one real escrow listing.
 const b=await send('/auth/register','POST',{username:'beta',password:'Senha teste beta 123!'}),c=await send('/auth/register','POST',{username:'gama',password:'Senha teste gama 123!'});assert.equal(b.status,200);assert.equal(c.status,200);
 assert.equal((await send('/character','POST',{name:'Beta',cls:'war'},b.body.token)).status,201);assert.equal((await send('/character','POST',{name:'Gama',cls:'war'},c.body.token)).status,201);
 const seed=new DatabaseSync(join(dir,'test.sqlite'));try{seed.exec('PRAGMA busy_timeout=5000');const seller=seed.prepare("SELECT id FROM accounts WHERE username='alfa'").get().id;seed.prepare('INSERT INTO items(id,owner,name,slot,tier,level,rarity,source,power,data) VALUES(?,?,?,?,?,?,?,?,?,?)').run('http-gear',seller,'Espada','weapon',0,1,0,'hunt',10,JSON.stringify({baseMods:{damage:10},mods:{damage:6.2}}));seed.prepare("UPDATE characters SET gold=1000 WHERE name IN ('Beta','Gama')").run();}finally{seed.close();}
 const sale=await send('/market','POST',{action:'list',itemId:'http-gear',price:500},login.body.token);assert.equal(sale.status,200);
 const buys=await Promise.all([b,c].map(v=>send('/market','POST',{action:'buy',id:sale.body.id,price:500},v.body.token)));assert.deepEqual(buys.map(x=>x.status).sort(),[200,409]);const buyerStates=await Promise.all([b,c].map(v=>send('/state','GET',null,v.body.token)));assert.equal(buyerStates.filter(v=>v.body.items.some(i=>i.id==='http-gear')).length,1);assert.equal(buyerStates.reduce((n,v)=>n+v.body.character.gold,0),1500);assert.equal((await send('/market','GET',null,login.body.token)).body.totals.burned,15);assert.equal((await send('/state','GET',null,login.body.token)).body.character.gold,485);
 const old=auth.body.recoveryCode;assert.match(old,/^[a-f0-9]{48}$/);const code=await send('/auth/recovery-code','POST',{password:'Senha de teste 123!'},login.body.token);assert.equal(code.status,200);assert.notEqual(code.body.recoveryCode,old);
 assert.equal((await send('/auth/recover','POST',{username:'alfa',password:'Nova senha 12345!',code:old})).status,400);
 const attempts=await Promise.all([1,2].map(()=>send('/auth/recover','POST',{username:'alfa',password:'Nova senha 12345!',code:code.body.recoveryCode})));assert.deepEqual(attempts.map(x=>x.status).sort(),[200,400]);const replacement=attempts.find(x=>x.status===200).body.recoveryCode;assert.match(replacement,/^[a-f0-9]{48}$/);
 assert.equal((await send('/state','GET',null,login.body.token)).status,401);assert.equal((await send('/auth/login','POST',{username:'alfa',password:'Senha de teste 123!'})).status,401);
 const next=await send('/auth/login','POST',{username:'alfa',password:'Nova senha 12345!'});assert.equal(next.status,200);assert.equal((await send('/state?compact=1','GET',null,next.body.token)).body.character.name,'Alfa');
 assert.equal((await send('/auth/change-password','POST',{password:'Nova senha 12345!',newPassword:'Outra senha 12345!'},next.body.token)).status,200);assert.equal((await send('/state','GET',null,next.body.token)).status,401);
 assert.equal((await send('/auth/recover','POST',{username:'alfa',password:'Senha teste 12345!',code:replacement})).status,400);
  await stop();base=await start({REGISTRATION_MODE:'closed'});assert.equal((await send('/auth/register','POST',{username:'novo',password:'Senha nova 12345!'})).status,403);assert.equal((await send('/auth/login','POST',{username:'alfa',password:'Outra senha 12345!'})).status,200);await stop();base=await start({REGISTRATION_MODE:'invite',BETA_INVITE_SHA256:createHash('sha256').update('test-invite').digest('hex')});assert.equal((await send('/auth/register','POST',{username:'novo',password:'Senha nova 12345!'})).status,403);assert.equal((await send('/auth/register','POST',{username:'novo',password:'Senha nova 12345!',invite:'test-invite'})).status,200);
  await stop();base=await start({REGISTRATION_MODE:'open',TRUST_PROXY:'1',TRUST_PROXY_PEER:'127.0.0.2',PROXY_IP_HEADER:'cf-connecting-ip',ALLOWED_ORIGINS:'https://eldoria-test.trycloudflare.com,http://localhost:8787'});assert.equal((await send('/health','GET',null,null,'https://eldoria-test.trycloudflare.com')).status,200);assert.equal((await send('/health','GET',null,null,'https://other.trycloudflare.com')).status,403);assert.equal((await send('/auth/register','POST',{username:'livre',password:'Senha livre 12345!'},null,'https://eldoria-test.trycloudflare.com')).status,200);
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
