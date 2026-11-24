import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {existsSync,chmodSync,unlinkSync} from 'node:fs';
const source=resolve(process.env.DB_PATH||'eldoria.sqlite'),dest=process.argv[2]&&resolve(process.argv[2]);
if(!dest||dest===source||!existsSync(source)||existsSync(dest))throw Error('Informe um novo caminho de backup; a base de origem precisa existir.');
process.umask(0o077);
const db=new DatabaseSync(source,{readOnly:true});let created=false;try{db.exec('PRAGMA busy_timeout=5000');db.prepare('VACUUM INTO ?').run(dest);created=true;chmodSync(dest,0o600);const copy=new DatabaseSync(dest,{readOnly:true});try{const ok=copy.prepare('PRAGMA integrity_check').all().every(r=>Object.values(r)[0]==='ok');if(!ok||copy.prepare('PRAGMA foreign_key_check').all().length)throw Error('Backup inválido.');console.log('Backup consistente e verificado.');}finally{copy.close();}}catch(e){if(created)unlinkSync(dest);throw e;}finally{db.close();}
