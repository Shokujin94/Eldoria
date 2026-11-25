/* Presentation only. Server snapshots are the only source of progress. */
(()=>{'use strict';
const art=window.eldoria52Art,canvas=()=>document.getElementById('scene52'),motion=matchMedia('(prefers-reduced-motion: reduce)'),cache=new Map();
const citySpawn={x:400/800,y:300/600};
let cityPos={...citySpawn},cityDest=null,cityNear=null,cityClickNPC=null,cityRoute=[],cityKeys=new Set(),lastCityFrame=0,projection=null,huntCamera=null;
const cityNPC=[
 {x:150,y:192,name:'Bram',role:'Ferreiro',mode:'forge'},
 {x:270,y:192,name:'Mira',role:'Mercadora',mode:'merchant'},
 {x:400,y:166,name:'Cartógrafo',role:'Viagens e regiões',mode:'zones'},
 {x:540,y:190,name:'Mestre de Provas',role:'Ascensão',mode:'sub'},
 {x:638,y:195,name:'Mestre de Ofícios',role:'Profissões',mode:'prof'},
 {x:302,y:408,name:'Orven',role:'Depósito',mode:'vault'},
 {x:495,y:420,name:'Instrutor',role:'Treinamento',mode:'train'}
].map(n=>({...n,x:n.x/800,y:n.y/600}));
const baseZoom=.55;
let zoom61=baseZoom,state=null,previous=null,minionVisual=[],visual={hero:.32,enemy:.68,servant:.46},fx=[],heroAction=null,enemyAction=null,heroStride=0,enemyStride=0,heroHitAt=-Infinity,flash=0,defeated=null,levelEffect=null,seen='',audio=null,sound=false,lastFrame=0,raf=0;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
// The 0.45.0 gather points use the legacy 800 × 600 stage and its walkable floor.
const gatherBounds=[[.09,.91],[.06,.94],[.11,.89],[.10,.90],[.11,.89],[.075,.925],[.07,.93],[.12,.88],[.075,.925],[.10,.90]];
const gatherFloors=[.59,.59,.59,.59,.59,.58,.59,.62,.58,.60];
const gatherHash=(x,y)=>((Math.imul(x+21,374761393)^Math.imul(y+19,668265263))>>>0)%997;
const gatherFields=gatherBounds.map(([left,right],zone)=>{
 const top=Math.round((gatherFloors[zone]-.33)*600/.62-11);
 return Array.from({length:18},(_,index)=>{
  let x=50+gatherHash(index,31)%700,y=70+gatherHash(index,57)%460;
  if(x<left*800||x>=right*800||y<top||y>=512){
   x=clamp(6+12*Math.round((x-6)/12),6+12*Math.ceil((left*800-6)/12),6+12*(Math.ceil((right*800-6)/12)-1));
   y=clamp(6+12*Math.round((y-6)/12),6+12*Math.ceil((top-6)/12),510);
  }
  return {x:x/800,y:y/600,index};
 }).sort((a,b)=>a.y-b.y);
});
let gatherHero=null,lastGatherFrame=0;
// Vespera's walkable polygon in the original 800 × 600 stage.
const cityFloor=[[82,182],[158,182],[232,174],[352,170],[392,141],[453,119],[604,119],[656,157],[729,181],[749,210],[749,285],[681,285],[651,352],[599,420],[565,511],[267,511],[250,436],[210,372],[159,319],[93,300],[82,258]];
// Footprints of the foreground parapet, stalls and brazier in the city artwork.
const cityObstacles=[
 [[82,244],[126,244],[162,289],[150,316],[92,301]],
 [[156,314],[214,345],[241,392],[231,417],[203,376]],
 [[667,238],[692,232],[711,252],[705,278],[680,282],[664,265]],
 [[702,182],[749,181],[754,237],[733,245],[713,221]]
];
const cityActorHeight=(w,h)=>Math.min(h*.29,w*.145,126);
function insideCityPolygon(px,py,polygon){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [a,b]=polygon[i],[c,d]=polygon[j];
  if((b>py)!==(d>py)&&px<(c-a)*(py-b)/(d-b)+a)inside=!inside;
 }
 return inside;
}
function cityWalkable(x,y){
 const px=x*800,py=y*600;
 if(cityNPC.some(n=>Math.hypot(px-n.x*800,py-n.y*600)<22))return false;
 // Check the width of the feet and a small depth margin at every boundary.
 return [[-6,0],[6,0],[0,-4],[0,4]].every(([dx,dy])=>
  insideCityPolygon(px+dx,py+dy,cityFloor)&&
  !cityObstacles.some(polygon=>insideCityPolygon(px+dx,py+dy,polygon))
 );
}
function openSegment(a,b){
 const n=Math.max(1,Math.ceil(Math.hypot((b.x-a.x)*800,(b.y-a.y)*600)/5));
 for(let i=1;i<=n;i++){
  if(!cityWalkable(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;
 }
 return true;
}
const cityGrid=new Map();
for(let y=6;y<600;y+=12)for(let x=6;x<800;x+=12){
 if(cityWalkable(x/800,y/600))cityGrid.set(x+','+y,{x:x/800,y:y/600,gx:x,gy:y});
}
function nearestCityNode(p,connect=false){
 let best=null,distance=Infinity;
 for(const node of cityGrid.values()){
  const d=((p.x-node.x)*800)**2+((p.y-node.y)*600)**2;
  if(d<distance&&(!connect||openSegment(p,node))){best=node;distance=d;}
 }
 return best;
}
function routeCity(from,to){
 if(openSegment(from,to))return [to];
 const first=nearestCityNode(from,true),last=nearestCityNode(to,true);
 if(!first||!last)return [];
 const queue=[first],parents=new Map([[first,null]]);
 for(let i=0;i<queue.length&&!parents.has(last);i++){
  const node=queue[i];
  for(const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12],[12,12],[12,-12],[-12,12],[-12,-12]]){
   const next=cityGrid.get((node.gx+dx)+','+(node.gy+dy));
   if(!next||parents.has(next)||!openSegment(node,next))continue;
   parents.set(next,node);queue.push(next);
  }
 }
 if(!parents.has(last))return [];
 const path=[to];
 for(let node=last;node;node=parents.get(node))path.push(node);
 return path.reverse();
}
const colors=['#c4c8ce','#92c88e','#86b7ee','#caa0ef','#ebc778'];
const image=src=>{if(!src)return null;if(!cache.has(src)){const im=new Image();im.decoding='async';im.src=src;cache.set(src,im);}return cache.get(src);};
function draw(c,src,x,y,h,flip=false,bright=false,lean=0,stretch=1){const im=image(src);if(!im?.complete||!im.naturalWidth)return;c.save();c.translate(x,y);c.scale(flip?-1:1,projection?projection.scale/projection.scaleY*stretch:stretch);if(lean)c.rotate(lean);if(bright)c.filter='brightness(1.5)';c.imageSmoothingEnabled=false;const w=h*im.naturalWidth/im.naturalHeight;c.drawImage(im,-w/2,-h,w,h);c.restore();}
function tone(kind,delay=0){if(!sound||!audio||audio.state!=='running')return;const at=audio.currentTime+delay,osc=audio.createOscillator(),g=audio.createGain(),f={mining:[720,130,'triangle'],wood:[140,44,'triangle'],herb:[340,180,'sine'],hit:[120,48,'triangle'],buff:[440,660,'sine'],level1:[392,440,'triangle'],level2:[523,587,'triangle'],level3:[784,880,'sine']}[kind]||[120,48,'triangle'];osc.type=f[2];osc.frequency.setValueAtTime(f[0],at);osc.frequency.exponentialRampToValueAtTime(f[1],at+.13);g.gain.setValueAtTime(.055,at);g.gain.exponentialRampToValueAtTime(.001,at+.16);osc.connect(g);g.connect(audio.destination);osc.start();osc.stop(at+.17);}
function popup(text,color,now,x=.68,y=.44,actor=false){if(motion.matches)return;fx.push({text,color,at:now,x,y,actor});if(fx.length>12)fx.shift();}
const impactColors={physical:'#d6d0c4',bleed:'#cf5969',fire:'#ff9b51',ice:'#91d8f4',arcane:'#bb9bea',
 holy:'#e9cc82',poison:'#87bd63',shock:'#aaa4ff',dark:'#b17ba6',heal:'#8ccfa3'};
function combatProjectile(event,cls,incoming){
 const p=event.positions,heroY=p.heroY??.84,enemyY=p.enemyY??.84;
 const element=incoming?event.enemyShot.element:event.element;
 const kind=incoming?(event.enemyShot.kind||'dark'):cls==='ranger'?'arrow':element==='ice'?'ice':'magic';
 const x=incoming?p.enemy:p.hero,y=incoming?enemyY:heroY;
 const toX=incoming?p.hero:p.enemy,toY=incoming?heroY:enemyY;
 // Legacy projectile velocities are expressed in pixels on its 800 × 600 stage.
 const distance=Math.hypot((toX-x)*800,(toY-y)*600);
 const nominal=kind==='arrow'?650:kind==='ice'?780:930;
 const speed=clamp(distance/nominal,.105,.39);
 const flight=Math.max(0,distance-(kind==='arrow'?15:19))/speed;
 const color=kind==='arrow'&&element!=='poison'?'#d6d8d1':impactColors[kind]??impactColors[element]??'#bb9bea';
 return {x,y,toX,toY,flight,color,kind,incoming,encounter:event.encounter};
}
function showCombat(event,cls,now,currentEncounter){
 if(motion.matches)return;
 const {positions:p,dealt,received,critical,heroHit,heroLanded,heroImpact,heroShot,element,skill,support,enemyShot,enemyImpact,enemyMelee}=event;
 if(heroShot||support||(heroHit&&!heroLanded)){
  const kind=support?'cast':cls==='war'?'melee':cls==='ranger'?'ranged':'cast';
  heroAction={at:now,kind,side:Math.sign(p.enemy-p.hero)||1,vertical:(p.enemyY??.84)-(p.heroY??.84)};
 }
 if(support){
  popup(support.skill,impactColors[support.element]??'#8ccfa3',now,p.hero,p.heroY??.84,true);
  fx.push({at:now,impact:{x:p.hero,y:p.heroY??.84,color:impactColors[support.element]??'#8ccfa3',element:support.element,support:true}});
  tone('buff');
 }
 if(heroShot){
  const shot=combatProjectile({...event,element:heroShot.element},cls,false);
  if(shot.flight)fx.push({at:now,projectile:shot});
 }
 if(dealt){
  const color=impactColors[element]??(critical?'#f4cf79':'#fff1cf');
  const shot=heroHit&&!heroLanded&&cls!=='war'?combatProjectile(event,cls,false):null,impactTime=now+(shot?.flight||0);
  const x=heroImpact?.x??p.enemy,y=heroImpact?.y??p.enemyY??.84;
  if(shot?.flight)fx.push({at:now,projectile:shot});
  if(heroHit){
   if(event.encounter===currentEncounter)flash=impactTime;
   fx.push({at:impactTime,impact:{x,y,color,element,skill,melee:cls==='war',side:Math.sign(p.enemy-p.hero)||1}});

  }
  popup((critical?'CRÍTICO ':'')+Math.ceil(dealt),color,impactTime,x,y,true);
 }
 if(event.encounter===currentEncounter&&(enemyMelee||enemyShot)){
  const dx=p.hero-p.enemy,dy=(p.heroY??.84)-(p.enemyY??.84);
  enemyAction={at:now,dx,dy,ranged:!!enemyShot};
 }
 if(enemyShot){
  const shot=combatProjectile(event,cls,true);
  if(shot.flight)fx.push({at:now,projectile:shot});
  if(enemyShot.damage)popup('-'+Math.ceil(enemyShot.damage),'#f38585',now+shot.flight,p.hero,shot.toY,true);
 }
 if(enemyImpact)popup('-'+Math.ceil(enemyImpact.damage),'#f38585',now,enemyImpact.x,enemyImpact.y,true);
 if(enemyMelee)popup('-'+Math.ceil(enemyMelee.damage),'#f38585',now,p.hero,p.heroY??.84,true);
 if(event.encounter===currentEncounter&&(enemyImpact?.damage||enemyMelee?.damage))heroHitAt=now;
 const otherDamage=Math.max(0,received-(enemyImpact?.damage??enemyShot?.damage??0)-(enemyMelee?.damage??0));
 if(otherDamage)popup('-'+Math.ceil(otherDamage),'#f38585',now,p.hero,p.heroY??.84,true);
}
function syncPendingProjectiles(a,old,cls,now){
 if(motion.matches||!a?.enemy)return;
 for(const incoming of [false,true]){
  const key=incoming?'pendingEnemyShot':'pendingHeroShot';
  const pending=a[key],p=pending?.projectile;
  if(!p)continue;
  const prev=old?.encounter===a.encounter?old[key]?.projectile:null;
  if(prev?.x===p.x&&prev?.y===p.y)continue;
  const sameShot=f=>f.projectile?.encounter===a.encounter&&f.projectile.incoming===incoming;
  // showCombat already started the visual if this snapshot contains a new launch.
  if(!prev&&fx.some(sameShot))continue;
  const element=pending.element??pending.cast?.element??({mage:'arcane',cleric:'holy',necro:'dark'}[cls]||'physical');
  const shot=combatProjectile({positions:a.positions,encounter:a.encounter,element,enemyShot:{element,kind:p.kind}},cls,incoming);
  shot.x=p.x/800;
  shot.y=(p.y+8)/600;
  const distance=Math.hypot((shot.toX-shot.x)*800,(shot.toY-shot.y)*600);
  shot.flight=Math.max(0,distance-(shot.kind==='arrow'?15:19))/p.speed;
  fx=fx.filter(f=>!sameShot(f));
  if(shot.flight)fx.push({at:now,projectile:shot});
 }
}
const elementalShapes={fire:'flame',ice:'crystal',arcane:'sigil',holy:'rays',poison:'cloud',shock:'bolt',dark:'vortex',heal:'rays'};
const combatConditions={
 bleed:['#d65b65','drop'],stun:['#dfb655','rays'],slow:['#9bb4d0','clock'],
 expose:['#c391e8','sigil'],poison:['#75b86b','cloud'],burn:['#ee9150','flame'],
 freeze:['#75c9ef','crystal'],shock:['#b1a1ef','bolt']
};
function combatGlyph(c,shape,r,t){
 const count=shape==='bolt'?4:6;
 if(shape==='sigil'||shape==='clock'){
  c.beginPath();
  if(shape==='clock')c.arc(0,0,r*.65,0,2*Math.PI);
  else for(let j=0;j<=count;j++){
   const angle=j*2*Math.PI/count-Math.PI/2;
   c[j?'lineTo':'moveTo'](Math.cos(angle)*r,Math.sin(angle)*r);
  }
  c.stroke();
  c.beginPath();
  c.moveTo(0,-r*.42);c.lineTo(0,0);c.lineTo(r*.3,0);
  c.stroke();
  return;
 }
 if(shape==='drop'){
  c.beginPath();c.moveTo(0,-r);
  c.bezierCurveTo(r*.9,r*.2,r*.58,r*.77,0,r*.77);
  c.bezierCurveTo(-r*.58,r*.77,-r*.9,r*.2,0,-r);c.stroke();
  return;
 }
 for(let i=0;i<count;i++){
  c.save();c.rotate(i*2*Math.PI/count+t);
  c.beginPath();
  switch(shape){
   case 'flame':
    c.moveTo(-r*.14,-r*.4);c.quadraticCurveTo(-r*.37,-r*.65,0,-r);
    c.quadraticCurveTo(r*.35,-r*.64,r*.13,-r*.41);break;
   case 'crystal':
    c.moveTo(0,-r*.2);c.lineTo(0,-r);
    c.moveTo(-r*.18,-r*.76);c.lineTo(0,-r*.57);c.lineTo(r*.18,-r*.76);break;
   case 'cloud':
    c.arc(0,-r*.56,r*.24,0,Math.PI*2);break;
   case 'bolt':
    c.moveTo(0,-r*.17);c.lineTo(r*.24,-r*.41);c.lineTo(-r*.08,-r*.56);
    c.lineTo(r*.17,-r*.74);c.lineTo(0,-r);break;
   case 'vortex':
    c.moveTo(0,-r*.2);c.quadraticCurveTo(r*.85,-r*.3,r*.33,-r*.94);break;
   default:
    c.moveTo(0,-r*.38);c.lineTo(0,-r);
  }
  c.stroke();c.restore();
 }
}
const titleColors=['#b9bec6','#88c88f','#7aaff0','#c29ae5','#efc36e'];
function drawCombatLabel(c,x,y,text,color,font){
 if(!text)return;
 c.save();
 c.translate(x,y);c.scale(1/projection.scale,1/projection.scaleY);
 c.font=font;c.textAlign='center';c.lineJoin='round';
 c.lineWidth=3;c.strokeStyle='#0b0c10';c.strokeText(text,0,0);
 c.fillStyle=color;c.fillText(text,0,0);
 c.restore();
}
function drawCombatHealth(c,x,y,ratio,color){
 if(!Number.isFinite(ratio))return;
 c.save();
 c.translate(x,y);c.scale(1/projection.scale,1/projection.scaleY);
 c.fillStyle='#101013';c.fillRect(-22,5,44,5);
 c.fillStyle=color;c.fillRect(-21,6,42*clamp(ratio,0,1),3);
 c.restore();
}
function drawConditions(c,effects,x,y,height){
 const active=Object.entries(effects||{}).filter(([key,status])=>status.left>0&&combatConditions[key]);
 const size=Math.max(6,Math.min(13,height*.12));
 for(const [i,[key]] of active.entries()){
  const [color,shape]=combatConditions[key];
  c.save();
  c.translate(x+(i-(active.length-1)/2)*size*2.5,y-height-size*.4);
  c.fillStyle='#11141de8';c.beginPath();c.arc(0,0,size*1.12,0,2*Math.PI);c.fill();
  c.strokeStyle=color;c.lineWidth=1.25;
  combatGlyph(c,shape,size*.8,0);
  c.restore();
 }
}
function drawImpact(c,hit,w,h,hh,t){
 if(t>.55)return;
 const progress=t/.55,x=hit.x*w,y=hit.y*h-hh*.43;
 c.globalAlpha*=1-progress;
 c.strokeStyle=c.fillStyle=hit.color;
 c.lineWidth=hit.skill?3:2;
 c.beginPath();
 if(hit.support){
  const radius=hh*(.14+progress*.42);
  c.ellipse(x,hit.y*h-hh*.08,radius,radius*.28,0,0,Math.PI*2);
  c.stroke();
  for(let i=0;i<6;i++){
   const angle=i*Math.PI/3+progress;
   const px=x+Math.cos(angle)*radius,py=hit.y*h-hh*(.13+progress*.62)+Math.sin(angle)*radius*.25;
   c.fillRect(px,py,2,5);
  }
  return;
 }
 if(hit.melee){
  const angle=hit.side>0?0:Math.PI;
  c.arc(x,y,15+progress*8,angle-2.4,angle+.9);
 }else c.ellipse(x,y,8+progress*24,5+progress*15,0,0,Math.PI*2);
 c.stroke();
 if(!hit.skill&&!hit.elemental)return;
 const shape=elementalShapes[hit.element];
 if(shape){
  c.save();c.translate(x,y);
  combatGlyph(c,shape,Math.max(12,hh*.19)*(1+progress),progress*.65);
  c.restore();
 }
 if(!hit.skill)return;
 c.font='bold 11px monospace';
 c.textAlign='center';
 c.fillText(hit.skill,x,y-47);
}
function drawProjectile(c,shot,w,h,hh,t){
 if(t<0||t*1000>shot.flight)return;
 const progress=t*1000/shot.flight;
 // Blend toward the displayed target in flight and land at the server's impact position.
 const follows=shot.encounter===state.activity?.encounter;
 const side=shot.incoming?'hero':'enemy';
 const tracking=follows?1-progress:0;
 const targetX=shot.toX+((visual[side]??shot.toX)-shot.toX)*tracking;
 const targetY=shot.toY+((visual[side+'Y']??shot.toY)-shot.toY)*tracking;
 const dx=w*(targetX-shot.x),dy=h*(targetY-shot.y);
 c.translate(w*shot.x+dx*progress,h*shot.y+dy*progress-hh*.43-Math.sin(progress*Math.PI)*12);
 c.rotate(Math.atan2(dy,dx));
 c.fillStyle=shot.color;
 if(shot.kind==='arrow'){
  c.fillRect(-30,-1,26,2);
  c.beginPath();
  c.moveTo(0,0);
  c.lineTo(-8,-4);
  c.lineTo(-8,4);
  c.fill();
 }else{
  c.fillRect(-16,-1,13,2);
  c.beginPath();
  c.ellipse(0,0,shot.kind==='ice'?8:6,4,0,0,Math.PI*2);
  c.fill();
 }
}
function breakPixels(kind,z,index,now){
 if(motion.matches)return;
 const sample=document.createElement('canvas');
 sample.width=64;sample.height=96;
 const ctx=sample.getContext('2d',{willReadFrequently:true});
 art.drawGatherNode(ctx,32,84,kind,z,index,1);
 const pixels=ctx.getImageData(0,0,64,84).data,parts=[];
 for(let y=0;y<84;y+=4)for(let x=0;x<64;x+=4){
  const i=(y*64+x)*4;
  if(pixels[i+3]>140)parts.push({
   x:x-32,y:y-84,color:'rgb('+pixels[i]+','+pixels[i+1]+','+pixels[i+2]+')',
   vx:(Math.random()-.5)*135,vy:-25-Math.random()*65
  });
 }
 fx=fx.filter(f=>!f.parts);
 fx.push({parts,index,at:now});
}
function apply(s){if(!s){cityKeys.clear();cityNear=null;cityDest=null;cityRoute=[];cityClickNPC=null;projection=null;huntCamera=null;gatherHero=null;lastGatherFrame=0;seen='';cityPos={...citySpawn};zoom61=baseZoom;state=previous=null;fx=[];heroAction=null;enemyAction=null;heroStride=enemyStride=0;heroHitAt=-Infinity;defeated=null;levelEffect=null;minionVisual=[];if(raf)cancelAnimationFrame(raf);raf=0;return;}const now=performance.now(),a=s.activity,old=previous?.activity,oldRare=previous?.rareEvent,key=a?a.mode+':'+a.z+':'+(a.prof||''):'city';if(key!==seen||a?.encounter!==old?.encounter){const areaChanged=key!==seen;seen=key;fx=[];heroAction=null;enemyAction=null;heroStride=enemyStride=0;heroHitAt=-Infinity;visual={hero:a?.positions?.hero??.32,enemy:a?.positions?.enemy??.68,servant:a?.positions?.servant??.46,heroY:a?.positions?.heroY??.84,enemyY:a?.positions?.enemyY??.84};if(areaChanged){levelEffect=null;gatherHero=null;lastGatherFrame=0;previous=null;cityDest=null;cityRoute=[];cityClickNPC=null;minionVisual=[];cityKeys.clear();if(!a)cityPos={...citySpawn};}}if(defeated?.next!==a?.encounter)defeated=null;
if(previous){const event=s.lastCombat;
 const offline=(s.analyzer||s.history?.[0])?.offlineSeconds||0;
 const priorOffline=(previous.analyzer||previous.history?.[0])?.offlineSeconds||0;
 if(s.level>previous.level&&!s.catchupSeconds&&!previous.catchupSeconds&&offline<=priorOffline&&!document.hidden){
  levelEffect={at:now,level:s.level};
  tone('level1');tone('level2',.12);tone('level3',.25);
 }
 const mechanic=a?.mechanicEvent;
 if(mechanic&&(a.encounter!==old?.encounter||mechanic.seq!==old?.mechanicEvent?.seq)){
  const retreat=mechanic.kind==='retreat',side=retreat?'hero':'enemy',p=a.positions;
  const label=mechanic.kind==='warning'?mechanic.name+' iminente':mechanic.name;
  popup(label,retreat?'#8ccfa3':impactColors[mechanic.element]??'#f4cf79',now,p[side],p[side+'Y']??.84,true);
  if(!motion.matches&&mechanic.kind==='impact'){
   heroHitAt=now;
   const element=mechanic.element??'physical';
   fx.push({at:now,impact:{x:p.hero,y:p.heroY??.84,color:impactColors[element],element,elemental:true,side:Math.sign(p.hero-p.enemy)||1,melee:element==='physical'}});
  }
 }
 if(a?.lastCombo&&(!old||a.encounter!==old.encounter||a.comboSeq!==old.comboSeq)){
  const p=a.positions,color=impactColors[a.lastComboElement]??'#f4cf79';
  popup(a.lastCombo,color,now,p.enemy,p.enemyY??.84,true);
 }
 if(defeated&&event?.encounter===defeated.next&&event.seq!==previous.lastCombat?.seq)defeated=null;
 const fallen=s.lastDefeat;
 if(!motion.matches&&a?.enemy&&fallen&&s.kills===previous.kills+1&&fallen.encounter===old?.encounter
    &&fallen.encounter!==a.encounter&&fallen.mode===a.mode&&fallen.zone===a.z&&event?.encounter!==a.encounter){
  const delay=fallen.finalHit?.heroHit&&!fallen.finalHit.heroLanded&&s.cls!=='war'?combatProjectile(fallen.finalHit,s.cls,false).flight:0;
  defeated={next:a.encounter,at:now+delay,boss:fallen.boss,index:fallen.index,positions:fallen.positions};
 }
 if(a?.enemy&&event&&event.seq!==previous.lastCombat?.seq&&event.mode===a.mode&&event.zone===a.z)showCombat(event,s.cls,now,a.encounter);
const g=s.lastGather,pg=previous.lastGather;if(a?.mode==='gather'&&g&&g.kind===a.prof&&g.zone===a.z&&g.total!==(pg?.total??previous.prof[a.prof].total)){const count=g.amount??Math.max(1,s.prof[a.prof].total-previous.prof[a.prof].total);popup('+'+count+' '+({mining:'Minério',wood:'Madeira',herb:'Erva'}[g.kind]),colors[g.rarity]||colors[0],now);breakPixels(g.kind,g.zone,g.node??previous.prof[g.kind].total%18,now);tone(g.kind);}if(s.lastLoot?.seq&&s.lastLoot.seq!==previous.lastLoot?.seq)popup(s.lastLoot.name,colors[s.lastLoot.rarity]||colors[0],now,.65,.25);if(s.lastRelic?.seq&&s.lastRelic.seq!==previous.lastRelic?.seq)popup(s.lastRelic.name,'#f0ca79',now,.62,.22);if(s.lastRune?.seq&&s.lastRune.seq!==previous.lastRune?.seq)popup('Runa encontrada!', '#caa0ef',now,.68,.26);if(s.kills>previous.kills)popup('+'+(s.kills-previous.kills)+' abate(s)','#e8c98c',now,.68,.32);}
if(s.rareEventName&&(s.rareEvent?.k!==oldRare?.k||s.rareEvent?.z!==oldRare?.z)){
 popup(s.rareEventName+' · Crônicas','#e9cc82',now,.5,.26);
}
syncPendingProjectiles(a,old,s.cls,now);
previous=s;state=s;if(!raf)raf=requestAnimationFrame(frame);}
function drawLevelEffect(c,x,y,height,now){
 if(!levelEffect)return;
 const t=(now-levelEffect.at)/1450;
 if(t>=1){levelEffect=null;return;}
 const fade=Math.min(1,(1-t)*2.4);
 c.save();c.translate(x,y);c.globalAlpha=fade;
 if(!motion.matches){
  const aura=c.createRadialGradient(0,-height*.45,0,0,-height*.45,height*.75);
  aura.addColorStop(0,'#ffe08f50');aura.addColorStop(1,'#ffbb3e00');
  c.fillStyle=aura;c.fillRect(-height,-height*1.25,height*2,height*1.6);
  c.strokeStyle='#f8d786';c.lineWidth=2;c.beginPath();
  const radius=18+t*24;
  c.ellipse(0,-1,radius,radius*.28,0,0,Math.PI*2);c.stroke();
  c.fillStyle='#ffe8a0';
  for(let i=0;i<22;i++){
   const angle=i*2.399+t*1.1,u=(t+i*.037)%1;
   c.globalAlpha=fade*Math.sin(Math.PI*u);
   c.fillRect(Math.cos(angle)*(13+22*u),-height*(.12+1.03*u),2+i%3,2+i%3);
  }
 }
 c.globalAlpha=fade;c.textAlign='center';c.font='bold 15px system-ui';c.lineWidth=3;
 c.strokeStyle='#15100a';c.fillStyle='#ffe6a3';
 const label='Nível '+levelEffect.level;
 c.strokeText(label,0,-height-10);c.fillText(label,0,-height-10);
 c.restore();
}
function drawAtmosphere(c,w,h,d,now,mode,z){
 if(motion.matches)return;
 c.save();
 c.setTransform(d,0,0,d,0,0);
 if(mode==='city'||mode==='hunt'){
  c.fillStyle='rgba(14,20,39,'+((1-Math.cos(now/95000))*.045)+')';
  c.fillRect(0,0,w,h);
 }
 const rain=mode==='city'||[0,1,3,6].includes(z);
 const snow=z===4,ash=[2,7,8,9].includes(z);
 if(rain||snow||ash){
  c.globalAlpha=rain?.22:.36;
  c.strokeStyle=snow?'#d0e6ee':ash?'#ba8662':'#a9b6c7';
  c.fillStyle=c.strokeStyle;
  c.lineWidth=1;
  c.beginPath();
  for(let i=0;i<75;i++){
   const x=(i*173+now*(rain?.10:.025))%w,y=(i*113+now*(rain?.35:.055))%h;
   if(rain){c.moveTo(x,y);c.lineTo(x-5,y+16);}
   else c.fillRect(x,y,2,2);
  }
  if(rain)c.stroke();
 }
 c.restore();
}
function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(64,Math.max(0,now-lastFrame));lastFrame=now;const el=canvas();if(!el||!state||el.closest('[hidden]'))return;const r=el.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),W=Math.round(r.width*d),H=Math.round(r.height*d);if(!W||!H)return;if(el.width!==W||el.height!==H){el.width=W;el.height=H;}const c=el.getContext('2d');c.setTransform(d,0,0,d,0,0);const w=W/d,h=H/d,s=state,a=s.activity,z=a?.z||0,key=!a||a.mode==='train'?'city':['boss','dungeon','trial'].includes(a.mode)?'crypt'+z:'zone'+z,full=image('assets/maps/'+key+'.webp'),preview=image('assets/maps/'+key+'-mini.webp'),im=full?.complete&&full.naturalWidth?full:preview;const focus=a?.mode==='gather'?(gatherHero??{x:.5,y:.64}):a?{x:visual.hero,y:visual.heroY??.84}:cityPos;const hunt=a?.mode==='hunt';
const fixedScale=clamp(zoom61/baseZoom,1,1.8);
let scale=fixedScale,scaleY=scale*.62,panorama=.5;
let ox=clamp(w*.5-focus.x*w*scale,w*(1-scale),0);
let backgroundY=clamp(h*(.62-focus.y*scaleY-.33*scale),h*(1-scale),0),oy=backgroundY+h*.33*scale;
if(hunt){
 const width=clamp(w/(2.45*zoom61),440,1600),span=1600-width;
 const hero=(a.positions?.hero??focus.x)*1600;
 const desired=clamp(hero-width*.45,0,span);
 const same=huntCamera?.zone===a.z&&huntCamera.w===w&&huntCamera.h===h&&huntCamera.width===width;
 const pan=same&&Math.abs(huntCamera.pan-desired)<=width*.8
  ?huntCamera.pan+(desired-huntCamera.pan)*(1-Math.exp(-dt/84)):desired;
 panorama=span?pan/span:.5;
 huntCamera={zone:a.z,w,h,width,pan};
 scale=1600/width;
 scaleY=1200/(h*width/w);
 ox=-pan*w/width;
 oy=h*.73-(.84*1200+11)*w/width;
 backgroundY=0;
}else huntCamera=null;
projection={scale,scaleY,ox,oy,backgroundY,w,h};c.fillStyle='#151719';c.fillRect(0,0,w,h);
if(hunt&&im?.complete&&im.naturalWidth){
 c.imageSmoothingEnabled=true;
 const iw=im.naturalWidth,ih=im.naturalHeight;
 c.drawImage(im,iw*.26*panorama,0,iw*.74,ih,0,0,w,h);
}
if(!hunt&&im?.complete&&im.naturalWidth){
 c.imageSmoothingEnabled=true;
 c.drawImage(im,ox,backgroundY,w*scale,h*scale);
}
c.save();c.translate(ox,oy);c.scale(scale,scaleY);drawAtmosphere(c,w,h,d,now,a?.mode??'city',z);const hh=hunt?125*w/1600:Math.min(h*.43,w*.19,150),y=h*.84,target=a?.positions||{hero:.32,enemy:.68,servant:.46};const blend=motion.matches?1:1-Math.exp(-dt/235);
const heroBeforeX=visual.hero,heroBeforeY=visual.heroY??.84;
const enemyBeforeX=visual.enemy,enemyBeforeY=visual.enemyY??.84;
for(const k of ['hero','enemy','servant'])visual[k]+=(target[k]-visual[k])*blend;for(const axis of ['heroY','enemyY']){visual[axis]??=.84;visual[axis]+=((target[axis]??.84)-visual[axis])*blend;}const x=w*visual.hero,heroY=h*visual.heroY,enemyY=h*visual.enemyY;
function shadow(x,y,h){c.fillStyle='#0008';c.beginPath();c.ellipse(x,y,Math.max(10,h*.22),h*.055,0,0,Math.PI*2);c.fill();}
if(!a){const dt=Math.min(.06,Math.max(0,(now-lastCityFrame)/1000));lastCityFrame=now;const keys=cityKeys;let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(dx||dy){cityDest=null;cityRoute=[];cityClickNPC=null;}else if(cityDest){const waypoint=cityRoute[0];if(waypoint){dx=waypoint.x-cityPos.x;dy=waypoint.y-cityPos.y;}else cityDest=null;}const distance=Math.hypot(dx,dy);if(distance){const step=Math.min(.21*dt,distance),nx=cityPos.x+dx/distance*step,ny=cityPos.y+dy/distance*step;if(openSegment(cityPos,{x:nx,y:ny}))cityPos={x:nx,y:ny};else if(!cityDest){if(cityWalkable(nx,cityPos.y))cityPos.x=nx;if(cityWalkable(cityPos.x,ny))cityPos.y=ny;}}if(cityRoute[0]&&Math.hypot(cityRoute[0].x-cityPos.x,cityRoute[0].y-cityPos.y)<.001)cityRoute.shift();const actorH=cityActorHeight(w,h),actors=cityNPC.map(n=>({...n,npc:true})).concat([{...cityPos,cls:s.cls,npc:false}]).sort((a,b)=>a.y-b.y);for(const n of actors){const px=n.x*w,py=n.y*h;shadow(px,py,actorH);draw(c,n.npc?art.npcs[n.mode]:art.hero[n.cls][distance&&!motion.matches?1+Math.floor(now/130)%2:0],px,py,actorH);if(n.npc){c.font='bold 11px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#08080b';c.strokeText(n.name,px,py-actorH-5);c.fillStyle='#f0d59c';c.fillText(n.name,px,py-actorH-5);}}cityNear=cityNPC.map(n=>({n,d:Math.hypot((n.x-cityPos.x)*w,(n.y-cityPos.y)*h)})).sort((a,b)=>a.d-b.d).find(x=>x.d<=Math.max(35,actorH*.8))?.n||null;const hint=document.getElementById('city61-hint'),button=document.getElementById('interact61');if(hint)hint.textContent=cityNear?cityNear.name+' · '+cityNear.role:'WASD / setas · clique para andar';if(button)button.disabled=!cityNear;if(cityClickNPC&&cityNear===cityClickNPC){cityDest=null;cityRoute=[];cityClickNPC=null;interact();}c.restore();mini(c,key,w,h,cityPos,cityNPC);return;}
if(a.mode!=='gather'){
 const heroTravel=Math.hypot(x-heroBeforeX*w,heroY-heroBeforeY*h);
 const enemyTravel=Math.hypot(visual.enemy*w-enemyBeforeX*w,enemyY-enemyBeforeY*h);
 const moving=!motion.matches&&heroTravel>dt*hh*.00008;
 const enemyMoving=!motion.matches&&enemyTravel>dt*hh*.00008;
 if(moving)heroStride+=heroTravel/(hh*.22);
 if(enemyMoving)enemyStride+=enemyTravel/(hh*.21);
 const action=motion.matches?null:heroAction;
 const duration=action?.kind==='melee'?360:420;
 const progress=action?(now-action.at)/duration:1;
 const striking=progress>=0&&progress<1;
 const phase=striking?(progress<.25?progress/.25:(1-progress)/.75):0;
 const effort=phase*phase*(3-2*phase);
 const melee=action?.kind==='melee';
 const facing=striking?action.side<0:!!a.enemy&&visual.hero>visual.enemy;
 const dx=striking?action.side*hh*effort*(melee ? .17:action.kind==='ranged'?-.055:0):0;
 const dy=striking&&melee?Math.max(-hh*.09,Math.min(hh*.09,action.vertical*h))*effort:0;
 const walk=moving&&!striking?Math.sin(heroStride*Math.PI):0;
 const lean=effort*(melee ? .14:-.08)+walk*.035;
 const lift=hh*.035*Math.abs(walk);
 const sprite=striking?3:moving?1+Math.floor(heroStride)%2:0;
 shadow(x+dx,heroY+dy,hh);
 draw(c,art.hero[s.cls][sprite],x+dx,heroY+dy-lift,hh,facing,!motion.matches&&now-heroHitAt<130,lean,1+effort*.045);
 drawConditions(c,a.heroEffects,x+dx,heroY+dy,hh);
 if(a.enemy){
  drawCombatHealth(c,x+dx,heroY+dy,s.hp/s.stats.hp,'#83ac75');
  const close=Math.abs((visual.hero-visual.enemy)*w*scale)<105;
  const nameY=heroY+dy-hh*scale/scaleY-(close?44:22)/scaleY;
  drawCombatLabel(c,x+dx,nameY,s.name,'#ede2c8','600 12px system-ui');
  if(s.activeTitle)drawCombatLabel(c,x+dx,nameY-15/scaleY,s.activeTitle.name,titleColors[s.activeTitle.rarity],'italic 600 11px Georgia');
 }
 if(a?.enemy){const boss=a.mode==='boss'||a.mode==='trial'||a.mode==='dungeon'&&a.wave===4,eh=hh*(boss?1.30:.96),ex=w*visual.enemy;if(defeated&&!motion.matches&&now-defeated.at<1050){
 const p=defeated.positions,px=w*p.enemy,py=h*(p.enemyY??.84),height=hh*(defeated.boss?1.30:.96);
 c.save();
 c.globalAlpha=1-clamp((now-defeated.at)/1050,0,1);
 shadow(px,py,height);
 draw(c,defeated.boss?art.boss[z]:art.monsters[z]?.[defeated.index||0],px,py,height,p.enemy>=p.hero);
 c.restore();
}else{
 let enemyX=ex,enemyFeet=enemyY,lean=0,stretch=1;
 const gait=enemyMoving?Math.sin(enemyStride*Math.PI):0;
 const enemyLift=Math.abs(gait)*eh*.045;
 if(!motion.matches&&enemyAction){
  const phase=clamp((now-enemyAction.at)/310,0,1);
  const effort=phase===1?0:Math.sin(Math.PI*phase);
  const dx=w*enemyAction.dx,dy=h*enemyAction.dy;
  const distance=Math.hypot(dx,dy)||1;
  const step=eh*effort*(enemyAction.ranged?-.055:.12);
  enemyX+=dx/distance*step;enemyFeet+=dy/distance*step;
  lean=effort*(enemyAction.ranged?-.065:.11);
  stretch+=effort*(enemyAction.ranged?-.045:.065);
 }
 shadow(enemyX,enemyFeet,eh);
 draw(c,boss?art.boss[z]:art.monsters[z]?.[a.index||0],enemyX,enemyFeet-enemyLift,eh,visual.enemy>=visual.hero,!motion.matches&&now>=flash&&now-flash<130,lean+gait*.045,stretch-gait*.055);
 drawConditions(c,a.effects,enemyX,enemyFeet,eh);
 drawCombatHealth(c,enemyX,enemyFeet,a.enemyHp/a.enemy.hp,'#ac4b47');
 const nameY=enemyFeet-eh*scale/scaleY-22/scaleY;
 drawCombatLabel(c,enemyX,nameY,a.enemy.name,'#e4d6bd','600 12px system-ui');
 const rank=a.mode==='trial'?'Provação':boss?'Chefe':a.mode==='dungeon'?'Elite':null;
 if(rank)drawCombatLabel(c,enemyX,nameY-14/scaleY,rank,'#edb477','600 10px system-ui');
}minionVisual.length=Math.min(minionVisual.length,(s.minions||[]).length);if(s.cls==='necro')for(const [i,m] of (s.minions||[]).entries()){const slot=minionVisual[i]??={x:m.x,y:m.y??0},step=motion.matches?1:1-Math.exp(-dt/172);slot.x+=(m.x-slot.x)*step;slot.y+=((m.y??0)-slot.y)*step;const mx=w*slot.x,my=enemyY+h*slot.y;shadow(mx,my,hh*.55);c.save();if(m.role!=='bone')c.filter=({sentinel:'saturate(.45) brightness(1.12)',archer:'sepia(.35) hue-rotate(65deg)',herald:'sepia(.6) hue-rotate(220deg)'})[m.role]||'none';draw(c,art.monsters[1][0],mx,my,hh*.55);c.restore();c.font='10px system-ui';c.textAlign='center';c.fillStyle='#d4e1d2';c.fillText(({bone:'Servo',sentinel:'Sentinela',archer:'Arqueiro',herald:'Arauto'})[m.role]||'Servo',mx,my-hh*.58);} }}
if(a.mode==='gather'){
 const field=gatherFields[z],active=s.prof[a.prof].total%18,targetNode=field.find(node=>node.index===active);
 const scale=hh/125,burst=fx.find(f=>f.parts);
 const top=Math.round((gatherFloors[z]-.33)*600/.62-11);
 gatherHero??={x:400/800,y:Math.max(300,top)/600};
 const dt=Math.min(50,Math.max(0,now-(lastGatherFrame||now)));
 lastGatherFrame=now;
 const dx=targetNode.x-gatherHero.x,dy=targetNode.y-gatherHero.y;
 const distance=Math.hypot(dx*800,dy*600);
 const moving=distance>2;
 const step=a.paused?0:!moving||motion.matches?1:Math.min(1,dt*.19/distance);
 gatherHero.x+=dx*step;
 gatherHero.y+=dy*step;
 const actors=[...field,gatherHero].sort((a,b)=>a.y-b.y);
 for(const node of actors){
  const px=node.x*w,py=node.y*h;
  if(node===gatherHero){
   shadow(px,py,hh*.7);
   draw(c,art.hero[s.cls][moving&&!a.paused&&!motion.matches?1+Math.floor(now/130)%2:0],px,py,hh*.7,dx<0);
   continue;
  }
  const opacity=burst?.index===node.index?clamp((now-burst.at-750)/400,0,1):1;
  if(!opacity)continue;
  c.save();
  c.globalAlpha=opacity;
  art.drawGatherNode(c,px,py,a.prof,z,node.index,scale);
  if(node.index===active){
   c.strokeStyle='#e9dca3';
   c.lineWidth=1.4;
   c.beginPath();
   c.ellipse(px,py,25*scale,7*scale,0,0,Math.PI*2);
   c.stroke();
  }
  c.restore();
 }
}
if(a.mode!=='gather')drawLevelEffect(c,x,heroY,hh,now);
fx=fx.filter(f=>now-f.at<(f.projectile?.flight??1250));for(const f of fx){const t=(now-f.at)/1000;if(t<0)continue;c.save();c.globalAlpha=Math.max(0,1-t/1.25);if(f.parts){const node=gatherFields[z].find(n=>n.index===f.index),scale=hh/125;for(const p of f.parts){c.fillStyle=p.color;c.fillRect(node.x*w+p.x*scale+p.vx*t,node.y*h+p.y*scale+p.vy*t+100*t*t,4*scale,4*scale);}}else if(f.projectile){drawProjectile(c,f.projectile,w,h,hh,t);}else if(f.impact){if(!f.played){f.played=true;if(!f.impact.support)tone('hit');}drawImpact(c,f.impact,w,h,hh,t);}else{const labelY=h*f.y-(f.actor?hh*.82:0)-t*30;c.font='bold 17px system-ui';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#08080b';c.strokeText(f.text,w*f.x,labelY);c.fillStyle=f.color;c.fillText(f.text,w*f.x,labelY);}c.restore();}c.restore();mini(c,key,w,h,gatherHero??{x:visual.hero,y:visual.heroY},a?.enemy?[{x:visual.enemy,y:visual.enemyY,enemy:true}]:[]);}
function mini(c,key,w,h,hero,others){const r=Math.min(48,w*.105,h*.16),cx=w-r-9,cy=h-r-9,im=image('assets/maps/'+key+'-mini.webp');c.save();c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.clip();c.fillStyle='#151719';c.fillRect(cx-r,cy-r,2*r,2*r);if(im?.complete&&im.naturalWidth){const sc=Math.max(2*r/im.naturalWidth,2*r/im.naturalHeight),iw=im.naturalWidth*sc,ih=im.naturalHeight*sc;c.drawImage(im,cx-iw/2,cy-ih/2,iw,ih);}c.fillStyle='#09090b44';c.fillRect(cx-r,cy-r,2*r,2*r);const dot=(p,color)=>{c.beginPath();c.arc(cx-r+2*r*p.x,cy-r+2*r*p.y,3,0,Math.PI*2);c.fillStyle=color;c.fill();};for(const n of others)dot(n,n.enemy?'#f08080':'#e0bb73');dot(hero,'#fff7df');c.restore();c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.strokeStyle='#bd9b68';c.lineWidth=2;c.stroke();}
function toggle(){sound=!sound;if(sound){try{audio??=new AudioContext();audio.resume().catch(()=>{});}catch{sound=false;}}const b=document.getElementById('sound52');if(b){b.textContent=sound?'Som ligado':'Som desligado';b.setAttribute('aria-pressed',String(sound));}}
function interact(){if(!state||state.activity||!cityNear)return;window.eldoria61CityService?.(cityNear.mode);}
const blocked=()=>!state||state.activity||document.querySelector('dialog[open]')||document.querySelector('#window53.floating53:not([hidden])');document.addEventListener('keydown',e=>{if(blocked()||e.target.closest?.('input,select,textarea,button,[contenteditable]'))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();cityKeys.add(k);}else if(k==='e'){e.preventDefault();interact();}});document.addEventListener('keyup',e=>cityKeys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>cityKeys.clear());document.addEventListener('visibilitychange',()=>{cityKeys.clear();if(document.hidden)levelEffect=null;});canvas()?.addEventListener('click',e=>{if(blocked()||!projection)return;const r=canvas().getBoundingClientRect(),p=projection,x=((e.clientX-r.left)/r.width*p.w-p.ox)/(p.w*p.scale),y=((e.clientY-r.top)/r.height*p.h-p.oy)/(p.h*p.scaleY),actorH=cityActorHeight(p.w,p.h);cityClickNPC=cityNPC.find(n=>Math.abs((x-n.x)*p.w)<actorH*.32&&(y-n.y)*p.h*p.scaleY>=-actorH*p.scale&&(y-n.y)*p.h*p.scaleY<actorH*p.scale*.20)||null;const clicked=cityClickNPC?{x:cityClickNPC.x,y:cityClickNPC.y+.04}:{x,y};cityDest=cityWalkable(clicked.x,clicked.y)?clicked:nearestCityNode(clicked);cityRoute=cityDest?routeCity(cityPos,cityDest):[];canvas().focus({preventScroll:true});});
window.eldoria52Scene={apply,toggle,interact,zoom:delta=>{zoom61=clamp(zoom61+delta,baseZoom,1);},view:()=>projection?{...projection}:null};
})();
