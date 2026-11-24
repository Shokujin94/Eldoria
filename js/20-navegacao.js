
/* 0.34 — piso navegável, movimento seguro e saque no topo central. */
// Points are foot positions, calibrated against the art in the same world space as camera/projectiles.
const huntBounds34=[[.09,.91],[.06,.94],[.11,.89],[.10,.90],[.11,.89],[.075,.925],[.07,.93],[.12,.88],[.075,.925],[.10,.90]];
const floorBands34=[.59,.59,.59,.59,.59,.58,.59,.62,.58,.60];
function lane34(){return Math.round(worldH()*.68);}
function bounds34(){const a=huntBounds34[state.zone]||huntBounds34[0];return [Math.round(worldW()*a[0]),Math.round(worldW()*a[1])];}
function mapKey34(){return state.mode+':'+state.zone;}
function polygon34(){
 if(state.mode==='city')return [[82,182],[158,182],[232,174],[352,170],[392,141],[453,119],[604,119],[656,157],[729,181],[749,210],[749,285],[681,285],[651,352],[599,420],[565,511],[267,511],[250,436],[210,372],[159,319],[93,300],[82,258]];
 // Crypt floor begins at the base of the wall. Exclude side pillars and front edge.
 if(['dungeon','boss','trial'].includes(state.mode))return [[88,224],[712,224],[712,515],[88,515]];
 const a=huntBounds34[state.zone]||huntBounds34[0],top=Math.round(((floorBands34[state.zone]||.59)-.33)*600/.62-11);
 return [[800*a[0],top],[800*a[1],top],[800*a[1],512],[800*a[0],512]];
}
function inside34(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p.y)!==(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function valid34(p){if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;if(state.mode==='hunt'){const [a,b]=bounds34();return p.x>=a&&p.x<=b&&Math.abs(p.y-lane34())<.01;}
 if(!inside34(p,polygon34()))return false;if(state.mode==='city'&&currentNPCs().some(n=>Math.hypot(p.x-n.x,p.y-n.y)<22))return false;return true;}
const gridCache34=new Map();function grid34(){const key=mapKey34();if(gridCache34.has(key))return gridCache34.get(key);const step=12,nodes=[],by=new Map();for(let y=6;y<worldH();y+=step)for(let x=6;x<worldW();x+=step){const p={x,y};if(valid34(p)){nodes.push(p);by.set(x+','+y,p);}}const g={nodes,by,step};gridCache34.set(key,g);return g;}
function fit34(p){p={x:Number.isFinite(p?.x)?p.x:400,y:Number.isFinite(p?.y)?p.y:300};if(state.mode==='hunt'){const [a,b]=bounds34();return {x:clamp(p.x,a,b),y:lane34()};}if(valid34(p))return p;let best=null,dist=Infinity;for(const q of grid34().nodes){const d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<dist){best=q;dist=d;}}return best?{...best}:{x:400,y:300};}
function segment34(a,b){const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/5));for(let i=1;i<=n;i++)if(!valid34({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;return true;}
function walk34(a,b){a=fit34(a);if(state.mode==='hunt')return fit34(b);const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4)),dx=(b.x-a.x)/count,dy=(b.y-a.y)/count;for(let i=0;i<count;i++){const q={x:a.x+dx,y:a.y+dy};if(valid34(q))a=q;else{const x={x:a.x+dx,y:a.y},y={x:a.x,y:a.y+dy};if(valid34(x))a=x;else if(valid34(y))a=y;}}return a;}
let route34=null;function clearRoute34(){route34=null;}
function path34(a,b){if(segment34(a,b))return [b];const g=grid34(),near=(p)=>g.nodes.filter(q=>Math.hypot(p.x-q.x,p.y-q.y)<36&&segment34(p,q)).sort((u,v)=>Math.hypot(p.x-u.x,p.y-u.y)-Math.hypot(p.x-v.x,p.y-v.y))[0];const start=near(a),end=near(b);if(!start||!end)return [];const id=p=>p.x+','+p.y,queue=[start],seen=new Map([[id(start),null]]);for(let i=0;i<queue.length;i++){const q=queue[i];if(q===end)break;for(const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12],[12,12],[-12,12],[12,-12],[-12,-12]]){const n=g.by.get((q.x+dx)+','+(q.y+dy));if(n&&!seen.has(id(n))&&segment34(q,n)){seen.set(id(n),q);queue.push(n);}}}if(!seen.has(id(end)))return [];const raw=[b];for(let q=end;q;q=seen.get(id(q)))raw.push(q);raw.reverse();const smooth=[];let p=a;for(let i=0;i<raw.length;){let j=raw.length-1;while(j>i&&!segment34(p,raw[j]))j--;smooth.push(raw[j]);p=raw[j];i=j+1;}return smooth;}
function waypoint34(){if(!dest)return null;dest=fit34(dest);if(Math.hypot(dest.x-pos.x,dest.y-pos.y)<2){if(!state.active)dest=null;clearRoute34();return null;}if(state.mode==='hunt'||segment34(pos,dest))return dest;const key=mapKey34()+':'+dest.x+':'+dest.y;if(route34?.key!==key)route34={key,points:path34(pos,dest)};while(route34.points.length&&Math.hypot(route34.points[0].x-pos.x,route34.points[0].y-pos.y)<2)route34.points.shift();return route34.points[0]||null;}
function gatherPoint34(i){return fit34({x:50+hash(i,31)%700,y:70+hash(i,57)%460});}
function layoutLoot34(){const rail=document.getElementById('loot31'),rare=document.getElementById('rare31');if(!rail||!rare)return;const nav=document.querySelector('.quicknav'),r=nav?.getBoundingClientRect();const top=Math.max(8,Math.min(90,(r?.bottom||50)+8));rare.style.setProperty('--top34',top+'px');rail.style.setProperty('--top34',(top+(rare.hidden?0:rare.getBoundingClientRect().height+5))+'px');}
(()=>{
const point=enemyPoint;enemyPoint=function(now){const p=point(now);if(!p)return p;const q=fit34(p);p.x=q.x;p.y=q.y;return p;};
const next=nextTarget;nextTarget=function(){if(state.mode==='hunt'){targetSeed++;const [lo,hi]=bounds34(),x=fit34(pos).x,dist=265+hash(targetSeed,7)%180;let dir=targetSeed%4===0?-1:1;if(x+dir*dist>hi||x+dir*dist<lo)dir=-dir;target={x:clamp(x+dir*dist,lo,hi),y:lane34()};foe11=null;return;}next();if(target)target=fit34(target);};
const move=moveCombat11;moveCombat11=function(now,dt){pos=fit34(pos);const before={...pos},f=enemyPoint(now),old=f?{...f}:null;const r=move(now,dt);pos=walk34(before,pos);if(f&&old){const q=walk34(old,f);f.x=q.x;f.y=q.y;}return r;};
const servantPositions36=new WeakMap();
function servantPosition36(a,i,now=gameNow28()){
 const e=enemyPoint(now),dir=e.x>=pos.x?1:-1,key=mapKey34();let p=servantPositions36.get(a);
 if(!p||p.key!==key||p.owner!==state){const engaged=state.active&&state.enemyHp>0&&Math.hypot(e.x-pos.x,e.y-pos.y)<310&&!window.eldoria31Interlude?.(),gap=window.eldoria38ServantGap?.()||50;const q=fit34(engaged?{x:e.x+(i%2===0?-dir:dir)*gap,y:e.y}:{x:pos.x-dir*(44+i*44),y:pos.y+8+i*10});p={...q,key,owner:state,dir,moving:false};servantPositions36.set(a,p);}
 return p;
}
function servantTarget36(a,i,now){const p=servantPosition36(a,i,now),e=enemyPoint(now),engage=state.active&&!window.eldoria31Interlude?.()&&state.enemyHp>0&&!state.rest;return {p,e,engage};}
function stepServants36(now,dt){if(state.cls==='necro'&&state.active&&['hunt','dungeon','boss','trial'].includes(state.mode)&&!state.rest)window.eldoria381StepServants?.(now,dt);}
window.eldoria36Minions={position:servantPosition36,step:stepServants36,canHit(a,i,now=gameNow28()){const {p,e,engage}=servantTarget36(a,i,now);return engage&&!(p.phaseLeft381>0)&&Math.hypot(p.x-e.x,p.y-e.y)<=(window.eldoria38ServantGap?.()||50)+16;},snapshot(){return (state.necro30?.servants||[]).map((a,i)=>{const p=servantPosition36(a,i);return {x:p.x,y:p.y,dir:p.dir,moving:p.moving,ready:this.canHit(a,i),left:a.left};});}};

const drawOld=draw;draw=function(now){if(state.cls){pos=fit34(pos);if(dest)dest=fit34(dest);}return drawOld(now);};
const switchOld=switchActivity;switchActivity=function(...args){const k=mapKey34(),r=switchOld(...args);if(k!==mapKey34()){clearRoute34();pos=fit34(pos);if(dest)dest=fit34(dest);}return r;};
const css=document.createElement('style');css.textContent=`#loot31{inset:auto!important;top:var(--top34,72px)!important;left:50%!important;transform:translateX(-50%);width:min(580px,65vw);max-height:min(115px,19vh);overflow:hidden!important;display:flex;flex-direction:column;align-items:center;gap:4px;z-index:55;mask-image:linear-gradient(#000 0%,#000 83%,transparent 100%)}#loot31 .loot31-group{position:static!important;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px;min-width:0;max-width:100%;width:max-content;filter:none;font-size:10px}#loot31 .loot31-row{padding:2px 6px;max-width:100%;gap:4px;white-space:nowrap}#loot31 .loot31-row span{overflow:hidden;text-overflow:ellipsis}#loot31 .loot31-row img{width:20px;height:20px;flex:none}#loot31 .loot31-group small{font-size:10px;padding:2px 4px}#rare31{top:var(--top34,72px)!important;max-width:min(440px,72vw);padding:5px 12px}#rare31 img{width:35px;height:35px}#rare31 strong{font-size:15px} @media(max-width:650px){#loot31{width:90vw;max-height:94px}#loot31 .loot31-row{font-size:9px}#rare31{max-width:90vw}}`;document.head.append(css);
window.eldoria34={valid:valid34,fit:fit34,path:path34,walk:walk34,bounds:bounds34,polygon:polygon34,layoutLoot:layoutLoot34};
})();
