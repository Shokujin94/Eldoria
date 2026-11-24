import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomUUID,scrypt as derive,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {schema,game,Fault} from './game.mjs';
const scrypt=promisify(derive),db=new DatabaseSync(process.env.DB_PATH||'eldoria.sqlite');schema(db);const g=game(db);
const origins=new Set((process.env.ALLOWED_ORIGINS||'http://localhost:8000,http://127.0.0.1:8000,http://localhost:8787,http://127.0.0.1:8787').split(',').map(s=>s.trim()).filter(Boolean));
const staticFiles=new Map([['/',['../index.html','text/html; charset=utf-8']],['/index.html',['../index.html','text/html; charset=utf-8']],['/css/online51.css',['../css/online51.css','text/css; charset=utf-8']],['/js/51-online.js',['../js/51-online.js','text/javascript; charset=utf-8']],['/version.json',['../version.json','application/json; charset=utf-8']]]);
const staticEnabled=process.env.SERVE_PREVIEW==='1';
const hash=s=>createHash('sha256').update(s).digest('hex'),age=7*86400000,buckets=new Map();
function fail(status,message){throw new Fault(status,message);}
function rate(key,max,ms){const now=Date.now(),v=buckets.get(key);if(!v||v.until<now){if(buckets.size>=10000)fail(429,'Servidor ocupado.');buckets.set(key,{n:1,until:now+ms});}else if(++v.n>max)fail(429,'Muitas tentativas.');}
setInterval(()=>{const now=Date.now();for(const [k,v] of buckets)if(v.until<now)buckets.delete(k);db.prepare('DELETE FROM sessions WHERE expires<?').run(now);},60000).unref();
async function body(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))fail(415,'Use JSON.');let n=0,parts=[];for await(const c of req){n+=c.length;if(n>16384)fail(413,'Dados excessivos.');parts.push(c);}try{const p=JSON.parse(Buffer.concat(parts).toString());if(!p||typeof p!=='object'||Array.isArray(p))throw Error();return p;}catch{fail(400,'JSON inválido.');}}
async function password(p,salt=randomBytes(16).toString('hex')){const b=await scrypt(p,salt,64);return salt+':'+b.toString('hex');}
function auth(req){const raw=(req.headers.authorization||'').match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!raw)fail(401,'Entre na conta.');const key=hash(raw),s=db.prepare('SELECT account FROM sessions WHERE hash=? AND expires>?').get(key,Date.now());if(!s)fail(401,'Sessão expirada.');return {id:s.account,key};}
const background=setInterval(()=>{try{g.tickBatch(10);}catch(e){console.error('Tick:',e.code||e.name);}},5000);background.unref();
const server=createServer(async(req,res)=>{const origin=req.headers.origin;res.setHeader('Vary','Origin');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');const reply=(code,v)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(v));};
 try{if(origin&&!origins.has(origin))fail(403,'Origem não autorizada.');if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');}if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 const url=new URL(req.url,'http://localhost'),path=url.pathname,method=req.method,ip=req.socket.remoteAddress||'unknown';if(path==='/health'&&method==='GET')return reply(200,{ok:true,mode:'online-preview'});
 if(staticEnabled&&method==='GET'&&path==='/config/conteudo.js'){const version=JSON.parse(readFileSync(new URL('../version.json',import.meta.url),'utf8')).version;res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});res.end('window.ELDORIA_CONFIG={versao:'+JSON.stringify(version)+',onlineApi:window.location.origin};');return;}
 if(staticEnabled&&method==='GET'&&staticFiles.has(path)){const [file,type]=staticFiles.get(path);res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");res.writeHead(200,{'Content-Type':type});res.end(readFileSync(fileURLToPath(new URL(file,import.meta.url))));return;}
 rate('ip:'+ip,600,60000);
 if(method==='POST'&&['/auth/register','/auth/login'].includes(path)){
  rate('auth:'+ip,12,60000);const p=await body(req),u=typeof p.username==='string'?p.username.trim().toLowerCase():'',pw=p.password;if(!/^[a-z0-9_]{3,24}$/.test(u)||typeof pw!=='string'||pw.length<12||pw.length>128)fail(400,'Usuário: 3–24 letras, números ou _. Senha: 12–128 caracteres.');rate('user:'+u,10,300000);
  let a=db.prepare('SELECT * FROM accounts WHERE username=?').get(u);if(path.endsWith('register')){if(a)fail(409,'Usuário indisponível.');const pass=await password(pw),id=randomUUID();try{db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run(id,u,pass,Date.now());}catch(e){if(db.prepare('SELECT id FROM accounts WHERE username=?').get(u))fail(409,'Usuário indisponível.');throw e;}a={id,username:u};}else{const check=await password(pw,a?.password.split(':')[0]||'00000000000000000000000000000000');if(!a||!timingSafeEqual(Buffer.from(check),Buffer.from(a.password)))fail(401,'Usuário ou senha inválidos.');}
  const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),a.id,Date.now()+age);return reply(200,{token,username:a.username});
 }
 const a=auth(req);rate('account:'+a.id,240,60000);
 if(path==='/auth/logout'&&method==='POST'){db.prepare('DELETE FROM sessions WHERE hash=?').run(a.key);return reply(200,{ok:true});}
 if(path==='/state'&&method==='GET')return reply(200,g.state(a.id));
 if(path==='/character'&&method==='POST'){const p=await body(req);return reply(201,g.create(a.id,p.name,p.cls));}
 if(path==='/action'&&method==='POST'){rate('actions:'+a.id,60,60000);return reply(200,g.action(a.id,await body(req)));}
 if(path==='/market'&&method==='GET')return reply(200,g.market(a.id));
 if(path==='/market'&&method==='POST'){rate('trade:'+a.id,30,60000);return reply(200,g.trade(a.id,await body(req)));}
 if(path==='/ranking'&&method==='GET')return reply(200,g.ranking(url.searchParams.get('category')||'level',Number(url.searchParams.get('page')||0)));
 fail(404,'Rota inexistente.');
 }catch(e){if(!(e instanceof Fault))console.error('Erro interno:',e.code||e.name);if(!res.headersSent)reply(e instanceof Fault?e.status:500,{error:e instanceof Fault?e.message:'Erro interno.'});else res.end();}
});
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{clearInterval(background);server.close(()=>{db.close();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();});
server.requestTimeout=15000;server.headersTimeout=10000;server.listen(Number(process.env.PORT||8787),process.env.HOST||'127.0.0.1',()=>console.log('Eldoria online API '+server.address().port));
