// Standalone local HTTP load smoke. Never uses existing DB, credentials or a remote host.
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {schema,game} from './game.mjs';
import assert from 'node:assert/strict';
const clients=Number(process.argv[2]||12),rounds=Number(process.argv[3]||8);
if(!Number.isInteger(clients)||clients<1||clients>40||!Number.isInteger(rounds)||rounds<1||clients*rounds>450)throw Error('Use 1–40 clientes, total de consultas até 450 (limite local de IP).');
const dir=await mkdtemp(join(tmpdir(),'eldoria-load-')),path=join(dir,'bench.sqlite'),tokens=[];let child;
try{
 const db=new DatabaseSync(path);try{schema(db);const g=game(db);for(let i=0;i<clients;i++){const id='load-'+i,token=randomBytes(32).toString('hex');db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run(id,id,'fixture-not-a-login',Date.now());g.create(id,'Load '+i,['war','ranger','mage','cleric','necro'][i%5]);g.action(id,{action:'start',mode:i%2?'hunt':'gather',prof:'mining',zone:0});const row=db.prepare('SELECT data FROM characters WHERE account=?').get(id),s=JSON.parse(row.data);s.last-=7200000;db.prepare('UPDATE characters SET data=? WHERE account=?').run(JSON.stringify(s),id);db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(token).digest('hex'),id,Date.now()+600000);tokens.push(token);}}finally{db.close();}
 child=spawn(process.execPath,['server.mjs'],{cwd:new URL('.',import.meta.url),env:{...process.env,DB_PATH:path,PORT:'0',HOST:'127.0.0.1',TRUST_PROXY:'0',REGISTRATION_MODE:'closed',SERVE_PREVIEW:'0'},stdio:['ignore','pipe','pipe']});child.stderr.on('data',c=>process.stderr.write(c));
 const port=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Startup timeout')),8000);child.stdout.on('data',c=>{log+=c;const m=log.match(/Eldoria online API (\d+)/);if(m){clearTimeout(timer);resolve(+m[1]);}});child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',n=>{clearTimeout(timer);reject(Error('Exit '+n));});});
 const base='http://127.0.0.1:'+port,latencies=[],started=performance.now();let errors=0,bytes=0;
 for(let j=0;j<rounds;j++)await Promise.all(tokens.map(async token=>{const t=performance.now();try{const r=await fetch(base+'/state?compact=1',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000)}),body=await r.text();if(!r.ok||!JSON.parse(body).character)errors++;bytes+=Buffer.byteLength(body);}catch{errors++;}finally{latencies.push(performance.now()-t);}}));
 latencies.sort((a,b)=>a-b);const pct=p=>Math.round(latencies[Math.min(latencies.length-1,Math.ceil(latencies.length*p)-1)]),report={clients,rounds,requests:latencies.length,errors,p50_ms:pct(.5),p95_ms:pct(.95),max_ms:pct(1),requests_per_second:Math.round(latencies.length/((performance.now()-started)/1000)),response_bytes_avg:Math.round(bytes/latencies.length)};console.log(JSON.stringify(report,null,2));assert.equal(errors,0);assert.equal((await fetch(base+'/health')).status,200);
}finally{if(child&&child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');await done;}await rm(dir,{recursive:true,force:true});}
