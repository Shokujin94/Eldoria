/* 0.39.0 — posicionamento, projéteis e estabilidade dos lacaios. */
(()=>{
'use strict';
const combat=()=>['hunt','boss','dungeon','trial'].includes(state.mode);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const toward=(a,b,n)=>{const d=dist(a,b);return d?{x:a.x+(b.x-a.x)*Math.min(1,n/d),y:a.y+(b.y-a.y)*Math.min(1,n/d)}:{x:a.x,y:a.y};};
const blocked=side=>hasStatus(side,'stun')||hasStatus(side,'freeze');
const slowed=side=>hasStatus(side,'slow')?.7:1;

// Reposition at the same movement speed as normal combat. Keep the ordinary attack clock.
let escape40=null,cool40=0,lastOwner40=null,lastFoe40=null,lastMap40='';
function activeEscape40(){return !!(escape40&&state.active&&combat()&&!state.rest&&escape40.owner===state&&escape40.foe===enemyPoint(gameNow28())&&escape40.map===mapKey34());}
window.eldoria40Escaping=activeEscape40;
window.eldoria40Sidestep=()=>{if(!activeEscape40()||state.mode!=='hunt')return 0;const d=Math.abs(pos.x-escape40.foe.x),g=window.eldoria38Gap();const t=Math.max(0,1-d/(g*1.5));return t*t*(3-2*t)*52;};
function startEscape40(e,r,g){
 const arena=state.mode!=='hunt',sign=Math.sign(e.x-pos.x)||1,dx=e.x-pos.x,dy=e.y-pos.y,d=Math.hypot(dx,dy)||1;
 if(!arena){const [lo,hi]=bounds34();const edge=sign>0?hi:lo;if(Math.abs(edge-pos.x)<g+10)return false;escape40={owner:state,foe:e,map:mapKey34(),sign,edge,left:8000};return true;}
 const ux=dx/d,uy=dy/d,opts=[];
 for(const side of [-1,1]){const around={x:e.x-uy*side*(g+40),y:e.y+ux*side*(g+40)},far={x:e.x+ux*r*.87-uy*side*35,y:e.y+uy*r*.87+ux*side*35};if(valid34(around)&&valid34(far)&&segment34(pos,around)&&segment34(around,far))opts.push([around,far]);}
 if(!opts.length)return false;
 opts.sort((a,b)=>dist(pos,a[0])+dist(a[0],a[1])-dist(pos,b[0])-dist(b[0],b[1]));
 escape40={owner:state,foe:e,map:mapKey34(),points:opts[0],left:8000,sign};return true;
}
function stepEscape40(now,ms,e,r,g,speed){
 if(!activeEscape40())return false;
 const a=escape40;
 // Count movement time only: casting and control effects must not consume the route budget.
 if(now>=heroHold11&&!blocked('hero')){
  a.left-=ms;
  if(state.mode==='hunt'){pos=walk34(pos,toward(pos,{x:a.edge,y:pos.y},speed*ms));}
  else{while(a.points.length&&dist(pos,a.points[0])<5)a.points.shift();if(a.points.length)pos=walk34(pos,toward(pos,a.points[0],speed*ms));}
 }
 const crossed=state.mode==='hunt'&&(pos.x-e.x)*a.sign>0,done=state.mode==='hunt'?(crossed&&(dist(pos,e)>=r*.84||Math.abs(pos.x-a.edge)<3)):!a.points.length||dist(pos,e)>=r*.90;
 // Do not hand back to the separation solver while the sprites are crossing.
 const clear=state.mode!=='hunt'||Math.abs(pos.x-e.x)>=g-.05;
 if((done||a.left<=0)&&clear){escape40=null;cool40=4500;}
 return true;
}
// Do not override attackReady: cooldowns, attack turns, range and cast pauses remain unchanged.

// Ranged combat: normal movement rates, finite retreat, and the normal stationary casting window.
window.eldoria39MoveRanged=function(now,dt){
 const e=enemyPoint(now),d=dist(pos,e),r=range11(),gap=window.eldoria38Gap(),ranged=foeRanged11();
 const ms=clamp(dt,0,100),speed=({ranger:.145,mage:.118,cleric:.115,necro:.12}[state.cls]||.12)*slowed('hero');
 if(lastOwner40!==state||lastFoe40!==e||lastMap40!==mapKey34()){escape40=null;cool40=0;lastOwner40=state;lastFoe40=e;lastMap40=mapKey34();}cool40=Math.max(0,cool40-ms);
 const dir=d>.01?{x:(e.x-pos.x)/d,y:(e.y-pos.y)/d}:{x:1,y:0};
 if(!stepEscape40(now,ms,e,r,gap,speed)&&now>=heroHold11&&!blocked('hero')){
  const desired=r*.88;
  if(d>r*.96)pos=walk34(pos,toward(pos,e,Math.min(d-desired,speed*ms)));
  else if(d<r*.66){
   const retreat=Math.min(r*.77-d,speed*.66*ms);
   const opts=[{x:pos.x-dir.x*retreat,y:pos.y-dir.y*retreat}];
   if(state.mode!=='hunt')for(const sign of [-1,1])opts.push({x:pos.x+sign*dir.y*retreat,y:pos.y-sign*dir.x*retreat});
   const valid=opts.map(q=>walk34(pos,q)).filter(q=>dist(q,pos)>.01).sort((a,b)=>dist(b,e)-dist(a,e));
   if(valid.length&&dist(valid[0],e)>d+.01)pos=valid[0];
   else if(cool40<=0&&startEscape40(e,r,gap))stepEscape40(now,ms,e,r,gap,speed);
  }
 }
 if(now>=foeHold11&&!blocked('enemy')){
  const n=dist(e,pos),reach=ranged?110:gap;
  const fs=(ranged?.137:.185)*(state.era20?.affixes?.includes('fast')?1.18:1)*slowed('enemy');
  if(n>reach){const q=walk34(e,toward(e,pos,Math.min(n-reach,fs*ms)));e.x=q.x;e.y=q.y;}
  else if(ranged&&n<Math.max(65,gap)){const dx=e.x-pos.x,dy=e.y-pos.y,ux=n>.01?dx/n:1,uy=n>.01?dy/n:0;const q=walk34(e,{x:e.x+ux*fs*.45*ms,y:e.y+uy*fs*.45*ms});e.x=q.x;e.y=q.y;}
 }
 dest=null;
};
// Stable attack slots. Actor collisions are soft while travelling, solid at the destination.
window.eldoria381StepServants=function(now,dt){
 const list=state.necro30?.servants||[];if(!list.length)return;
 const e=enemyPoint(now),arena=state.mode!=='hunt',eg=window.eldoria38ServantGap(),pg=arena?62:44,sg=arena?60:43;
 const engage=state.enemyHp>0&&!window.eldoria31Interlude?.(),ms=clamp(dt,0,100);
 const points=list.map((a,i)=>window.eldoria36Minions.position(a,i,now)),reserved=[];
 const lane=arena?0:lane34(),depth=38;
 const blocks=(q,o,g)=>((q.x-o.x)/g)**2+((q.y-o.y)/(arena?Math.min(65,g):Math.min(38,g)))**2<.998;
 const floor=q=>arena?valid34(q):valid34({x:q.x,y:lane})&&Math.abs(q.y-lane)<=depth+.01;
 const baseLegal=q=>floor(q)&&!blocks(q,pos,pg)&&!blocks(q,e,eg);
 const walk=(a,b)=>{if(arena)return walk34(a,b);const [lo,hi]=bounds34();return {x:clamp(b.x,lo,hi),y:clamp(b.y,lane-depth,lane+depth)};};
 // Tight arena corners require a coordinated pair of slots, rather than first-come allocation.
 let pair=null;
 if(arena&&engage&&points.length===2){
  const reach=list.map(a=>window.eldoria40ServantRole?.(a)?.reach||eg+16);
  const valid=(q,i)=>baseLegal(q)&&dist(q,e)<=reach[i]+.0001;
  const good=q=>q&&q.length===2&&valid(q[0],0)&&valid(q[1],1)&&!blocks(q[0],q[1],sg);
  const cache=points[0].pair42;
  if(good(points)){pair=points.map(p=>({x:p.x,y:p.y}));}
  else if(cache&&cache.other===points[1]&&cache.offsets){
   const q=cache.offsets.map(o=>({x:e.x+o.x,y:e.y+o.y}));if(good(q))pair=q;
  }
  if(!pair&&(!cache||cache.other!==points[1]||now-cache.t>=300||cache.offsets)){
   const options=reach.map((r,i)=>{
    const candidates=[];if(valid(points[i],i))candidates.push({...points[i]});
    const radii=new Set([Math.min(65,r),r-.01,Math.max(65,r*.8)]);
    for(let n=66;n<r;n+=6)radii.add(n);
    for(const rad of radii)for(let j=0;j<72;j++){const t=j*Math.PI/36,q={x:e.x+Math.cos(t)*rad,y:e.y+Math.sin(t)*rad};if(valid(q,i))candidates.push(q);}
    return candidates;
   });
   let best=Infinity;
   for(const a of options[0])for(const b of options[1])if(!blocks(a,b,sg)){
    const cost=dist(points[0],a)+dist(points[1],b);if(cost<best){best=cost;pair=[a,b];}
   }
   points[0].pair42={other:points[1],t:now,offsets:pair?.map(q=>({x:q.x-e.x,y:q.y-e.y}))||null};
  }
 }
 for(let i=0;i<points.length;i++){
  const p=points[i],a=list[i],others=points.filter((_,j)=>i!==j);
  const role=window.eldoria40ServantRole?.(a)||{},reach=role.reach||eg+16,anchor=engage?e:pos;
  const prior=reserved.slice();const legal=q=>baseLegal(q)&&!prior.some(o=>blocks(q,o,sg));
  const clear=q=>baseLegal(q)&&!others.some(o=>blocks(q,o,sg));
  const strikeAge=now-(a.attack31??-1e9),locked=strikeAge>=0&&strikeAge<420;
  const inReach=q=>dist(q,e)<=reach;
  const preferred=q=>!role.reach||dist(q,e)>=Math.max(eg,reach*.58);
  const stop=()=>{p.moving=false;p.motion39=(p.motion39||0)*Math.exp(-ms/95);p.phaseLeft381=0;if(!locked)p.dir=Math.sign(e.x-p.x)||p.dir;};
  if(engage&&legal(p)&&clear(p)&&inReach(p)&&(preferred(p)||locked)&&(!pair||dist(p,pair[i])<1.5)){
   reserved.push({x:p.x,y:p.y});p.goal42=null;stop();continue;
  }
  const old=p.goal42;
  let goal=pair?pair[i]:old&&old.engage===engage?{x:anchor.x+old.dx,y:arena?anchor.y+old.dy:lane+old.dy}:null;
  const usable=q=>q&&legal(q)&&(!engage||inReach(q));
  if(!pair&&!usable(goal)){
   const candidates=[],radii=engage?(role.reach?[Math.max(eg+2,reach*.8),Math.max(eg+2,reach*.95),eg+2]:[eg+3,eg+10,eg+15]):[pg+5,pg+sg+5,pg+sg*2+5];
   for(const r of radii)for(let j=0;j<24;j++){
    const t=j*Math.PI*2/24,q={x:anchor.x+Math.cos(t)*r,y:arena?anchor.y+Math.sin(t)*r:lane+Math.sin(t)*Math.min(depth,r)};
    if(usable(q))candidates.push(q);
   }
   // If all preferred slots are occupied, choose a legal waiting point near the enemy.
   if(!candidates.length){
    for(const r of [eg+sg+6,eg+sg*2+10,eg+sg*3+10])for(let j=0;j<16;j++){
     const t=j*Math.PI*2/16,q={x:e.x+Math.cos(t)*r,y:arena?e.y+Math.sin(t)*r:lane+Math.sin(t)*depth};
     if(legal(q))candidates.push(q);
    }
   }
   const score=q=>dist(p,q)+(others.some(o=>blocks(q,o,sg))?sg*1.5:0)+(role.guard?dist(q,pos)*.45:0)+(!arena?Math.abs(q.y-lane)*.45:0)+(engage&&!inReach(q)?200:0);
   candidates.sort((u,v)=>score(u)-score(v));goal=candidates[0]||null;
   p.goal42=goal&&inReach(goal)?{dx:goal.x-anchor.x,dy:goal.y-anchor.y,engage}:null;
  }
  if(!goal){p.moving=false;p.motion39=(p.motion39||0)*Math.exp(-ms/95);p.phaseLeft381=clear(p)?0:1;continue;}
  reserved.push(goal);
  if(clear(p)&&locked&&inReach(p)){stop();continue;}
  if(dist(p,goal)<1&&clear(p)){stop();continue;}
  // Never reset the route simply because the next step crosses an actor.
  // Phasing is visual and attack eligibility resumes only after clearing the obstruction.
  const before={x:p.x,y:p.y},q=walk(p,toward(p,goal,(engage?.22:.18)*ms));
  p.x=q.x;p.y=q.y;
  const moved=dist(before,p)>.01;
  p.phaseLeft381=clear(p)?0:1;
  p.moving=moved;p.motion39=(p.motion39||0)+(Number(moved)-(p.motion39||0))*(1-Math.exp(-ms/95));
  if(!locked)p.dir=(moved?Math.sign(p.x-before.x):Math.sign(e.x-p.x))||p.dir;
 }
};
// Projectiles start at hand/bow height and travel toward the existing collision body.
const projectile0=initProjectile18;
initProjectile18=function(p,now){
 const fresh=!Number.isFinite(p.px);
 if(fresh){const a=p.side==='hero'?pos:enemyPoint(now),b=p.side==='hero'?enemyPoint(now):pos,dir=Math.sign(b.x-a.x)||1;
  p.px=a.x+dir*12;p.py=a.y-(state.mode==='hunt'?27:36);
 }
 projectile0(p,now);
 if(fresh){const q=targetBody18(p.side,now),d=Math.hypot(q.x-p.px,q.y-p.py);p.speed18=clamp(d/(arrowKinds18.has(p.kind)?570:780),.16,.46);}
};
const kind0=projectileKind11;
projectileKind11=function(cast,incoming){if(!incoming&&state.cls==='necro'&&cast){const e=skillElement12(cast.id);if(['poison','blood','dark','fire','ice','arcane','shock','holy'].includes(e))return e;}return kind0(cast,incoming);};
const colors={arrow:'#f4e4ad',pierce:'#e5f5ff',poisonarrow:'#a8ee68',fire:'#ff8c45',ice:'#94e5ff',arcane:'#d1a3ff',holy:'#ffe29a',dark:'#be91e9',shock:'#b8c8ff',poison:'#91db70',blood:'#fb7080'};
const bursts=[];
const launch0=launch11;
launch11=function(...args){const r=launch0(...args);const p=state.pending11?.at(-1);if(p&&p.side==='hero'&&!suppress&&!document.hidden&&!catchingUp){bursts.push({x:p.px,y:p.py,t:gameNow28(),color:colors[p.kind]||colors.arcane,cast:!!p.cast,launch:true});}return r;};
const impact0=impact11;
impact11=function(side,dmg,crit,cast,s){if(dmg>0&&!suppress&&!document.hidden&&!catchingUp&&(side==='hero'?state.cls!=='war':foeRanged11())){const q=targetBody18(side,gameNow28());bursts.push({x:q.x,y:q.y,t:gameNow28(),color:colors[projectileKind11(cast,side==='enemy')]||colors.arcane,cast:!!cast});}return impact0(side,dmg,crit,cast,s);};
const projectDraw0=drawProjectiles11;
drawProjectiles11=function(now){
 for(const p of state.pending11||[]){if(!Number.isFinite(p.px))continue;
  const arrow=arrowKinds18.has(p.kind),color=colors[p.kind]||colors.arcane,ang=p.angle18||0,len=arrow?52:42;
  ctx.save();ctx.translate(p.px,p.py);ctx.rotate(ang);ctx.lineCap='round';ctx.shadowBlur=arrow?4:10;ctx.shadowColor=color;
  const gradient=ctx.createLinearGradient(-len,0,0,0);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,color);
  ctx.strokeStyle=gradient;ctx.lineWidth=arrow?3.3:p.cast?8:5;ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(arrow?-2:0,0);ctx.stroke();
  if(!arrow){ctx.fillStyle=color;for(let i=1;i<=4;i++){ctx.globalAlpha=.7-i*.1;ctx.beginPath();ctx.arc(-i*8,Math.sin(now/90+i*2)*5,Math.max(1,3-i*.4),0,Math.PI*2);ctx.fill();}}
  ctx.restore();
 }
 projectDraw0(now);
 for(let i=bursts.length-1;i>=0;i--){const f=bursts[i],age=(now-f.t)/340;if(age>=1||age<0){bursts.splice(i,1);continue;}
  ctx.save();ctx.globalAlpha=(1-age)*.85;ctx.strokeStyle=f.color;ctx.fillStyle=f.color;ctx.lineWidth=f.cast?2.5:1.5;ctx.shadowColor=f.color;ctx.shadowBlur=6;
  const radius=3+age*(f.cast?25:14);ctx.beginPath();ctx.arc(f.x,f.y,radius,0,Math.PI*2);ctx.stroke();
  for(let j=0;j<(f.cast?8:4);j++){const a=j*Math.PI*2/(f.cast?8:4);ctx.beginPath();ctx.arc(f.x+Math.cos(a)*radius,f.y+Math.sin(a)*radius,1.4,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
};
const switch0=switchActivity;switchActivity=function(...a){bursts.length=0;return switch0(...a);};
})();
