// Deterministic smoke scenarios. Uses an in-memory database and synthetic characters.
import { DatabaseSync } from 'node:sqlite';
import { game, schema, vocations, slots, quote } from './game.mjs';
import { tree, canLearn, potionRecipes, potions } from './combat.mjs';
import { rebuild } from './equipment.mjs';
import { materialSale, generate, professionOdds, professionInterval } from './content.mjs';

function run(vocation, seed, zone=0, mode="hunt", prepared=false, options={}) {
 const db=new DatabaseSync(':memory:');
 schema(db);
 let now=100000;
 const random=()=>{ seed=(Math.imul(1664525,seed)+1013904223)>>>0; return seed/2**32; };
 const g=game(db,{clock:()=>now,random});
 db.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('bench','bench','fixture',0);
 g.create('bench','Simulacao',vocation);
 if(prepared){
  const row=db.prepare('SELECT data FROM characters WHERE account=?').get('bench');
  const player=JSON.parse(row.data),level=10*zone+5;
  const primary={war:'str',ranger:'dex',mage:'int',cleric:'wis',necro:'int'}[vocation];
  player.level=level;
  player.attrs[primary]=Math.floor(level*.7);
  player.attrs.vit=Math.floor(level*.4);
  player.skill=Math.ceil(level*.65);
  const paths=tree(vocation,player).flatMap(path=>path.nodes);
  for(let i=0;i<level-1;i++){
   const talent=paths.find(node=>canLearn(vocation,player,node.id));
   if(!talent)break;
   player.talents[talent.id]=(player.talents[talent.id]||0)+1;
  }
  player.potions={hp2:10,mp2:10};
  player.autoPotion={hp:45,mp:35,hpKey:'hp2',mpKey:'mp2'};
  db.prepare('UPDATE items SET equipped=0 WHERE owner=?').run('bench');
  const insert=db.prepare("INSERT INTO items(id,owner,name,slot,tier,level,rarity,source,power,data,equipped) VALUES(?,?,?,?,?,?,2,'hunt',0,?,1)");
  for(const slot of Object.keys(slots)){
   const item=generate({tier:zone,rarity:2,quality:2,vocation,slot},'hunt',0,()=>.5,level);
   insert.run(slot,'bench',slot,slot,zone,item.level,JSON.stringify(rebuild({rarity:2,slot,data:{baseMods:item.baseMods,upgrade:4,quality:2,vocation}})));
  }
  player.hp=player.mana=100000;
  db.prepare('UPDATE characters SET data=?,level=? WHERE account=?').run(JSON.stringify(player),level,'bench');
 }
 g.action('bench',{action:'start',mode,zone,...options});
 let character;
 for(let i=0;i<(prepared?5:30);i++){
  now+=60000;
  character=g.state('bench',true).character;
  if(!character.activity)break;
 }
 db.close();
 const session=character.analyzer||character.history[0];
 return {kills:character.kills,deaths:character.deaths,level:character.level,gold:character.gold,dungeons:character.dungeons,bosses:character.bosses,minutes:(session?.seconds||0)/60,net:(session?.gold||0)+(session?.sellableValue??session?.itemValue??0)-(session?.consumableCost||0)};
}
for(const vocation of Object.keys(vocations)){
 const runs=[41,71,97,131,173].map(seed=>run(vocation,seed));
 const range=key=>[Math.min(...runs.map(run=>run[key])),Math.max(...runs.map(run=>run[key]))].join('-');
 console.log(vocation,'kills',range('kills'),'deaths',range('deaths'),'level',range('level'),'gold',range('gold'));
}
for(const [key,recipe] of Object.entries(potionRecipes))
 console.log(key,'effective craft',recipe.gold+recipe.herbs*materialSale('herb:0:0'),'shop',potions[key].price);

const full=process.argv.includes('--full');
const regions=full?Array.from({length:10},(_,i)=>i):[0,4,9];
const combatScenarios=[
 ['hunt','hunt',{}],
 ['dungeon','dungeon',{}],
 ['boss','boss',{}]
];
if(full)combatScenarios.push(['dungeon IV','dungeon',{difficulty:4}],['tower','dungeon',{tower:true}]);
for(const zone of regions)for(const [name,mode,options] of combatScenarios){
 const trials=Object.keys(vocations).flatMap(vocation=>[41,97,173].map(seed=>run(vocation,seed,zone,mode,true,options)));
 const kills=trials.map(run=>run.kills);
 const netPerMinute=trials.map(run=>run.minutes?run.net/run.minutes:0).sort((a,b)=>a-b);
 console.log('T'+(zone+1),name,'deaths',trials.filter(run=>run.deaths).length+'/'+trials.length,
  'kills',Math.min(...kills)+'-'+Math.max(...kills),'completed',trials.filter(run=>run.dungeons||run.bosses).length,
  'median net value/min',Math.round(netPerMinute[Math.floor(netPerMinute.length/2)]));
}
for(const [label,profession] of [
 ['novice',{level:1,talents:{}}],
 ['specialist',{level:100,talents:{quality:5,speed:3,yield:3}}]
]){
 const odds=professionOdds(profession),zone=label==='novice'?0:9;
 const expectedValue=odds.reduce((sum,pct,rarity)=>sum+pct/100*materialSale('herb:'+zone+':'+rarity),0);
 console.log('Gathering',label,'seconds per action',professionInterval(profession)/1000,'gold per base drop',expectedValue.toFixed(2));
}
for(const source of ['hunt','craft','dungeon','boss']){
 const settlement=quote({source,level:45,rarity:2},1000);
 console.log('Market',source,'net',settlement.net,'burn',settlement.burn);
}