import {randomUUID,randomInt} from 'node:crypto';
import balance from '../js/49-modelo.js';
import craft from '../js/50-oficios-modelo.js';
export const MAX=1_000_000_000;
export const vocations={war:'Guerreiro',ranger:'Arqueiro',mage:'Mago',cleric:'Clérigo',necro:'Necromante'};
export const regions=['Bosque do Alvorecer','Ruínas de Valdren','Montes de Cinza','Pântano do Lamento','Geleiras de Nhal','Ossário dos Mártires','Fortaleza da Vigília','Fenda Rubra','Domínio do Eclipse','Abismo de Eldoria'];
export const profs={mining:'Mineração',wood:'Lenhador',herb:'Herbalismo'};
export const slots={weapon:'Arma',head:'Cabeça',armor:'Peitoral',offhand:'Mão secundária',hands:'Luvas',legs:'Calças',feet:'Botas',ring:'Anel',accessory:'Amuleto'};
export const gates=[1,8,18,28,38,48,58,68,78,88];
const sourceTax={hunt:0,craft:50,dungeon:100,boss:200},rarityMult=[1,1.25,1.65,2.15,2.85];
const weights={damage:2,hp:.12,def:1.5,str:1,dex:1,int:1,vit:1,wis:1};
const mains={war:'str',ranger:'dex',mage:'int',cleric:'wis',necro:'int'};
const bases={war:{str:8,dex:3,int:2,vit:7,wis:0},ranger:{str:3,dex:9,int:2,vit:6,wis:0},mage:{str:2,dex:3,int:10,vit:5,wis:0},cleric:{str:3,dex:2,int:0,vit:7,wis:8},necro:{str:2,dex:3,int:9,vit:6,wis:2}};
const rng=()=>randomInt(1_000_000)/1_000_000,integer=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
export class Fault extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(m,s=400)=>{throw new Fault(s,m);};
export function taxBps(i){if(!integer(i.level,1,100)||!integer(i.rarity,0,4)||!Object.hasOwn(sourceTax,i.source))fail('Item inválido.');return Math.min(1200,300+4*(i.level-1)+80*i.rarity+sourceTax[i.source]);}
export function quote(i,price){if(!integer(price,2,MAX))fail('Preço inválido.');const bps=taxBps(i),burn=Math.ceil(price*bps/10000);if(burn>=price)fail('Preço insuficiente.');return {bps,burn,net:price-burn,price};}
export function schema(db){db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,account TEXT NOT NULL REFERENCES accounts(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS characters(account TEXT PRIMARY KEY REFERENCES accounts(id),name TEXT NOT NULL,namekey TEXT UNIQUE NOT NULL,cls TEXT NOT NULL,gold INTEGER NOT NULL DEFAULT 0 CHECK(gold BETWEEN 0 AND 1000000000),data TEXT NOT NULL,level INTEGER NOT NULL DEFAULT 1,xp INTEGER NOT NULL DEFAULT 0,power INTEGER NOT NULL DEFAULT 10,mining INTEGER NOT NULL DEFAULT 1,wood INTEGER NOT NULL DEFAULT 1,herb INTEGER NOT NULL DEFAULT 1,craft INTEGER NOT NULL DEFAULT 1,collected INTEGER NOT NULL DEFAULT 0,mined INTEGER NOT NULL DEFAULT 0,logged INTEGER NOT NULL DEFAULT 0,herbs INTEGER NOT NULL DEFAULT 0,updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS items(id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES characters(account),name TEXT NOT NULL,slot TEXT NOT NULL,tier INTEGER NOT NULL CHECK(tier BETWEEN 0 AND 9),level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 100),rarity INTEGER NOT NULL CHECK(rarity BETWEEN 0 AND 4),source TEXT NOT NULL CHECK(source IN ('hunt','craft','dungeon','boss')),power INTEGER NOT NULL,data TEXT NOT NULL,starter INTEGER NOT NULL DEFAULT 0,equipped INTEGER NOT NULL DEFAULT 0,escrow INTEGER NOT NULL DEFAULT 0,spent INTEGER NOT NULL DEFAULT 0,CHECK(equipped+escrow+spent<=1));
CREATE UNIQUE INDEX IF NOT EXISTS one_equipped_slot ON items(owner,slot) WHERE equipped=1;
CREATE TABLE IF NOT EXISTS listings(id TEXT PRIMARY KEY,item TEXT NOT NULL REFERENCES items(id),seller TEXT NOT NULL REFERENCES characters(account),price INTEGER NOT NULL,bps INTEGER NOT NULL,burn INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN ('open','sold','cancelled')),buyer TEXT REFERENCES characters(account),created INTEGER NOT NULL,closed INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS one_open ON listings(item) WHERE status='open';
CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,listing TEXT UNIQUE NOT NULL REFERENCES listings(id),buyer TEXT NOT NULL,seller TEXT NOT NULL,price INTEGER NOT NULL,burn INTEGER NOT NULL,net INTEGER NOT NULL,created INTEGER NOT NULL,CHECK(price=burn+net));
`);}
const tx=(db,fn)=>{db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}};
export const rankingColumns=Object.freeze({level:'level',power:'power',professions:'(mining+wood+herb+craft)',mining:'mining',wood:'wood',herb:'herb',craft:'craft',collected:'collected',mined:'mined',logged:'logged',herbs:'herbs'});
export function game(db,{clock=Date.now,random=rng}={}){
 const row=id=>db.prepare('SELECT * FROM characters WHERE account=?').get(id);
 const get=id=>{const r=row(id);if(!r)fail('Crie seu personagem.',409);return {r,s:JSON.parse(r.data)};};
 const items=id=>db.prepare('SELECT * FROM items WHERE owner=? AND spent=0 ORDER BY equipped DESC,level DESC,id').all(id).map(i=>({...i,data:JSON.parse(i.data)}));
 const count=id=>db.prepare('SELECT count(*) n FROM items WHERE owner=? AND spent=0').get(id).n;
 const credit=(id,n)=>db.prepare('UPDATE characters SET gold=min(?,gold+?) WHERE account=?').run(MAX,n,id);
 const debit=(id,n)=>{if(db.prepare('UPDATE characters SET gold=gold-? WHERE account=? AND gold>=?').run(n,id,n).changes!==1)fail('Ouro insuficiente.',409);};
 const itemPower=mods=>Math.max(1,Math.round(Object.entries(mods).reduce((n,[k,v])=>n+v*(weights[k]||0),0)));
 function issue(id,slot,z,level,rarity,source,starter=false,equipped=false){
  const r=row(id),f=(1+level*.19)*rarityMult[rarity],main=mains[r.cls],raw=starter?{damage:3}:slot==='weapon'?{damage:4+2*f,[main]:f}:['armor','head','legs','offhand'].includes(slot)?{hp:7*f,def:1.5*f,vit:f*.6}:{[main]:f,damage:.65*f};
  const mods=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,balance.itemMod(k,Math.max(1,Math.round(v)),starter)]));
  const name=starter?'Arma de aprendiz':slots[slot]+' · '+regions[z],uid=randomUUID();
  db.prepare('INSERT INTO items(id,owner,name,slot,tier,level,rarity,source,power,data,starter,equipped) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(uid,id,name,slot,z,level,rarity,source,itemPower(mods),JSON.stringify({mods}),+starter,+equipped);return uid;
 }
 function cp(id,level){return 10*level+items(id).filter(i=>i.equipped).reduce((n,i)=>n+Math.round(i.power*rarityMult[i.rarity]),0);}
 function persist(id,s){const p=s.prof;db.prepare('UPDATE characters SET data=?,level=?,xp=?,power=?,mining=?,wood=?,herb=?,craft=?,collected=?,mined=?,logged=?,herbs=?,updated=? WHERE account=?').run(JSON.stringify(s),s.level,s.xp,cp(id,s.level),p.mining.level,p.wood.level,p.herb.level,s.craft.level,p.mining.total+p.wood.total+p.herb.total,p.mining.total,p.wood.total,p.herb.total,clock(),id);}
 function create(id,name,cls){return tx(db,()=>{if(row(id))fail('A conta já tem personagem.',409);name=typeof name==='string'?name.trim().normalize('NFC'):'';if(!/^[\p{L}\p{N} _-]{3,24}$/u.test(name)||!Object.hasOwn(vocations,cls))fail('Nome ou vocação inválidos.');const key=name.toLocaleLowerCase('pt-BR');if(db.prepare('SELECT account FROM characters WHERE namekey=?').get(key))fail('Nome indisponível.',409);const s={level:1,xp:0,hp:100,kills:0,activity:null,last:clock(),materials:{},prof:Object.fromEntries(Object.keys(profs).map(k=>[k,{level:1,xp:0,total:0}])),craft:{level:1,xp:0,success:0,fail:0},lastEvent:'Bem-vindo a Vespera.'};db.prepare('INSERT INTO characters(account,name,namekey,cls,data,updated) VALUES(?,?,?,?,?,?)').run(id,name,key,cls,JSON.stringify(s),clock());issue(id,'weapon',0,1,0,'hunt',true,true);persist(id,s);return view(id);});}
 function stats(id,r,s){const a={...bases[r.cls]},gear={damage:0,hp:0,def:0};a[mains[r.cls]]+=(s.level-1)*1.5;a.vit+=(s.level-1)*.75;for(const i of items(id).filter(x=>x.equipped))for(const [k,n] of Object.entries(i.data.mods)){if(k in a)a[k]+=n;if(k in gear)gear[k]+=n;}return {damage:Object.values(balance.damageParts(s.level,a,mains[r.cls],gear.damage)).reduce((x,y)=>x+y,0),hp:Math.round(balance.hpBase(s.level,a.vit,gear.hp)),def:balance.defenseBase(s.level,a.vit,gear.def)};}
 function mat(s,k,n){s.materials[k]=Math.min(MAX,(s.materials[k]||0)+n);}
 function earnXP(s,n){s.xp+=n;while(s.level<100&&s.xp>=40+s.level*s.level*7){s.xp-=40+s.level*s.level*7;s.level++;}if(s.level===100)s.xp=0;}
 function settle(id){const {r,s}=get(id),now=clock();if(!s.activity){s.last=now;persist(id,s);return s;}
  const {mode,z,prof}=s.activity,interval=mode==='gather'?6000:10000;
  let n=Math.floor(Math.max(0,Math.min(7_200_000,now-s.last))/interval);if(n<1)return s;
  s.last=now-(Math.max(0,now-s.last)%interval);
  for(let j=0;j<n&&s.activity;j++){
   if(mode==='gather'){const p=s.prof[prof],rar=random()<.10?1:0;mat(s,prof+':'+z+':'+rar,1);p.total++;p.xp+=craft.gatherXP(p.level,z);while(p.level<100&&p.xp>=20+p.level*12){p.xp-=20+p.level*12;p.level++;}if(p.level===100)p.xp=0;s.lastEvent='+1 recurso · '+profs[prof];}
   else{const st=stats(id,r,s),l=1+z*10,enemyHP=(z===0?36:45+l*7)*balance.regionHP[z],enemyATK=(7+l*.9)*balance.regionATK[z],turns=Math.ceil(enemyHP/Math.max(1,st.damage)),loss=Math.round(Math.max(0,turns-1)*enemyATK*(1-balance.armor(st.def,z))*.30);
    if(loss>=s.hp){s.hp=st.hp;s.activity=null;s.lastEvent='Derrota · retorno a Vespera.';break;}
    s.hp=Math.min(st.hp,s.hp-loss+Math.ceil(st.hp*.08));s.kills++;earnXP(s,Math.round(10+l*4));credit(id,Math.round(5+l*.65));mat(s,'mob:'+z+':0',1);
    if(random()<.12&&count(id)<120){const t=random(),rar=t<.02?4:t<.07?3:t<.22?2:t<.50?1:0,slot=Object.keys(slots)[Math.floor(random()*9)];issue(id,slot,z,l,rar,'hunt');s.lastEvent='Abate · equipamento encontrado.';}else s.lastEvent='Abate · ouro e material.';
   }
  }persist(id,s);return s;
 }
 function view(id){const r=row(id);if(!r)return {character:null};const s=JSON.parse(r.data);return {character:{name:r.name,cls:r.cls,gold:r.gold,power:r.power,...s,stats:stats(id,r,s)},items:items(id).map(({owner,...i})=>i)};}
 function state(id){return tx(db,()=>{if(row(id))settle(id);return view(id);});}
 function action(id,p){return tx(db,()=>{const s=settle(id),r=row(id),a=p.action;if(a==='stop'){s.activity=null;s.last=clock();}
  else if(a==='start'){const z=p.zone;if(!integer(z,0,9))fail('Região inválida.');if(p.mode==='hunt'&&s.level>=1+z*10)s.activity={mode:'hunt',z};else if(p.mode==='gather'&&Object.hasOwn(profs,p.prof)&&s.prof[p.prof].level>=gates[z])s.activity={mode:'gather',z,prof:p.prof};else fail('Requisito de região não atendido.');s.last=clock();}
  else if(a==='equip'){if(s.activity)fail('Pare a atividade antes de equipar.');const i=items(id).find(i=>i.id===p.itemId&&!i.escrow);if(!i||i.level>s.level)fail('Item indisponível ou nível insuficiente.');db.prepare('UPDATE items SET equipped=0 WHERE owner=? AND slot=? AND equipped=1').run(id,i.slot);db.prepare('UPDATE items SET equipped=1 WHERE id=?').run(i.id);s.hp=Math.min(s.hp,stats(id,r,s).hp);}
  else if(a==='unequip'){if(s.activity)fail('Pare a atividade.');db.prepare('UPDATE items SET equipped=0 WHERE id=? AND owner=? AND equipped=1').run(p.itemId,id);}
  else if(a==='craft'){if(s.activity)fail('Volte à cidade.');const z=p.zone,slot=p.slot,l=p.level;if(!integer(z,0,9)||!Object.hasOwn(slots,slot)||!integer(l,1+10*z,Math.min(100,10+10*z))||s.level<l||s.craft.level<l)fail('Requisitos de fabricação não atendidos.');const kind=['ring','accessory'].includes(slot)?'herb':['feet','hands'].includes(slot)?'wood':'mining',req={['mob:'+z+':0']:5,[kind+':'+z+':0']:4,[(kind==='mining'?'wood':'mining')+':'+z+':0']:2},price=40*(z+1);const base=z?items(id).find(i=>i.id===p.baseId&&i.tier===z-1&&i.slot===slot&&!i.escrow&&!i.equipped&&!i.starter):null;if(z&&!base)fail('Selecione peça anterior livre.');if(count(id)>=120&&!base)fail('Inventário cheio.');if(Object.entries(req).some(([k,v])=>(s.materials[k]||0)<v))fail('Materiais insuficientes.');debit(id,price);for(const [k,v] of Object.entries(req))s.materials[k]-=v;const ok=random()<craft.success(s.craft.level,l,0);if(ok){if(base)db.prepare('UPDATE items SET spent=1 WHERE id=?').run(base.id);const u=random(),rar=u<.001?4:u<.01?3:u<.06?2:u<.30?1:0;issue(id,slot,z,l,rar,'craft');s.craft.success++;}else s.craft.fail++;craft.advance(s.craft,craft.xp(s.craft.level,l,ok));s.lastEvent=ok?'Fabricação concluída.':'Falha: materiais e ouro consumidos; peça base preservada.';}
  else fail('Ação não reconhecida.');persist(id,s);return view(id);
 });}
 const listingSQL='SELECT l.id,l.item AS itemId,l.seller,l.price,l.bps,l.burn,l.price-l.burn AS net,l.status,l.created,i.name,i.slot,i.level,i.rarity,i.source,i.power,c.name AS sellerName FROM listings l JOIN items i ON i.id=l.item JOIN characters c ON c.account=l.seller';
 const listing=id=>db.prepare(listingSQL+' WHERE l.id=?').get(id);
 function market(id){return tx(db,()=>{settle(id);return {gold:row(id).gold,items:items(id).filter(i=>!i.starter&&!i.equipped&&!i.escrow).map(({owner,...i})=>i),offers:db.prepare(listingSQL+" WHERE l.status='open' ORDER BY l.created DESC LIMIT 200").all().map(({seller,...i})=>({...i,own:seller===id})),mine:db.prepare(listingSQL+' WHERE l.seller=? ORDER BY l.created DESC LIMIT 100').all().map(({seller,...i})=>i),totals:db.prepare('SELECT count(*) sales,coalesce(sum(burn),0) burned FROM ledger').get()};});}
 function trade(id,p){return tx(db,()=>{settle(id);if(p.action==='list'){const i=items(id).find(i=>i.id===p.itemId&&!i.starter&&!i.equipped&&!i.escrow);if(!i)fail('Item indisponível.',409);if(db.prepare("SELECT count(*) n FROM listings WHERE seller=? AND status='open'").get(id).n>=30)fail('Limite de 30 anúncios.');const q=quote(i,p.price),uid=randomUUID();db.prepare('UPDATE items SET escrow=1 WHERE id=?').run(i.id);db.prepare("INSERT INTO listings(id,item,seller,price,bps,burn,status,created) VALUES(?,?,?,?,?,?,'open',?)").run(uid,i.id,id,q.price,q.bps,q.burn,clock());return {ok:true,id:uid};}
  const l=listing(p.id);if(!l||l.status!=='open')fail('Anúncio indisponível.',409);const i=db.prepare('SELECT * FROM items WHERE id=?').get(l.itemId);if(!i||i.owner!==l.seller||!i.escrow||i.spent)fail('Custódia inválida.',409);
  if(p.action==='cancel'){if(l.seller!==id)fail('Anúncio de outro jogador.',403);db.prepare("UPDATE listings SET status='cancelled',closed=? WHERE id=?").run(clock(),l.id);db.prepare('UPDATE items SET escrow=0 WHERE id=?').run(i.id);return {ok:true};}
  if(p.action!=='buy'||l.seller===id||l.price!==p.price)fail('Compra inválida.',409);if(count(id)>=120)fail('Inventário cheio.');if(row(l.seller).gold+l.net>MAX)fail('Carteira do vendedor cheia.');debit(id,l.price);credit(l.seller,l.net);db.prepare('UPDATE items SET owner=?,escrow=0 WHERE id=?').run(id,i.id);db.prepare("UPDATE listings SET status='sold',buyer=?,closed=? WHERE id=?").run(id,clock(),l.id);db.prepare('INSERT INTO ledger VALUES(?,?,?,?,?,?,?,?)').run(randomUUID(),l.id,id,l.seller,l.price,l.burn,l.net,clock());return {ok:true,burn:l.burn,net:l.net};
 });}
 function ranking(category='level',page=0){if(!Object.hasOwn(rankingColumns,category)||!integer(page,0,1000))fail('Ranking inválido.');const col=rankingColumns[category];return {category,page,rows:db.prepare('SELECT name,cls,level,'+col+' AS score FROM characters ORDER BY score DESC, '+(category==='level'?'xp DESC, ':'')+'namekey ASC LIMIT 50 OFFSET ?').all(page*50).map((r,i)=>({rank:page*50+i+1,...r}))};}
 return {create,state,action,market,trade,ranking};
}
