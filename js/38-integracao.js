/* Foundation web: runtime settings, native-resolution terrain, collision and compact UI. */
(()=>{
'use strict';
const cfg=window.ELDORIA_CONFIG;
const versionLabel=document.querySelector('.brand .eyebrow');if(versionLabel)versionLabel.textContent='Idle RPG · versão '+cfg.versao;
const num=(v,d,a,b)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
const factor=k=>num(cfg.balance?.[k],1,.1,5);
for(const [id,ed] of Object.entries(cfg.enemies||{})){const e=ENEMIES[id];if(!e)continue;for(const k of ['hp','atk','xp','gold'])if(Number.isFinite(ed[k]))e[k]=num(ed[k],e[k],1,1e8);if(typeof ed.name==='string')e.name=ed.name;}
for(const [id,ed] of Object.entries(cfg.classes||{})){if(!CLASSES[id])continue;for(const k of Object.keys(CLASSES[id].base))if(Number.isFinite(ed.base?.[k]))CLASSES[id].base[k]=num(ed.base[k],CLASSES[id].base[k],0,1000);}
for(const [id,ed] of Object.entries(cfg.regions||{}))if(ZONES[id]&&typeof ed.name==='string')ZONES[id].name=ed.name;
for(const [key,path] of Object.entries(cfg.maps||{}))if(stageArt23[key]&&typeof path==='string'){stageArt23[key]=path;delete stageImages23[key];}
const xp0=xpNeed;xpNeed=function(){return Math.max(1,Math.round(xp0()*factor('xpRequired')));};
const stats0=stats;stats=function(...a){const s=stats0(...a);s.dmg*=factor('damage');return s;};
const dmg0=window.eldoria26Damage;window.eldoria26Damage=function(...a){return Math.max(1,Math.round(dmg0(...a)*factor('enemyDamage')));};
const e0=enemy;enemy=function(...a){const e=e0(...a);return {...e,gold:Math.max(1,Math.round(e.gold*factor('gold')))};};
const d0=dropSpec;dropSpec=function(...a){const d=d0(...a);return {...d,rate:Math.min(1,d.rate*factor('loot'))};};
// Edit ordinary base skills without discarding existing rank/maestria scaling.
const fields={mana:3,cd:4,power:5,heal:6,guard:7}, additions={};
for(const [cl,changes] of Object.entries(cfg.skills||{})){if(!SKILLS[cl])continue;for(const [id,ed] of Object.entries(changes)){const row=SKILLS[cl].find(k=>k[0]===id);if(!row||id==='asc2')continue;if(typeof ed.name==='string')row[1]=ed.name;for(const [k,i] of Object.entries(fields))if(Number.isFinite(ed[k]))row[i]=num(ed[k],row[i],k==='cd'?1:0,k==='heal'?1:1000);if(Array.isArray(ed.effects))SKILL_EFFECTS[cl][id]=ed.effects.filter(k=>Object.hasOwn(EFFECTS,k));}}
for(const [id,ed] of Object.entries(cfg.passives||{})){const p=eldoria33.passives[id];if(p&&Number.isFinite(ed.value))p.value=num(ed.value,p.value,-100,100);}
for(const [cl,list] of Object.entries(cfg.newSkills||{})){if(!SKILLS[cl]||!Array.isArray(list))continue;additions[cl]=[];for(const k of list){if(!/^custom_[a-z0-9_]{1,30}$/.test(k.id)||SKILLS[cl].some(x=>x[0]===k.id)||typeof k.name!=='string')continue;const row=[k.id,k.name,'✦',num(k.mana,8,1,1000),num(k.cd,6,1,1000),num(k.power,1,0,10),num(k.heal,0,0,1),num(k.guard,0,0,1)];SKILLS[cl].push(row);SKILL_EFFECTS[cl][k.id]=(k.effects||[]).filter(e=>Object.hasOwn(EFFECTS,e));additions[cl].push({...k,element:ELEMENT12[k.element]?k.element:'physical'});const ref=eldoria34.fx.defs.get(cl+':x');if(ref)eldoria34.fx.defs.set(cl+':'+k.id,{...ref,key:cl+':'+k.id,name:k.name,element:k.element||ref.element});}}
const element0=skillElement12;skillElement12=function(id){const k=additions[state.cls]?.find(x=>x.id===id);return k?.element||element0(id);};
const n0=nodes;nodes=function(){const tree=n0().map(branch=>branch.map(n=>{const name=n.id==='asc2'?null:cfg.skills?.[state.cls]?.[n.id]?.name;const desc=cfg.passives?.[n.id]?.desc;return {...n,...(n.active&&typeof name==='string'?{name}:{}),...(typeof desc==='string'?{desc}:{})};}));for(const k of additions[state.cls]||[]){const i=Math.round(num(k.branch,0,0,2));if(tree[i])tree[i].push({id:k.id,name:k.name,active:true,max:3,level:Math.round(num(k.level,10,2,1000)),requires32:Array.isArray(k.requires)?k.requires.filter(id=>tree.flat().some(n=>n.id===id)):[],desc:'Habilidade personalizada'});}return tree;};
const name0=named16,reverse=new Map(Object.entries(cfg.itemNames||{}).map(([a,b])=>[b,a]));named16=function(...a){const s=name0(...a);return cfg.itemNames?.[s]||s;};
const icon0=itemIcon;itemIcon=function(it){return icon0(reverse.has(it.name)?{...it,name:reverse.get(it.name)}:it);};
// Physical-pixel terrain canvas; simulation and overlays stay in logical CSS coordinates.
const worldEl=document.getElementById('world'), terrain=document.createElement('canvas');terrain.id='terrain38';terrain.setAttribute('aria-hidden','true');worldEl.before(terrain);const tc=terrain.getContext('2d',{alpha:false});let lastMap=null,lastArgs=[];
window.eldoria38Terrain=function(now,cw,ch,im){const dpr=Math.min(num(cfg.visual?.mapDprMax,2.5,1,4),devicePixelRatio||1,4096/cw,4096/ch);const w=Math.max(1,Math.round(cw*dpr)),h=Math.max(1,Math.round(ch*dpr));if(terrain.width!==w||terrain.height!==h){terrain.width=w;terrain.height=h;lastMap=null;}let sx=0,sy=0,sw=0,sh=0;if(im?.complete&&im.naturalWidth){const iw=im.naturalWidth,ih=im.naturalHeight;if(state.mode==='hunt'){const span=worldW()-cam.w,offset=span>0?clamp(cam.x/span,0,1):.5;sx=iw*.26*offset;sw=iw*.74;sh=ih;}else{const fullH=worldH()/.62,top=-worldH()*.33/.62;sx=iw*cam.x/worldW();sy=ih*(cam.y-top)/fullH;sw=iw*cam.w/worldW();sh=ih*cam.h/fullH;}}const args=[sx,sy,sw,sh,w,h];if(lastMap===im&&args.every((a,i)=>Math.abs(a-lastArgs[i])<.02))return;lastMap=im;lastArgs=args;tc.fillStyle='#17171a';tc.fillRect(0,0,w,h);if(sw>0&&sh>0){tc.imageSmoothingEnabled=true;tc.imageSmoothingQuality='high';tc.drawImage(im,sx,sy,sw,sh,0,0,w,h);}};
// Collision uses conservative horizontal silhouettes and projected ground depth, not an art alpha mask.
const combat=()=>['hunt','boss','dungeon','trial'].includes(state.mode);
const fixed=()=>state.mode!=='hunt';
function foeWidth(){const id=ALIAS16[state.enemy]||state.enemy;if(state.mode==='boss'||(state.mode==='dungeon'&&state.wave===4))return 112;return (['slime','bat','spider','imp'].includes(id)?49:['golem','drake','elemental','boar'].includes(id)?78:66)*(fixed()?1.23:1)*(state.mode==='trial'?1.42:1);}
window.eldoria38Gap=()=>Math.round(((fixed()?54:36)+foeWidth()/2+6)*num(cfg.visual?.bodySpacing,1,.7,1.3));
window.eldoria38ServantGap=()=>Math.round(foeWidth()/2+(fixed()?32:23)+4);
function space(a,b,g,prefer){if(Math.abs(a.y-b.y)>(fixed()?70:42)||Math.abs(a.x-b.x)>=g-.05)return;const dir=Math.sign(b.x-a.x)||prefer||1;let q=fit34({x:a.x+dir*g,y:b.y});if(Math.abs(q.x-a.x)<g-.1)q=fit34({x:a.x-dir*g,y:b.y});if(Math.abs(q.x-a.x)>=g-.1&&valid34(q)){b.x=q.x;b.y=q.y;}}
let direction=1;function separate(now){if(!state.cls||!combat()||window.eldoria31Interlude?.()||state.rest)return;const e=enemyPoint(now);if(state.mode==='hunt'&&window.eldoria40Escaping?.())return;if(Math.abs(e.x-pos.x)>1)direction=Math.sign(e.x-pos.x);const g=window.eldoria38Gap();if(!state.active)space(e,pos,g,-direction);else space(pos,e,g,direction);if(Math.abs(e.x-pos.x)<g-.1&&Math.abs(e.y-pos.y)<=(fixed()?70:42))space(e,pos,g,-direction);}
// 0.38.1: reserve valid attack positions before walking; never fight the separation solver.
window.eldoria381StepServants=function(now,dt){
 const list=state.necro30?.servants||[];if(!list.length)return;
 const e=enemyPoint(now),arena=fixed(),eg=window.eldoria38ServantGap(),pg=arena?62:44,sg=arena?60:43,dir=Math.sign(e.x-pos.x)||direction;
 const engage=state.enemyHp>0&&!window.eldoria31Interlude?.(),points=list.map((a,i)=>window.eldoria36Minions.position(a,i,now));
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const blocks=(q,o,g)=>arena?((q.x-o.x)/g)**2+((q.y-o.y)/Math.min(65,g))**2<.999:Math.abs(q.x-o.x)<g-.05;
 const legal=(q,others=[])=>valid34(q)&&!blocks(q,pos,pg)&&!blocks(q,e,eg)&&!others.some(o=>blocks(q,o,sg));
 const candidates=(i)=>{const out=[],add=q=>{if(legal(q)&&!out.some(o=>dist(o,q)<1))out.push(q);};
  if(engage){for(const rad of [eg+2,eg+12])for(let j=0;j<(arena?16:2);j++){const t=j*Math.PI*2/(arena?16:2);add({x:e.x+Math.cos(t)*rad,y:arena?e.y+Math.sin(t)*rad:e.y});}}
  else for(const side of [-dir,dir])for(const d of [pg+4,pg+sg+8,pg+sg*2+12])for(const y of arena?[pos.y,pos.y-30,pos.y+30]:[pos.y])add({x:pos.x+side*d,y});
  const p=points[i],side=i%2===0?-dir:dir;out.sort((a,b)=>score(a)-score(b));function score(q){return dist(p,q)+(engage&&Math.sign(q.x-e.x)!==side?16:0)+(p.goal381?dist(q,p.goal381)*.2:0);}return out;};
 const choices=points.map((_,i)=>candidates(i)),goals=[];
 // Reserve a pair of mutually compatible slots if both servants exist.
 if(points.length===2){outer:for(const a of choices[0])for(const b of choices[1])if(!blocks(a,b,sg)){goals.push(a,b);break outer;}}
 if(!goals.length)for(let i=0;i<points.length;i++)goals.push(choices[i].find(q=>!goals.some(o=>o&&blocks(q,o,sg)))||null);
 for(let i=0;i<points.length;i++){const p=points[i],goal=goals[i],others=points.filter((_,j)=>j!==i),ok=q=>legal(q,others);
  p.phaseLeft381=Math.max(0,(p.phaseLeft381||0)-Math.max(0,Math.min(100,dt)));
  if(!goal){p.moving=false;continue;}p.goal381=goal;
  const phase=q=>{p.x=q.x;p.y=q.y;p.phase38=now;p.phaseLeft381=280;p.stall381=0;p.moving=false;};
  if(!ok(p)){const near=[];for(const [o,g] of [[pos,pg],[e,eg],...others.map(o=>[o,sg])])for(let j=0;j<(arena?16:2);j++){const t=j*Math.PI*2/(arena?16:2),q={x:o.x+Math.cos(t)*(g+3),y:arena?o.y+Math.sin(t)*(Math.min(65,g)+3):o.y};if(ok(q))near.push(q);}near.sort((a,b)=>dist(p,a)-dist(p,b));if(near.length)phase(near[0]);else if(ok(goal)&&dist(p,goal)<=180)phase(goal);continue;}
  const d=dist(p,goal);if(d<3){p.moving=false;p.stall381=0;p.dir=Math.sign(e.x-p.x)||p.dir;continue;}
  // Walk around occupied silhouettes in arenas; a brief spectral crossing is necessary in a one-dimensional hunt lane.
  const clear=(a,b)=>{const n=Math.max(1,Math.ceil(dist(a,b)/7));for(let k=1;k<=n;k++){const q={x:a.x+(b.x-a.x)*k/n,y:a.y+(b.y-a.y)*k/n};if(!ok(q))return false;}return true;};
  let waypoint=goal;
  if(arena&&!clear(p,goal)){const detours=[];for(const [o,g] of [[pos,pg],[e,eg],...others.map(o=>[o,sg])])for(let j=0;j<8;j++){const t=j*Math.PI/4,q={x:o.x+Math.cos(t)*(g+12),y:o.y+Math.sin(t)*(Math.min(65,g)+12)};if(ok(q)&&clear(p,q)&&clear(q,goal))detours.push(q);}detours.sort((a,b)=>dist(p,a)+dist(a,goal)-dist(p,b)-dist(b,goal));if(detours.length)waypoint=detours[0];}
  const len=dist(p,waypoint),ms=Math.max(0,Math.min(100,dt)),travel=Math.min(len,(engage?.148:.17)*ms),q=len?walk34(p,{x:p.x+(waypoint.x-p.x)*travel/len,y:p.y+(waypoint.y-p.y)*travel/len}):p;
  if(ok(q)&&dist(p,q)>.05){p.x=q.x;p.y=q.y;p.moving=true;p.stall381=0;}else{p.moving=false;p.stall381=(p.stall381||0)+ms;if(p.stall381>=240){const len2=dist(p,goal),limit=Math.min(arena?180:360,len2);let crossed=false;for(let k=4;k<=limit+4;k+=4){const f=Math.min(1,k/Math.max(1,len2)),v={x:p.x+(goal.x-p.x)*f,y:p.y+(goal.y-p.y)*f};if(!ok(v)){crossed=true;continue;}if(crossed){phase(v);break;}}}}
  p.dir=engage?(Math.sign(e.x-p.x)||p.dir):(Math.sign(waypoint.x-p.x)||p.dir);
 }
};
const move0=moveCombat11;moveCombat11=function(now,dt){const r=move0(now,dt);separate(now);window.eldoria36Minions.step(now,dt);return r;};
const spawn0=spawn;spawn=function(...a){const r=spawn0(...a);if(state.cls&&combat())separate(gameNow28());return r;};
// Accessible compact tooltip, including touch/tap; no HTML interpretation of descriptions.
const tip=document.createElement('div');tip.id='detail-tip38';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);let current=null,pinned=false;
function detail(el){return el?.dataset.detail38||el?.textContent?.trim();}function show(el){if(!detail(el))return;current=el;tip.textContent=detail(el);tip.hidden=false;const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;tip.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+'px';tip.style.top=Math.max(8,Math.min(innerHeight-h-8,r.bottom+6))+'px';}
function hide(){current=null;pinned=false;tip.hidden=true;}
document.addEventListener('pointerover',e=>{const b=e.target.closest?.('[data-detail38],.window-body p.muted,.window-body .sheet-note,.window-body .era-desc');if(b&&!pinned&&(b.dataset.detail38||b.scrollHeight>b.clientHeight+2))show(b);});document.addEventListener('pointerout',e=>{if(!pinned&&current&&e.target.closest?.('[data-detail38],.window-body p.muted,.window-body .sheet-note,.window-body .era-desc')===current&&!current.contains(e.relatedTarget))hide();});document.addEventListener('focusin',e=>{const b=e.target.closest?.('[data-detail38],.window-body p.muted,.window-body .sheet-note,.window-body .era-desc');if(b&&!pinned&&(b.dataset.detail38||b.scrollHeight>b.clientHeight+2))show(b);});document.addEventListener('focusout',e=>{if(!pinned&&e.target===current)hide();});document.addEventListener('click',e=>{const b=e.target.closest?.('[data-detail38],.window-body p.muted,.window-body .sheet-note,.window-body .era-desc');if(b&&(b.dataset.detail38||b.scrollHeight>b.clientHeight+2)){e.preventDefault();e.stopImmediatePropagation();if(pinned&&current===b)hide();else{show(b);pinned=true;}}else if(pinned)hide();},true);document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});window.addEventListener('resize',hide);document.addEventListener('scroll',hide,true);
// A new version becomes available on the same domain; never interrupt a fight automatically.
// Developer catalog is a read-only snapshot, not a multiplayer admin API.
window.eldoria38={version:cfg.versao,terrain,space,separate,catalog:()=>({enemies:ENEMIES,classes:CLASSES,regions:ZONES,skills:SKILLS,skillEffects:SKILL_EFFECTS,items:[...window.eldoria35Catalog.newNames],maps:stageArt23,runes:RUNES,passives:eldoria33.passives,trees:eldoria33.trees})};
})();
