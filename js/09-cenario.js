
(function(){
  const style=document.createElement('style');
  style.textContent=`
  body.play14 #world{background:#131217!important}
  body.play14 .quicknav{box-shadow:0 2px 18px #000d,inset 0 0 0 1px #97755155!important}
  .floating{box-shadow:0 0 0 1px #0b0a0c,0 0 0 3px #4d3c2e,0 16px 48px #000d,inset 0 0 0 1px #c09a6633!important}
  #combatHUD22{--orb:84px;bottom:8px}
  .c22-core{padding:7px 12px 7px!important;min-width:168px!important}
  .c22-slot{box-shadow:inset 0 0 0 2px #15151a,0 0 10px #0008!important}
  #combatHUD22{max-width:calc(100vw - 12px)!important}
  #combatHUD22[data-placed15='1']{bottom:auto!important}
  `;
  document.head.append(style);

  function clamp24(v,a,b){return Math.max(a,Math.min(b,v));}
  function hash24(a,b=0){const x=Math.sin(a*127.1+b*311.7)*43758.5453;return x-Math.floor(x);}
  function stageKey24(){return typeof stageMode23==='function'?stageMode23():(state.mode+'-'+(state.zone||0));}
  function screen24(wx,wy){const sx=world.width/cam.w,sy=world.height/cam.h;return [(wx-cam.x)*sx,(wy-cam.y)*sy,sx,sy];}
  const detailCache24={};
  const themes24={
    city:{count:18,kind:['torch','puddle','crate','banner','crow','rubble']},
    zone0:{count:26,kind:['shrub','deadtree','mushroom','ruin','stone']},
    zone1:{count:24,kind:['grave','bone','rubble','deadtree','stone']},
    zone2:{count:24,kind:['spike','bloodpool','bone','stone','torch']},
    zone3:{count:24,kind:['reed','wisp','deadtree','puddle','bone']},
    zone4:{count:24,kind:['snowdrift','wagon','torchblue','stone','grave']},
    zone5:{count:24,kind:['column','candle','grave','puddle','rubble']},
    zone6:{count:24,kind:['cart','crow','deadtree','rubble','bone']},
    zone7:{count:24,kind:['chainpost','shield','spike','rubble','torch']},
    zone8:{count:24,kind:['cocoon','thorn','wisp','bone','deadtree']},
    zone9:{count:24,kind:['lava','monolith','skullpile','spike','smokevent']},
  };
  for(let i=0;i<10;i++) themes24['crypt'+i]={count:20,kind:['pillar','torch','bloodpool','bone','rubble']};

  function props24(){
    const key=stageKey24();
    if(detailCache24[key]) return detailCache24[key];
    const theme=themes24[key]||themes24.zone0;
    const arr=[]; const w=worldW?worldW():1500,h=worldH?worldH():1100;
    for(let i=0;i<theme.count;i++){
      const wx=70+hash24(i,key.length)* (w-140);
      const wy=100+hash24(i,theme.count)* (h-180);
      const kind=theme.kind[Math.floor(hash24(i,wx)*theme.kind.length)];
      const s=.75+hash24(i,wy)*1.05;
      arr.push({x:wx,y:wy,kind,s,flip:hash24(wx,wy)>.5});
    }
    detailCache24[key]=arr; return arr;
  }

  function flame24(x,y,col='#f3b562',scale=1){
    ctx.save(); ctx.translate(x,y);
    const t=gameNow28()/180;
    ctx.globalCompositeOperation='screen';
    ctx.fillStyle=col; ctx.globalAlpha=.24;
    ctx.beginPath(); ctx.ellipse(0,0,14*scale,22*scale,0,0,7); ctx.fill();
    ctx.fillStyle='#ffdcb0'; ctx.globalAlpha=.6;
    ctx.beginPath(); ctx.ellipse(Math.sin(t)*2,-6*scale,5*scale,9*scale,0,0,7); ctx.fill();
    ctx.restore();
  }
  function mist24(alpha=.08,tint='180,190,215'){
    const t=gameNow28()/9000; ctx.save();
    for(let i=0;i<4;i++){
      const x=((i*211+t*65*(i%2?1:-1))%(world.width+220))-110;
      const y=world.height*(.18+.18*i)+Math.sin(t*2+i)*8;
      const g=ctx.createRadialGradient(x,y,8,x,y,120+i*22);
      g.addColorStop(0,`rgba(${tint},${alpha})`);
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,140+i*30,38+i*7,0,0,7); ctx.fill();
    }
    ctx.restore();
  }
  function rainDust24(mode){
    const z=state.zone||0; const now=gameNow28(); ctx.save();
    if(state.mode==='hunt' && [0,3,8].includes(z)) mist24(.11,'160,170,180');
    if(state.mode==='hunt' && [2,9].includes(z)) mist24(.06,'180,90,70');
    if(state.mode==='hunt' && [4].includes(z)) mist24(.08,'180,200,220');
    if(state.mode==='city') mist24(.05,'170,150,130');
    ctx.restore();
  }
  function drawProp24(p){
    const [x,y,sx,sy]=screen24(p.x,p.y);
    if(x<-80||x>world.width+80||y<-80||y>world.height+80) return;
    const s=p.s*Math.min(sx,sy);
    ctx.save();
    if(p.flip){ctx.translate(x,y);ctx.scale(-1,1);ctx.translate(-x,-y);} 
    switch(p.kind){
      case 'torch': case 'torchblue': {
        ctx.fillStyle='#1b1618'; ctx.fillRect(x-4*s,y-22*s,8*s,25*s); ctx.fillStyle='#584231'; ctx.fillRect(x-6*s,y+2*s,12*s,6*s); flame24(x,y-23*s,p.kind==='torchblue'?'#7ec1ff':'#f0a14d',.45*s); break; }
      case 'puddle': {
        const g=ctx.createRadialGradient(x,y+6*s,2,x,y+6*s,22*s); g.addColorStop(0,'rgba(175,185,210,.28)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y+6*s,22*s,7*s,0,0,7); ctx.fill(); break; }
      case 'crate': case 'cart': {
        ctx.fillStyle='#34281f'; ctx.fillRect(x-14*s,y-12*s,28*s,18*s); ctx.strokeStyle='#6f5437'; ctx.strokeRect(x-14*s,y-12*s,28*s,18*s); if(p.kind==='cart'){ctx.beginPath(); ctx.arc(x-13*s,y+9*s,6*s,0,7); ctx.arc(x+13*s,y+9*s,6*s,0,7); ctx.stroke();} break; }
      case 'banner': {
        ctx.fillStyle='#20181a'; ctx.fillRect(x-2*s,y-35*s,4*s,42*s); ctx.fillStyle='#5c2429'; ctx.beginPath(); ctx.moveTo(x+2*s,y-31*s); ctx.lineTo(x+22*s,y-28*s); ctx.lineTo(x+15*s,y-4*s); ctx.lineTo(x+2*s,y-8*s); ctx.closePath(); ctx.fill(); break; }
      case 'crow': {
        ctx.fillStyle='#0c0d11'; ctx.beginPath(); ctx.ellipse(x,y-4*s,9*s,5*s,0,0,7); ctx.fill(); ctx.fillRect(x+3*s,y-11*s,4*s,8*s); break; }
      case 'rubble': case 'stone': {
        ctx.fillStyle=p.kind==='stone'?'#5d5956':'#403a38'; for(let i=0;i<4;i++) ctx.fillRect(x+((i%2)*7-6)*s,y+(Math.floor(i/2)*4-2)*s,(5+hash24(i,x)*5)*s,(4+hash24(i,y)*4)*s); break; }
      case 'deadtree': {
        ctx.strokeStyle='#3b2c24'; ctx.lineWidth=4*s; ctx.beginPath(); ctx.moveTo(x,y+4*s); ctx.lineTo(x,y-32*s); ctx.lineTo(x-11*s,y-50*s); ctx.moveTo(x,y-24*s); ctx.lineTo(x+14*s,y-40*s); ctx.stroke(); break; }
      case 'shrub': case 'reed': case 'thorn': {
        ctx.strokeStyle=p.kind==='thorn'?'#463031':'#425437'; ctx.lineWidth=2*s; for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(x+(i-2)*3*s,y+7*s);ctx.lineTo(x+(i-2)*2*s,y-(6+hash24(i,x)*8)*s);ctx.stroke();} break; }
      case 'mushroom': {
        ctx.fillStyle='#c6b197'; ctx.fillRect(x-2*s,y-4*s,4*s,8*s); ctx.fillStyle='#7b5146'; ctx.beginPath(); ctx.ellipse(x,y-6*s,8*s,5*s,0,0,7); ctx.fill(); break; }
      case 'ruin': case 'column': case 'pillar': {
        ctx.fillStyle='#4e4644'; ctx.fillRect(x-10*s,y-26*s,20*s,30*s); ctx.fillStyle='#71675f'; ctx.fillRect(x-12*s,y-31*s,24*s,7*s); ctx.fillRect(x-13*s,y+4*s,26*s,6*s); break; }
      case 'bone': case 'skullpile': {
        ctx.fillStyle='#b9ab8a'; ctx.fillRect(x-12*s,y-2*s,24*s,4*s); ctx.fillRect(x-3*s,y-9*s,6*s,18*s); if(p.kind==='skullpile'){ctx.beginPath();ctx.arc(x-7*s,y-8*s,5*s,0,7);ctx.arc(x+8*s,y-5*s,6*s,0,7);ctx.fill();} break; }
      case 'spike': case 'chainpost': {
        ctx.fillStyle='#2d2220'; ctx.fillRect(x-3*s,y-26*s,6*s,31*s); ctx.fillStyle='#8a6b44'; ctx.beginPath(); ctx.moveTo(x-8*s,y-25*s);ctx.lineTo(x,y-40*s);ctx.lineTo(x+8*s,y-25*s);ctx.fill(); if(p.kind==='chainpost'){ctx.strokeStyle='#64554c';ctx.beginPath();ctx.moveTo(x+2*s,y-16*s);ctx.lineTo(x+18*s,y-8*s);ctx.stroke();} break; }
      case 'bloodpool': {
        const g=ctx.createRadialGradient(x,y,2,x,y,16*s); g.addColorStop(0,'rgba(130,24,24,.54)');g.addColorStop(1,'rgba(60,8,8,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,18*s,9*s,0,0,7); ctx.fill(); break; }
      case 'grave': {
        ctx.fillStyle='#534d4a'; ctx.fillRect(x-8*s,y-24*s,16*s,28*s); ctx.fillStyle='#766d66'; ctx.fillRect(x-10*s,y-28*s,20*s,7*s); break; }
      case 'wisp': {
        flame24(x,y-18*s,'#8fb6ff',.38*s); break; }
      case 'wagon': {
        ctx.fillStyle='#36261d'; ctx.fillRect(x-20*s,y-12*s,40*s,15*s); ctx.strokeStyle='#6f5437';ctx.strokeRect(x-20*s,y-12*s,40*s,15*s); ctx.beginPath();ctx.arc(x-13*s,y+6*s,7*s,0,7);ctx.arc(x+13*s,y+6*s,7*s,0,7);ctx.stroke(); break; }
      case 'candle': {
        ctx.fillStyle='#d9d0bc'; ctx.fillRect(x-2*s,y-10*s,4*s,12*s); flame24(x,y-11*s,'#ffd483',.2*s); break; }
      case 'shield': {
        ctx.fillStyle='#463e44'; ctx.beginPath(); ctx.moveTo(x,y-18*s); ctx.lineTo(x+12*s,y-8*s); ctx.lineTo(x+8*s,y+10*s); ctx.lineTo(x,y+18*s); ctx.lineTo(x-8*s,y+10*s); ctx.lineTo(x-12*s,y-8*s); ctx.closePath(); ctx.fill(); break; }
      case 'cocoon': {
        ctx.fillStyle='#817774'; ctx.beginPath(); ctx.ellipse(x,y-3*s,10*s,16*s,0,0,7); ctx.fill(); ctx.strokeStyle='#a89f9b'; for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x-8*s+i*4*s,y-15*s);ctx.lineTo(x-8*s+i*4*s,y+10*s);ctx.stroke();} break; }
      case 'monolith': {
        ctx.fillStyle='#232127'; ctx.fillRect(x-10*s,y-34*s,20*s,42*s); ctx.fillStyle='#6c4d5d'; ctx.fillRect(x-2*s,y-24*s,4*s,18*s); break; }
      case 'lava': {
        const g=ctx.createLinearGradient(x,y-10*s,x,y+10*s);g.addColorStop(0,'rgba(255,186,77,.8)');g.addColorStop(1,'rgba(121,29,0,0)'); ctx.fillStyle=g; ctx.beginPath();ctx.ellipse(x,y,20*s,8*s,0,0,7);ctx.fill(); break; }
      case 'smokevent': {
        ctx.fillStyle='#31262a'; ctx.beginPath();ctx.arc(x,y+5*s,9*s,0,7);ctx.fill(); break; }
      case 'snowdrift': {
        ctx.fillStyle='rgba(205,218,228,.7)'; ctx.beginPath();ctx.ellipse(x,y,18*s,9*s,0,0,7);ctx.fill(); break; }
    }
    ctx.restore();
  }
  function drawDetails24(){ props24().forEach(drawProp24); }

  const drawStage23Base = stageDraw23;
  stageDraw23 = function(now,cw,ch){
    drawStage23Base(now,cw,ch);
    if(state.profile?.detail12===false)return;
    ctx.save();
    try{if(state.era20?.climate!==false)rainDust24(state.mode);}finally{ctx.restore();}
    const vignette=ctx.createRadialGradient(cw/2,ch*.46,Math.min(cw,ch)*.32,cw/2,ch*.46,Math.max(cw,ch)*.73);
    vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#0005');ctx.fillStyle=vignette;ctx.fillRect(0,0,cw,ch);
  };

  function foreground24(){
    ctx.save();
    if(state.mode==='hunt'){
      const z=state.zone||0;
      if([0,3,8].includes(z)) mist24(.12,'170,180,185');
      if([2,9].includes(z)) mist24(.07,'150,70,60');
      /* foreground silhouettes removed to preserve visibility and navigation.
      const t=gameNow28()/1200;
      ctx.fillStyle='rgba(14,14,18,.55)';
      for(let i=0;i<6;i++){
        const x=((i*187+t*(i%2?8:-6))%(world.width+140))-70;
        ctx.beginPath(); ctx.moveTo(x,world.height+10); ctx.lineTo(x+20,world.height-40); ctx.lineTo(x+50,world.height+10); ctx.closePath(); ctx.fill();
      }
      */
    }
    if(state.mode==='city') mist24(.04,'180,150,120');
    if(['dungeon','boss','trial'].includes(state.mode)) mist24(.07,'120,105,105');
    ctx.restore();
  }
  // No extra render loop: the original draw function owns requestAnimationFrame.
  const namesBase24=paintNames15;
  paintNames15=function(){if(state.profile?.detail12!==false&&state.era20?.climate!==false){ctx.save();try{ctx.setTransform(1,0,0,1,0,0);foreground24();}finally{ctx.restore();}}namesBase24();};

  const heroBase24 = hero;
  let previousHero24=null,motion24=0,phase24=0,previousStage24='';
  hero = function(c,x,y,s=2,flash=false){
    if(c!==ctx)return heroBase24(c,x,y,s,flash);
    const now=gameNow28(),key=stageKey24();
    const d=previousHero24&&key===previousStage24?Math.hypot(x-previousHero24.x,y-previousHero24.y):0;
    previousHero24={x,y};previousStage24=key;
    motion24+=(Math.min(1,d/.65)-motion24)*.28;phase24+=Math.min(d,8)*.095;
    const bob=Math.sin(phase24)*.24*s*motion24;
    const combat=['hunt','boss','dungeon','trial'].includes(state.mode);
    c.save();try{
      c.translate(0,bob);heroBase24(c,x,y,s,flash);
      // Only the melee vocation receives a slash; ranged effects remain in the original projectile engine.
      const age=Date.now()-hitEnemy;
      if(false){
        const e=enemyPoint(now),dir=e.x<x?-1:1,t=age/200;
        c.save();c.translate(x+dir*10*s,y-6*s);c.scale(dir,1);c.globalAlpha=(1-t)*.65;
        c.strokeStyle='#e8a69a';c.lineWidth=1.7*s;c.beginPath();c.arc(0,0,18*s,-1.2+t*.5,1.0+t*.5);c.stroke();c.restore();
      }
    }finally{c.restore();}
  };

  const creatureBase24 = creature;
  creature = function(c,id,x,y,s=3,flash=false){
    if(c!==ctx)return creatureBase24(c,id,x,y,s,flash);
    const now=gameNow28(); const bob=Math.sin(now/420 + x*.01 + y*.01)*.28*Math.max(.6,s*.12);
    c.save(); c.translate(0,bob); creatureBase24(c,id,x,y,s,flash);

    c.restore();
  };
  const bossBase24 = drawBoss;
  drawBoss = function(c,x,y,z,flash){return bossBase24(c,x,y,z,flash);};
  const npcBase24 = drawNPC;
  drawNPC = function(c,n){
    const now=gameNow28(); const hover=Math.sin(now/320 + n.x*.01)*.35; c.save(); c.translate(0,hover); npcBase24(c,n); c.restore();
  };

  // Keep collision, labels, and rendered sprite on the same world coordinates.
  const hud=document.getElementById('combatHUD22');if(hud)hud.style.maxWidth='calc(100vw - 12px)';
  console.log('Eldoria 0.24.1 render fix loaded');
})();
