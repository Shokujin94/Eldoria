// Offline restore only. Input comes from stdin; the caller MUST stop all writers first.
import {DatabaseSync} from 'node:sqlite';
import {resolve,dirname,join} from 'node:path';
import {existsSync,createWriteStream,renameSync,unlinkSync,chmodSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const target=resolve(process.env.DB_PATH||'eldoria.sqlite'),dir=dirname(target);
if(process.argv[2]!=='--confirm-offline-restore')throw Error('Restauração exige servidor parado e confirmação explícita.');
process.umask(0o077);
const id=new Date().toISOString().replace(/[^0-9]/g,'')+'-'+randomUUID().slice(0,8),stage=join(dir,'.restore-'+id+'.sqlite'),emergency=join(dir,'pre-restore-'+id+'.sqlite');
const sidecars=p=>[p+'-wal',p+'-shm',p+'-journal'];
function check(db){const rows=db.prepare('PRAGMA integrity_check').all();if(rows.length!==1||Object.values(rows[0])[0]!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Integridade do banco inválida.');for(const [table,cols] of Object.entries({accounts:['id','username','password','created'],sessions:['hash','account','expires'],characters:['account','name','gold','data','level','power'],items:['id','owner','data','escrow','spent'],listings:['id','item','status','seller'],ledger:['id','listing','burn','net']})){const fields=new Set(db.prepare('PRAGMA table_info('+table+')').all().map(r=>r.name));if(cols.some(k=>!fields.has(k)))throw Error('Backup não pertence a esta estrutura Eldoria: '+table);}}
function verify(path){const db=new DatabaseSync(path,{readOnly:true});try{check(db);}finally{db.close();}}
function sync(path){const fd=openSync(path,'r');try{fsyncSync(fd);}finally{closeSync(fd);}}
let size=0,replaced=false;
try{
 await pipeline(process.stdin,new Transform({transform(chunk,enc,cb){size+=chunk.length;if(size>1073741824)return cb(Error('Backup excede limite de 1 GiB.'));cb(null,chunk);}}),createWriteStream(stage,{flags:'wx',mode:0o600}));
 if(size<100)throw Error('Backup vazio ou inválido.');
 verify(stage);
 const copy=new DatabaseSync(stage);try{copy.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=DELETE; BEGIN IMMEDIATE;');copy.exec('DELETE FROM sessions;');if(copy.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='recovery_codes'").get())copy.exec('DELETE FROM recovery_codes;');copy.exec('COMMIT;');check(copy);}finally{copy.close();}
 if(existsSync(target)){
  const original=new DatabaseSync(target);try{original.exec('PRAGMA busy_timeout=5000');check(original);original.prepare('VACUUM INTO ?').run(emergency);const checkpoint=original.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get();if(checkpoint.busy)throw Error('Banco ainda em uso. Pare todos os processos.');}finally{original.close();}
  chmodSync(emergency,0o600);verify(emergency);sync(emergency);
  if(sidecars(target).some(existsSync))throw Error('Arquivos auxiliares ativos. Não remova manualmente; confirme que o servidor está parado.');
 }else if(sidecars(target).some(existsSync))throw Error('Arquivos auxiliares sem banco principal.');
 if(sidecars(stage).some(existsSync))throw Error('Backup temporário não está fechado.');
 chmodSync(stage,0o600);sync(stage);renameSync(stage,target);replaced=true;
 // fsync of directory makes the rename durable on Linux volumes.
 sync(dir);console.log('Restauração verificada. Sessões e códigos antigos invalidados.');if(existsSync(emergency))console.log('Cópia de emergência: '+emergency);
}catch(e){console.error(replaced?'Banco substituído; verifique a cópia de emergência e o estado antes de iniciar.':'Restauração interrompida antes de substituir o banco.',e.message);process.exitCode=1;}
finally{for(const p of [stage,...sidecars(stage)])if(existsSync(p))unlinkSync(p);}
