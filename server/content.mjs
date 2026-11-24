// Port of 0.45.0: js/12-combate-economia.js, js/41-itens.js, js/49-balanceamento.js, js/23-catalogo-e-bestiario.js.
import balance from '../js/49-modelo.js';
const mains={war:'str',ranger:'dex',mage:'int',cleric:'wis',necro:'int'};
const clamp41=(x,a,b)=>Math.max(a,Math.min(b,x)),pick=(a,rng)=>a[Math.min(a.length-1,Math.floor(rng()*a.length))],roll=(a,b,rng)=>a+Math.floor(clamp41(rng(),0,.999999999)*(b-a+1));
const names=[['Mucor, a Gosma Errante','Lobo de Uivacinza','Tecedeira do Espinhal','Cerval, o Javali Ferido','Lâmia da Bruma Verde'],['Ossário Andante de Valdren','Asa de Túmulo','Voraz das Catacumbas','Oficiante do Sino Rachado','Vassalo do Juramento Morto'],['Pedra Viva de Karvash','Draco das Sete Brasas','Íncubo da Carvoaria','Aguilhão de Vidro Negro','Vulcário, o Coração de Escória'],['Sugador de Várzea','Mastim dos Afogados','Tecedeira do Lodo','Torvo, o Inchado','Morwen, a Bruxa Submersa'],['Mucor de Cristal','Lobo de Dente Branco','Asa da Geada Fúnebre','Jotun de Nhal','O Sem-Sopro'],['Aranha de Costelas','Mastim das Urnas','Sacristão sem Olhos','Varkun, o Talhador de Marfim','Custódio das Cinzas'],['Vigia da Bandeira Rota','Mastim de Ferro','Besteiro da Última Patrulha','Cavaleiro de Elmo Vazio','Capelão do Sangue Seco'],['Verme da Fornalha','Fera de Pele em Brasa','Flagelante Rubro','Colosso do Ferro Líquido','Salamandra de Karvash'],['Umbral, o Rastejante','Lobo da Lua Cega','Vidente do Sol Morto','Algoz do Astro Partido','Serafim de Asas Queimadas'],['Limo da Boca do Mundo','Tricéfalo de Nethar','Aracne do Vazio','Gigante da Última Porta','Profeta do Silêncio Eterno']];

const bossNames=['Aldren, o Coração das Raízes','Odran, Rei do Juramento Partido','Karvash, Dragão da Cinza Eterna','Morghessa, Mãe dos Afogados','Nhal, o Arauto sem Primavera','Vortem, Cardeal de Marfim','Veyr, Marechal do Elmo Vazio','Azrak, Titã das Forjas Mortas','Elyr, Prelado do Sol Negro','Nethar, Senhor da Última Noite'];
export const xpNeed=l=>Math.round(62+22*l+11*l*l+14*l**1.55+Math.max(0,l-100)**2*14);
export const dropRates=[.055,.07,.085,.105,.13];
export const monsterOdds=[[86,12,1.85,.14,.01],[82,15,2.7,.28,.02],[77,18,4.4,.55,.05],[71,22,6.2,.72,.08],[66,25,7.8,1.08,.12]];
export const materialOdds=[[65,27,7,.9,.1],[55,30,12,2.7,.3],[47,32,16,4.5,.5],[38,34,20,7,1],[28,35,25,10,2]];
export const dungeonOdds=[38,38,20,3.8,.2],bossOdds=[48,34,15,2.85,.15];
export function rollOdds(odds,rng){let n=rng()*100;for(let i=0;i<odds.length;i++){n-=odds[i];if(n<0)return i;}return odds.length-1;}
function baseEnemy(z,i){const l=1+10*z;return {name:names[z][i],hp:Math.round((36+8.5*(l-1)+1.40*(l-1)**1.38)*[1,1.23,1.48,1.82,2.10][i]*(1+z*.045)),atk:Math.round((7+1.83*(l-1)+.025*(l-1)**1.5)*[1,1.14,1.29,1.52,1.75][i]),xp:Math.round((12+3.7*(l-1)+.19*(l-1)**1.5)*[1,1.16,1.35,1.56,1.83][i]),gold:Math.round((5+.52*(l-1))*[1,1.15,1.3,1.5,1.75][i])};}
export function enemy(z,i,mode='hunt',wave=1,level=1){const a=baseEnemy(z,i),boss=mode==='boss'||mode==='dungeon'&&wave===4;
 if(mode==='boss'){const last=baseEnemy(z,4);a.hp=Math.round(last.hp*(z===0?4.1:3.2));a.atk=Math.round(last.atk*1.4);a.xp*=4;a.gold*=4;}
 a.hp=Math.round(a.hp*balance.regionHP[z]);a.atk=Math.round(a.atk*balance.regionATK[z]);
 if(mode==='dungeon'){a.hp=Math.floor(a.hp*(boss?2.5:1.05+wave*.12));a.atk=Math.floor(a.atk*(boss?1.4:1+wave*.06));if(boss){a.xp*=2;a.gold*=2;}}
 if(boss)a.name=bossNames[z];else if(mode==='dungeon')a.name+=' de elite';
 const over=Math.max(0,level-(10+10*z));a.xp=Math.max(1,Math.round(a.xp*Math.max(.12,1/(1+over*.085))));a.gold=Math.max(1,Math.round(a.gold*Math.max(.35,1/(1+over*.035))));return a;}
const qFactor=[.85,1,1.12,1.25],rarFactor=[1,1.19,1.43,1.73,2.10],affixCount=[0,1,2,3,4];
const slotBase={
 weapon:{damage:7.5},offhand:{def:2.0,damage:1.3},armor:{def:3.1,hp:12},head:{def:1.3,hp:5},legs:{def:1.7,hp:4.5},hands:{damage:1.2,crit:1},feet:{def:1.1,dex:1},ring:{crit:1,skill:1.5},accessory:{crit:1.7,mana:3}
};
const pools={
 weapon:['damage','crit','skill','haste','str','dex','int','wis','r30critmult','r30special'],
 offhand:['def','hp','mana','vit','crit','tenacity','r30reduction','r30regen','wis'],
 armor:['def','hp','vit','tenacity','r30reduction','str','dex','int','wis'],
 head:['hp','def','mana','vit','int','wis','tenacity','r30heal','r30regen'],
 legs:['hp','def','vit','dex','tenacity','r30recovery','r30dodge','str','wis'],
 hands:['damage','crit','haste','skill','str','dex','int','wis','r30critmult'],
 feet:['def','dex','vit','haste','tenacity','r30dodge','r30recovery','mana'],
 ring:['crit','skill','mana','regen','haste','r30critmult','r30special','r30heal','int','wis'],
 accessory:['hp','mana','crit','regen','wis','int','vit','r30special','r30heal','r30regen']
};
const affixNames={damage:'Ferocidade',def:'Proteção',hp:'Vigor',crit:'Precisão',skill:'Maestria',str:'Força',dex:'Agilidade',int:'Intelecto',vit:'Resiliência',wis:'Discernimento',mana:'Reserva arcana',regen:'Fluxo',haste:'Cadência',tenacity:'Firmeza',r30reduction:'Égide',r30regen:'Meditação',r30recovery:'Renovação',r30dodge:'Evasão',r30critmult:'Devastação',r30special:'Ritual',r30heal:'Graça'};
const powers={
 execute:{name:'Fúria do Ocaso',min:8,max:12,desc:v=>'+'+v+'% de dano direto contra inimigos abaixo de 30% de PV.'},
 ward:{name:'Última Vigília',min:5,max:8,desc:v=>'Reduz em '+v+'% o dano direto recebido enquanto seu PV estiver abaixo de 40%.'},
 resonance:{name:'Ressonância Arcana',min:5,max:9,desc:v=>'+'+v+'% de dano direto de habilidades enquanto tiver ao menos 60% de mana.'},
 harvest:{name:'Colheita Vital',min:1,max:2,desc:v=>'Recupera '+v+'% do PV máximo ao derrotar um inimigo em combate.'},
 pact:{name:'Pacto Sepulcral',min:2,max:4,desc:v=>'+'+v+' pontos percentuais de poder dos lacaios do Necromante (limite total de 44%).'}
};
export function sourceRange(z,mode,index=0){const lo=1+10*z,hi=lo+9;if(mode==='hunt')return [Math.min(hi,lo+index*2),Math.min(hi,lo+index*2+2)];if(mode==='dungeon')return [lo+3,hi];if(mode==='boss')return [lo+6,hi];return [lo,lo+4];}
function bounds(k,n,level,rarity,quality,affix=false){
 const scale=1+(level-1)*.105,rf=rarFactor[rarity],q=qFactor[quality];
 const small={crit:[.75,1,5],haste:[.75,1,5],tenacity:[.75,1,6],regen:[.45,.34,3],r30regen:[1,.6,6],r30reduction:[.65,.32,3],r30recovery:[.65,.24,3],r30dodge:[.65,.32,3],r30critmult:[1.2,.70,7],r30special:[1,.45,4],r30heal:[1,.40,4]};
 let center;
 if(small[k]){const [base,slope,cap]=small[k];center=Math.min(cap,(base+slope*Math.sqrt(scale-1))*rf*q*(affix?.85:1));}
 else if(k==='damage'&&!affix&&n>=7){center=(4+3.5*scale)*rf*q;}
 else {center=n*scale*rf*q*(affix?1:1);}
 const low=Math.max(1,Math.floor(center*.84)),high=Math.max(low+1,Math.ceil(center*1.16));
 const cap=small[k]?.[2];return cap?[Math.min(cap,low),Math.min(cap,high)]:[low,high];
}
export function generate(it,mode,index,rng,chosenLevel=null){
 const z=it.tier,r=clamp41(it.rarity|0,0,4),q=clamp41(it.quality??1,0,3)|0,v=it.vocation;
 const [lo,hi]=sourceRange(z,mode,index),level=Number.isInteger(chosenLevel)?clamp41(chosenLevel,lo,hi):roll(lo,hi,rng),main=mains[v];
 const inherent={...slotBase[it.slot]},raw={},ranges={},affixes=[];
 inherent[main]=(inherent[main]||0)+1;
 if(['armor','head','legs','offhand'].includes(it.slot)){const k=v==='ranger'?'dex':v==='mage'?'int':'vit';inherent[k]=(inherent[k]||0)+.65;}
 if(['mage','cleric','necro'].includes(v)&&['weapon','offhand','ring','accessory'].includes(it.slot))inherent.mana=(inherent.mana||0)+2.4;
 if(v==='ranger'&&['weapon','hands','feet'].includes(it.slot))inherent.haste=1;
 if(v==='war'&&['armor','offhand'].includes(it.slot))inherent.tenacity=1;
 if(v==='necro'&&it.slot==='ring')inherent.regen=1;
 function add(k,n,affix){const [min,max]=bounds(k,n,level,r,q,affix),value=roll(min,max,rng);raw[k]=value;ranges[k]=[min,max];if(affix)affixes.push(k);}
 for(const [k,n] of Object.entries(inherent))add(k,n,false);
 const options=pools[it.slot].filter(k=>!Object.hasOwn(raw,k));
 for(let i=0;i<affixCount[r]&&options.length;i++){
  const k=pick(options,rng);options.splice(options.indexOf(k),1);
  const weight=k==='hp'?5.5:k==='mana'?3:k==='damage'?1.5:k==='def'?1.25:k==='skill'?1.2:.8;
  add(k,weight,true);
 }
 const pool=Object.keys(powers).filter(k=>k!=='pact'||v==='necro');
 let power=null;if(r>=3&&rng()<(r===3?.12:.30)){const key=pick(pool,rng),p=powers[key];power={key,value:roll(p.min,p.max,rng)};}
 return {level,required:level,source:mode||'forge',ranges,affixes,power,baseMods:raw};
}

const powerWeights45={damage:1,def:1.35,hp:.17,mana:.26,str:1.8,dex:1.8,int:1.8,vit:1.8,wis:1.8,skill:1.5,crit:2,haste:2,tenacity:1.5,regen:2,r30regen:1.8,r30reduction:2,r30recovery:1.5,r30dodge:2,r30critmult:1.3,r30special:1.5,r30heal:1.5};
const slotBudget45={weapon:10,offhand:7,armor:9,head:6,legs:6,hands:5,feet:5,ring:6,accessory:6};
export function itemPower45(it){
 if(!it)return 0;
 const raw=it.baseMods||it.mods||{},budget=slotBudget45[it.slot]||7;
 const sum=Object.entries(raw).reduce((n,[k,v])=>n+(Number.isFinite(v)?balance.itemMod(k,v,it.name.includes('de aprendiz'))*(powerWeights45[k]||1):0),0);
 return Math.max(1,Math.round(10*sum/budget));
}

export const materialPrice=[1,2,5,12,35];
export const craftOdds=[[70,24,5,.9,.1],[45,38,14,2.7,.3],[20,38,33,8,1],[8,22,42,24,4],[2,10,32,44,12]];
export function recipe(slot,z,grades={}){const kind=['weapon','offhand','head','armor','legs'].includes(slot)?'mining':['feet','hands'].includes(slot)?'wood':'herb',parts=[['mob',5],[kind,4],[kind==='mining'?'wood':'mining',2]],req={};let score=0,price=0;
 for(const [k,n] of parts){const r=grades[k]??0;if(!Number.isInteger(r)||r<0||r>4)throw RangeError('Qualidade inválida');req[k+':'+z+':'+r]=n;score+=r*n;price+=materialPrice[r]*n;}
 const quality=score/11,lo=Math.floor(quality),hi=Math.min(4,lo+1),t=quality-lo;if(lo>=2)req['boss:'+z]=lo-1;return {req,quality,cost:Math.ceil(40*(z+1)*price/11),odds:craftOdds[lo].map((v,i)=>v+(craftOdds[hi][i]-v)*t)};}
