import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('HTTP: private accounts, no state uploads, restart persistence, staging allowlist', {timeout:30000}, async()=>{
 const dir=await mkdtemp(join(tmpdir(),'eldoria-http-'));let child;
 async function start(){child=spawn(process.execPath,['server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,DB_PATH:join(dir,'test.sqlite'),PORT:'0',HOST:'127.0.0.1',SERVE_PREVIEW:'1',ALLOWED_ORIGINS:'https://test.example'},stdio:['ignore','pipe','pipe']});const port=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Startup timeout')),7000);child.stdout.on('data',c=>{log+=c;const m=log.match(/Eldoria online API (\d+)/);if(m){clearTimeout(timer);resolve(+m[1]);}});child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',c=>{clearTimeout(timer);reject(Error('Server exit '+c));});});return 'http://127.0.0.1:'+port;}
 async function stop(){if(child&&child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');await done;}child=null;}
 try{let base=await start();const send=async(path,method='GET',payload,token,origin)=>{const r=await fetch(base+path,{method,headers:{...(payload?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(origin?{Origin:origin}:{})},...(payload?{body:JSON.stringify(payload)}:{})});return {status:r.status,body:await r.json()};};
 assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/js/51-online.js')).status,200);
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
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
