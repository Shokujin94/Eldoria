
/* 0.23 — independent perspective stage. World simulation remains in original coordinates. */
const stageArt23={"city":"assets/maps/city.webp","zone0":"assets/maps/zone0.webp","zone1":"assets/maps/zone1.webp","zone2":"assets/maps/zone2.webp","zone3":"assets/maps/zone3.webp","zone4":"assets/maps/zone4.webp","zone5":"assets/maps/zone5.webp","zone6":"assets/maps/zone6.webp","zone7":"assets/maps/zone7.webp","zone8":"assets/maps/zone8.webp","zone9":"assets/maps/zone9.webp","crypt0":"assets/maps/crypt0.webp","crypt1":"assets/maps/crypt1.webp","crypt2":"assets/maps/crypt2.webp","crypt3":"assets/maps/crypt3.webp","crypt4":"assets/maps/crypt4.webp","crypt5":"assets/maps/crypt5.webp","crypt6":"assets/maps/crypt6.webp","crypt7":"assets/maps/crypt7.webp","crypt8":"assets/maps/crypt8.webp","crypt9":"assets/maps/crypt9.webp"};
const stageThumb37={"city":"assets/maps/city-mini.webp","zone0":"assets/maps/zone0-mini.webp","zone1":"assets/maps/zone1-mini.webp","zone2":"assets/maps/zone2-mini.webp","zone3":"assets/maps/zone3-mini.webp","zone4":"assets/maps/zone4-mini.webp","zone5":"assets/maps/zone5-mini.webp","zone6":"assets/maps/zone6-mini.webp","zone7":"assets/maps/zone7-mini.webp","zone8":"assets/maps/zone8-mini.webp","zone9":"assets/maps/zone9-mini.webp","crypt0":"assets/maps/crypt0-mini.webp","crypt1":"assets/maps/crypt1-mini.webp","crypt2":"assets/maps/crypt2-mini.webp","crypt3":"assets/maps/crypt3-mini.webp","crypt4":"assets/maps/crypt4-mini.webp","crypt5":"assets/maps/crypt5-mini.webp","crypt6":"assets/maps/crypt6-mini.webp","crypt7":"assets/maps/crypt7-mini.webp","crypt8":"assets/maps/crypt8-mini.webp","crypt9":"assets/maps/crypt9-mini.webp"};
const stageImages23=Object.create(null),stagePreview37=Object.fromEntries(Object.entries(stageThumb37).map(([k,v])=>{const im=new Image();im.src=v;return [k,im]}));let stageLRU37=[];function stageImage37(k){if(!stageArt23[k])k='city';let im=stageImages23[k];if(!im){im=new Image();im.decoding='async';im.src=stageArt23[k];stageImages23[k]=im;}if(stageLRU37.at(-1)!==k){stageLRU37=stageLRU37.filter(x=>x!==k);stageLRU37.push(k);while(stageLRU37.length>3)delete stageImages23[stageLRU37.shift()];}return im.complete&&im.naturalWidth?im:stagePreview37[k];}stageImage37('city');
let stageRatio23=1, stageKey23='', stageClick23=null;
function stageMode23(){return state.mode==='city'?'city':['dungeon','boss','trial'].includes(state.mode)?'crypt'+state.zone:'zone'+state.zone;}
function projectCamera23(cw,ch){
 const fixed=['dungeon','boss','trial','city','gather'].includes(state.mode), W=worldW(),H=worldH();
 // A low camera angle: the ground occupies the lower 62% of the frame. The
 // camera and inverse mouse transform share this exact rectangle.
 const z=clamp(zoom||.55,.35,1.5), f=clamp(z/.55,1,1.8), width=fixed?W/f:Math.min(W,Math.max(450,cw/(2.75*z)));
 const height=fixed?H/.62/f:Math.max(480,ch/(cw/width*.58));
 const x=clamp(pos.x-width*.5,0,Math.max(0,W-width));
 const y=fixed?clamp(pos.y-height*.62,-H*.33/.62,-H*.33/.62+H/.62-height):clamp(pos.y-height*.64,-height*.33,Math.max(-height*.33,H-height*.94));
 cam={x,y,w:width,h:height};stageRatio23=(cw/width)/(ch/height);
}
function stageDraw23(now,cw,ch){
 const im=stageImage37(stageMode23());ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cw,ch);
 window.eldoria38Terrain(now,cw,ch,im);
 // soft directional light and ambient weather are rendered separately from the geometry.
 const d=state.era20||{},z=state.zone;
 if(d.day!==false&&['city','hunt'].includes(state.mode)){const a=(1-Math.cos(now/95000))*.045;ctx.fillStyle=`rgba(14,20,39,${a})`;ctx.fillRect(0,0,cw,ch);}
 if(d.climate!==false&&state.profile?.detail12!==false){ctx.save();const rain=state.mode==='city'||[0,1,3,6].includes(z),snow=z===4,ash=[2,7,8,9].includes(z);if(rain||snow||ash){ctx.globalAlpha=rain?.22:.36;ctx.strokeStyle=snow?'#d0e6ee':ash?'#ba8662':'#a9b6c7';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1;for(let i=0;i<75;i++){const x=(i*173+now*(rain?.10:.025))%cw,y=(i*113+now*(rain?.35:.055))%ch;if(rain){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+16);ctx.stroke();}else ctx.fillRect(x,y,2,2);}}ctx.restore();}
}
function actor23(fn,x,y,...args){ctx.save();ctx.translate(x,y+11);ctx.scale(1,stageRatio23);ctx.translate(-x,-y-11);fn(ctx,x,y,...args);ctx.restore();}
function health23(x,y,ratio,color){const cw=world.width, ch=world.height,sx=cw/cam.w,sy=ch/cam.h;ctx.save();ctx.setTransform(1,0,0,1,0,0);const xx=(x-cam.x)*sx,yy=(y+17-cam.y)*sy;ctx.fillStyle='#101013';ctx.fillRect(xx-22,yy,44,5);ctx.fillStyle=color;ctx.fillRect(xx-21,yy+1,42*clamp(ratio,0,1),3);ctx.restore();}
function renderActors23(now,fixed){
 const ehit=Date.now()-hitEnemy<130,hhit=Date.now()-hitHero<130, combat=['hunt','boss','trial','dungeon'].includes(state.mode), actors=[];
 if(state.mode==='city')for(const n of currentNPCs())actors.push({x:n.x,y:n.y,paint:()=>{actor23((c,x,y)=>drawNPC(c,{...n,x,y}),n.x,n.y);queueName15(npcName15,n);}});
 if(combat&&!window.eldoria31Interlude?.()){const p=enemyPoint(now),boss=state.mode==='boss'||state.mode==='dungeon'&&state.wave===4;
  if(false)for(const [i,[x,y]] of [[223,165],[620,470],[160,460],[585,145],[290,323]].entries()){
   const ax=(x*2+300)%1500+50+Math.sin(now/1400+i*2)*24,ay=(y*2+150)%1100+50+Math.cos(now/1700+i)*15;
   if(Math.hypot(ax-p.x,ay-p.y)>80)actors.push({x:ax,y:ay,paint:()=>actor23((c,x,y)=>creature(c,ZONES[state.zone].enemy[i%5],x,y,.9),ax,ay)});
  }
  actors.push({x:p.x,y:p.y,paint:()=>{if(boss)actor23((c,x,y)=>drawBoss(c,x,y,state.zone,ehit),p.x,p.y);else actor23((c,x,y)=>creature(c,state.enemy,x,y,state.mode==='trial'?1.7:1.2,ehit),p.x,p.y);queueName15(enemyName13,p.x,p.y);health23(p.x,p.y,state.enemyHp/enemy().hp,'#ac4b47');}});
 }
 if(state.mode==='gather'){for(let i=0;i<18;i++){const {x,y}=gatherPoint34(i);actors.push({x,y,paint:()=>{ctx.save();ctx.fillStyle='#15171a';ctx.beginPath();ctx.ellipse(x,y+6,14,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=PROF10[state.profession]?.col||'#a5b18b';ctx.fillRect(x-5,y-11*stageRatio23,10,11*stageRatio23);ctx.restore();}});}}
 actors.push({x:pos.x,y:pos.y,paint:()=>{actor23(hero,pos.x,pos.y,['dungeon','boss','trial'].includes(state.mode)?1.55:1,hhit);queueName15(heroName13,pos.x,pos.y);if(combat)health23(pos.x,pos.y,state.hp/stats().h,'#83ac75');}});
 actors.sort((a,b)=>a.y-b.y).forEach(a=>{if(a.x>=cam.x-150&&a.x<=cam.x+cam.w+150&&a.y>=cam.y-100&&a.y<=cam.y+cam.h+100)a.paint()});
}
// Keep nameplates in screen-pixel typography, but align them to the new height.
const oldNPC23=npcName15,oldHeroName23=heroName13,oldEnemyName23=enemyName13;
npcName15=function(c,n){oldNPC23(c,{...n,y:n.y-(stageRatio23-1)*61});};
heroName13=function(c,x,y){const p=['hunt','dungeon','boss','trial'].includes(state.mode)?enemyPoint(gameNow28()):null,near=p&&Math.hypot(p.x-x,p.y-y)<80;oldHeroName23(c,x+(near?(p.x<x?1:-1)*29:0),y-(stageRatio23-1)*56-(near?15:0));};
enemyName13=function(c,x,y){const near=Math.hypot(pos.x-x,pos.y-y)<80;oldEnemyName23(c,x+(near?(pos.x<x?1:-1)*24:0),y-(stageRatio23-1)*(state.mode==='boss'||state.mode==='dungeon'&&state.wave===4?105:56));};
const oldTarget23=targetBody18;targetBody18=function(side,now){const q=oldTarget23(side,now),p=side==='hero'?enemyPoint(now):pos;return {...q,y:p.y+11+(q.y-p.y-11)*stageRatio23,ry:q.ry*stageRatio23};};
// City service NPCs face the plaza, with a clear walking lane in front.
const spots23=[[155,165],[275,165],[395,165],[515,165],[635,165],[120,380]];
CITYNPC.forEach((n,i)=>{const p=spots23[i];if(p){n.x=p[0];n.y=p[1];}});
// Pointer input uses inverse projection, including the same scale as rendered NPCs.
world.addEventListener('pointerdown',e=>{if(!state.cls||state.active||e.button!==0)return;const r=world.getBoundingClientRect(),x=cam.x+(e.clientX-r.left)/r.width*cam.w,y=cam.y+(e.clientY-r.top)/r.height*cam.h;const n=currentNPCs().find(n=>Math.abs(x-n.x)<25&&y>n.y-65*stageRatio23&&y<n.y+30);if(n){if(Math.hypot(pos.x-n.x,pos.y-n.y)<42){dest=null;stageClick23=null;interact();}else{stageClick23=n;dest=fit34({x:n.x,y:n.y+29});}}else{stageClick23=null;dest=fit34({x,y});}clearRoute34();},true);
const oldSwitch23=switchActivity;switchActivity=function(...a){stageClick23=null;return oldSwitch23(...a);};
const oldDraw23=draw;draw=function(now){if(stageClick23&&!state.active&&state.mode==='city'&&Math.hypot(pos.x-stageClick23.x,pos.y-stageClick23.y)<37){stageClick23=null;dest=null;interact();}oldDraw23(now);};
// Stage preview artwork is also used by the region atlas. The old logical map is retained for the minimap.
mapThumb=function(){return stageThumb37[stageMode23()]||stageThumb37.city;};previews=null;
// Keep existing controls and window handlers. This is a visual reskin, not a static screenshot.
const style23=document.createElement('style');style23.textContent=`
:root{--gold:#c9a775;--line:#5c4a37;--muted:#b4a795;--text:#e5d6bd}
body.play14 .quicknav{top:0;left:50%;transform:translateX(-50%);border-radius:0 0 6px 6px!important;background:linear-gradient(#252024,#100f12)!important;box-shadow:0 2px 12px #000c,inset 0 0 0 1px #87704e66!important;padding:4px 7px!important;gap:3px!important;max-width:calc(100vw - 330px)!important;min-height:42px}
body.play14 .quicknav button{padding:5px 8px!important;min-width:42px!important;min-height:35px!important;color:#d9bf94!important;background:transparent!important;border:1px solid #6e553b44!important;border-radius:3px!important}
body.play14 .quicknav .navicon svg{width:19px;height:19px}.quicknav .navtext{font:11px Georgia,serif!important}.quicknav button:hover{background:#4e2b24!important}
body.play14 #world{filter:none!important;image-rendering:auto!important;background:#1b1b1e!important}
.floating{border:1px solid #a08256!important;border-radius:5px!important;box-shadow:0 0 0 1px #0a090a,0 0 0 3px #44362b,0 15px 40px #000b,inset 0 0 0 2px #483c3033!important;background:linear-gradient(145deg,rgba(27,24,25,var(--window-alpha12,.97)),rgba(13,13,16,var(--window-alpha12,.97)))!important;backdrop-filter:blur(5px)}
.window-head{background:linear-gradient(90deg,#3b2826,#211e20)!important;border-bottom:1px solid #826342!important;padding:8px 12px!important}.window-head h2{font:700 16px Georgia,serif!important;color:#d9bf91!important}.window-head:before{content:'◆';color:#b89561;font-size:10px;margin-right:5px}
.window-body .service-card,.window-body .stock19-slot,.window-body .gear-cell,.window-body .node09{background:linear-gradient(135deg,#282324,#121216)!important;border-color:#6a5137!important}.window-body .stock19-slot img{filter:drop-shadow(0 2px 3px #000)}.window-body h3,.window-body h4{font-family:Georgia,serif;color:#d0ad7c}.window-body button:not(.primary){color:#e0c7a0}
#combatHUD22{--orb:88px;bottom:11px}.c22-core{background:linear-gradient(#302420,#141316)!important;border:1px solid #9c7b4d!important;box-shadow:0 0 0 2px #0e0d10,0 0 0 3px #685039!important}.c22-orb{background:conic-gradient(from 30deg,#211c1d,#a18a64,#443329,#c6a57a,#211c1d)!important;box-shadow:0 0 0 2px #100e10,0 0 0 3px #7b6348,inset 0 0 0 1px #d0af7b!important}.c22-orb:before{content:'';position:absolute;inset:-5px;border:1px solid #8e704c;border-radius:44% 52% 43% 52%;pointer-events:none;transform:rotate(19deg)}.c22-slot{border-color:#927248!important;background:linear-gradient(#302825,#100f13)!important}.c22-top button{font-size:12px!important}
.hud14-location,.hud14-resource,.auto14,.log14,.maptools,.scene #target11{background:linear-gradient(145deg,#242024ef,#101014f5)!important;border-color:#947348!important;box-shadow:0 0 0 1px #171319,0 2px 12px #0009!important}.era-minimap{border-radius:50%!important;border:3px double #bd9b68!important;background:#1b1719!important}
@media(max-width:900px){body.play14 .quicknav{max-width:calc(100vw - 16px)!important;top:46px!important}.quicknav .navtext{font-size:9px!important}body.play14 .quicknav button{padding:3px!important;min-width:30px!important}}
`;document.head.append(style23);
// New windows open in the side columns by default; all remain draggable and closable.
const oldOpen23=openWindow;openWindow=function(id){const existing=windows[id]&&!windows[id].classList.contains('hidden');oldOpen23(id);if(existing||!windows[id]||windowPrefs[id]||innerWidth<1000)return;const w=windows[id];if(['hero','equip'].includes(id)){w.style.width=Math.min(350,innerWidth*.29)+'px';w.style.height=Math.min(650,innerHeight-132)+'px';w.style.left='12px';w.style.top='62px';}else if(id==='bag'){w.style.width=Math.min(380,innerWidth*.32)+'px';w.style.height=Math.min(625,innerHeight-132)+'px';w.style.left=(innerWidth-w.offsetWidth-12)+'px';w.style.top='62px';}fitWindow(w);};
window.eldoriaStage23={version:'0.23',projection:()=>({...cam}),scene:stageMode23};
const stageSafe251=stageDraw23, namesSafe251=paintNames15;
lastMode='';

