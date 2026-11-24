/* 0.46.4: original socket and rune families; authoritative transactions in game.mjs. */
import balance from '../js/49-modelo.js';
import {rollOdds,itemPower45,materialPrice} from './content.mjs';
const EFFECTS={bleed:['Sangramento','','',5],stun:['Atordoamento','','',2],slow:['Lentidão','','',5],expose:['Exposição','','',6],poison:['Veneno','','',8],burn:['Queimadura','','',4],freeze:['Congelamento','','',2],shock:['Shock','','',5]};
const EFFECT_DESC=Object.fromEntries(Object.keys(EFFECTS).map(k=>[k,'']));
const RARITIES=[['Comum'],['Incomum'],['Raro'],['Épico'],['Lendário']];
const SLOTS={weapon:'Arma',head:'Cabeça',armor:'Peitoral',offhand:'Mão secundária',hands:'Luvas',legs:'Calças',feet:'Botas',ring:'Anel',accessory:'Amuleto'};
const RUNES={},RUNE_PRICE=[40,100,260,750,2400],RUNE_PROC=[5,8,12,16,22];
const runeFamilies={};function family(slot,id,name,mod,amount,label,effect){runeFamilies[`${slot}:${id}`]={slot,id,name,mod,amount,label,effect};}
for(const effect of Object.keys(EFFECTS))family('weapon',effect,EFFECTS[effect][0],null,null,null,effect);
family('weapon','might','Fio profano','damage',[1,2,3,5,7],'Dano base');
family('head','memory','Memória','mana',[4,7,11,16,22],'PM máximo');family('head','will','Vontade','tenacity',[1,2,3,4,5],'p.p. de tenacidade');
family('armor','ward','Égide','r30reduction',[1,1,2,3,4],'p.p. de redução de dano');family('armor','vigor','Vigor','hp',[5,9,14,20,28],'PV máximo');
family('offhand','barrier','Muralha','def',[1,2,3,4,6],'Defesa');family('offhand','flux','Condutor','r30regen',[1,2,3,4,6],'décimos de PM/s');
family('hands','focus','Precisão','crit',[1,1,2,3,4],'p.p. de crítico');family('hands','rhythm','Cadência','haste',[1,2,3,4,5],'p.p. de ataque extra');
family('legs','endurance','Resiliência','vit',[1,1,2,3,4],'Vitalidade');family('legs','balance','Renovação','r30recovery',[1,2,3,4,5],'% PV recuperados por abate');
family('feet','evasion','Passo espectral','r30dodge',[1,1,2,3,4],'p.p. de esquiva');family('feet','travel','Passo ligeiro','r30move',[2,3,5,7,9],'% de deslocamento em combate');
family('ring','verity','Veredicto','r30critmult',[2,4,6,8,12],'p.p. de multiplicador crítico');family('ring','learning','Maestria','skill',[1,1,2,3,4],'Maestria efetiva');
family('accessory','ritual','Ritual','r30special',[1,2,3,4,6],'% de potência de habilidade');family('accessory','grace','Graça','r30heal',[1,2,3,4,6],'p.p. de potência de cura');
const runeKey=(f,r)=>`r30_${f.slot}_${f.id}_${r}`;
for(const f of Object.values(runeFamilies))for(let r=0;r<5;r++){const k=runeKey(f,r),val=f.amount?.[r];RUNES[k]={name:`Runa de ${f.name} · ${RARITIES[r][0]}`,slot:f.slot,rarity:r,price:RUNE_PRICE[r],mods:f.mod?{[f.mod]:val}:{},effect:f.effect,proc:f.effect?RUNE_PROC[r]:undefined,desc:f.effect?`${RUNE_PROC[r]}% por golpe · ${EFFECTS[f.effect][0]} por ${EFFECTS[f.effect][3]} s. ${EFFECT_DESC[f.effect]}`:`+${val} ${f.label} · somente ${SLOTS[f.slot]}.`,family:f.id};}

export const runes=Object.freeze(RUNES);
const odds=[[90,10,0,0],[70,25,5,0],[35,50,13,2],[15,45,32,8],[5,25,45,35]];
const elem=['poison','bleed','slow','stun','expose','freeze','burn','shock'];
const pools=[['bleed','slow','poison'],['stun','expose','freeze'],['burn','shock','freeze'],...Array.from({length:7},(_,j)=>[elem[j%8],elem[(j+2)%8],elem[(j+4)%8]])];
const passive=Object.values(runeFamilies).filter(f=>!f.effect);
export function runeDrop(z,random){const pool=[...pools[z].map(e=>runeFamilies['weapon:'+e]),...Array.from({length:4},(_,i)=>passive[(z*4+i)%passive.length])];return runeKey(pool[Math.floor(random()*pool.length)],rollOdds([66,24,8.5,1.3,.2],random));}
export function newSockets(rarity,random){return rollOdds(odds[rarity],random);}
const armorSlots=['head','armor','legs','hands','feet'];
export function itemData(i){const d=i.data;return {...d,upgrade:d.upgrade??0,refine:d.refine??0,sockets:d.sockets??(i.starter?0:i.rarity>=4?2:i.rarity>=2?1:0),runes:d.runes??[],setId:d.relic==null&&i.rarity>=2&&armorSlots.includes(i.slot)?i.tier:null};}
export function rebuild(i){const d=itemData(i),raw={};for(const [k,v] of Object.entries(d.baseMods||{}))raw[k]=Math.round(Math.max(1,Math.round(v*(1+.1*d.upgrade)))*(1+.035*d.refine));for(const key of d.runes){const r=runes[key];if(!r||r.slot!==i.slot)throw Error('Runa incompatível');for(const [k,v] of Object.entries(r.mods))raw[k]=(raw[k]||0)+v;}d.mods=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,balance.itemMod(k,v,!!i.starter)]));return d;}
export function upgradeQuote(i){const d=itemData(i),n=d.upgrade+1,z=i.tier,r=Math.max(0,i.rarity-1),req={['mob:'+z+':'+r]:2+Math.floor(n/2),['mining:'+z+':'+r]:1+Math.floor(n/3)};if(n>=5||d.relic!=null)req['boss:'+z]=1+Math.floor((n-1)/5);return {cost:n*20*materialPrice[i.rarity],req,allowed:!i.starter&&!i.escrow&&n<=10};}
export function refineQuote(i){const d=itemData(i),n=d.refine+1,z=i.tier;return {cost:100*n*(z+1)*materialPrice[i.rarity],req:{['boss:'+z]:n,['mining:'+z+':'+Math.max(0,i.rarity-1)]:3*n},allowed:!i.starter&&!i.escrow&&d.upgrade===10&&n<=3};}
export function setBonuses(list){const counts=Array(10).fill(0);for(const i of list){const id=itemData(i).setId;if(id!==null)counts[id]++;}let hp=0,def=0,damage=0;for(let z=0;z<10;z++)if(counts[z]>=3){if(z===0)hp+=.10;else if(z===1)def+=10;else if(z===2)damage+=.12;else{damage+=.06;hp+=.04;}}return {counts,hp,def,damage};}
export function runeProcs(list){const no={};for(const i of list)for(const key of itemData(i).runes){const r=runes[key];if(r?.effect)no[r.effect]=(no[r.effect]??1)*(1-r.proc/100);}return Object.fromEntries(Object.entries(no).map(([k,v])=>[k,1-v]));}
export function effectivePower(i){const d=itemData(i);return i.power+Math.max(0,itemPower45({...i,baseMods:Object.fromEntries(Object.entries(d.baseMods||{}).map(([k,v])=>[k,Math.round(v*(1+.1*d.upgrade)*(1+.035*d.refine))]))})-i.power)+d.runes.reduce((n,k)=>n+(runes[k]?.rarity??0)+1,0)+(d.enchant?2:0)+(d.awake?4:0)+(d.corrupt&&d.corrupt!=='scar'?3:0)+(d.relic!=null?8:0);}

export const elements=['physical','fire','ice','shock','arcane','holy','dark','poison','bleed'];
export const affinities=['poison','dark','fire','poison','ice','holy','physical','fire','arcane','dark'];
export const relics=[
{name:'Coração da Floresta Morta',slot:'accessory',mods:{vit:12,hp:85,def:8},effect:'+12% PV e 8% redução de dano'},
{name:'Lâmina do Rei Sepulcral',slot:'weapon',mods:{damage:36,str:8,dex:8,crit:6},effect:'+35% dano contra alvos abaixo de 30% PV'},
{name:'Selo do Dragão de Cinza',slot:'ring',mods:{damage:18,int:10,crit:10,skill:8},effect:'+10% dano e +20% potência de habilidade'},
...['Olho da Matriarca','Coração do Inverno','Rosário dos Mártires','Juramento do Marechal','Brasa do Titã','Selo da Lua Morta','Coroa da Noite Eterna'].map((name,j)=>{const z=j+3;return {name,slot:['accessory','ring','head'][j%3],mods:{damage:12+z*4,vit:4+z*2,hp:35+z*12,crit:3},effect:'+8% dano e +5% PV'};})];
export function relicData(z,cls){const r=relics[z],baseMods={...r.mods};if(cls==='cleric'&&baseMods.int){baseMods.wis=baseMods.int;delete baseMods.int;}return {baseMods,quality:3,vocation:cls,relic:z,upgrade:0,refine:0,sockets:3,runes:[],affixes:[],power:null};}
export function advancedQuote(i,a){const d=itemData(i),z=i.tier,rar=i.rarity,rules={reroll:{cost:90,allowed:Object.keys(d.baseMods||{}).length>0,req:{['mining:'+z+':0']:3}},enchant:{cost:60,allowed:true,req:{['herb:'+z+':0']:3}},corrupt:{cost:150,allowed:rar>=2&&!d.corrupt,req:{['boss:'+z]:1}},awaken:{cost:180,allowed:rar>=3&&d.upgrade>=5&&!d.awake,req:{['boss:'+z]:2}},addSocket:{cost:120,allowed:d.sockets<3,req:{['mining:'+z+':1']:4}}},q=rules[a];return {...q,cost:q.cost*(z+1)*materialPrice[rar],allowed:!i.starter&&!i.escrow&&q.allowed};}
export function advancedBonuses(list){const resist=Object.fromEntries(elements.map(k=>[k,0])),ids=new Set();let damage=0,hp=0,special=0,reduction=0,execute=0;for(const i of list){const d=itemData(i);if(d.relic!=null)ids.add(d.relic);if(d.enchant&&Object.hasOwn(resist,d.enchant))resist[d.enchant]+=.06+i.tier*.003;if(d.corrupt==='ward')for(const k of elements)resist[k]+=.025;if(d.corrupt==='power')damage+=.035;if(d.awake)special+=.04;if(['armor','offhand'].includes(i.slot))for(const k of elements)resist[k]+=i.tier*.003;}for(const z of ids){if(z===0){hp+=.12;reduction+=.08;}else if(z===1)execute=.35;else if(z===2){damage+=.10;special+=.20;}else{damage+=.08;hp+=.05;}}for(const k of elements)resist[k]=Math.min(.45,resist[k]);return {resist,damage:Math.min(.28,damage),hp:Math.min(.25,hp),special:Math.min(.25,special),reduction,execute,relics:[...ids]};}

export function npcValue(i){const d=itemData(i);return Math.round((6+i.tier*8)*materialPrice[i.rarity]*(1+.1*(d.quality??1))*(d.relic!=null?6:1)*(1+.2*d.sockets));}
