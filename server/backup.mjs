import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
const source=resolve(process.env.DB_PATH||'eldoria.sqlite'),dest=process.argv[2]&&resolve(process.argv[2]);
if(!dest||dest===source||!existsSync(source)||existsSync(dest))throw Error('Informe um novo caminho de backup; a base de origem precisa existir.');
const db=new DatabaseSync(source);try{db.exec('PRAGMA busy_timeout=5000');db.prepare('VACUUM INTO ?').run(dest);console.log('Backup consistente criado.');}finally{db.close();}
