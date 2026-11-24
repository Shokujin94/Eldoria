/* 0.43.0 — visual feedback for character level gains. */
(()=>{
'use strict';
let effect=null;
const choose45=choose;choose=function(...args){const r=choose45(...args);window.eldoria45RestoreUI?.();return r;};
const xp0=gainXP;gainXP=function(n){
 const owner=state,before=state.level,result=xp0(n);
 if(state!==owner||!state.cls||state.level<=before||suppress||catchingUp||document.hidden)return result;
 const now=gameNow28(),count=state.level-before;
 effect={owner,t:now,level:state.level,count};
 if(audioReady11()){
  soundNote11('fx',392,.21,.075,'triangle',440);
  soundNote11('fx',523,.24,.085,'triangle',587,.12);
  soundNote11('fx',784,.42,.085,'sine',880,.25);
 }
 return result;
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)effect=null;});
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const paint0=renderActors23;
renderActors23=function(now,fixed){
 paint0(now,fixed);
 const f=effect;if(!f)return;
 const t=(gameNow28()-f.t)/1450;
 if(f.owner!==state||t<0||t>=1){effect=null;return;}
 const y=pos.y+(window.eldoria40Sidestep?.()||0),h=window.eldoria35?.hHero?.()||(fixed?104:68),still=reduced.matches;
 actor23((c,x,y)=>{
  c.save();try{
   c.translate(x,y+11);
   const fade=Math.min(1,(1-t)*2.4);
   c.globalAlpha=fade;
   if(!still){
    const radius=18+t*24;
    c.strokeStyle='#f8d786';c.lineWidth=2;c.shadowColor='#e4ae49';c.shadowBlur=8;
    c.beginPath();c.ellipse(0,-1,radius,radius*.28,0,0,Math.PI*2);c.stroke();
    const aura=c.createRadialGradient(0,-h*.45,4,0,-h*.45,h*.75);
    aura.addColorStop(0,'rgba(255,224,143,.28)');aura.addColorStop(1,'rgba(255,187,62,0)');
    c.fillStyle=aura;c.fillRect(-h,-h*1.3,h*2,h*1.6);
    c.fillStyle='#ffe8a0';
    for(let i=0;i<22;i++){
     const angle=i*2.399+t*1.1,u=(t+i*.037)%1,xx=Math.cos(angle)*(13+22*u),yy=-h*(.12+1.03*u);
     c.globalAlpha=fade*Math.sin(Math.PI*u);c.fillRect(xx,yy,2+(i%3),2+(i%3));
    }
   }
   c.globalAlpha=fade;c.shadowBlur=0;c.textAlign='center';c.textBaseline='middle';c.font='bold 15px system-ui';c.lineWidth=3;c.strokeStyle='#15100a';c.fillStyle='#ffe6a3';
   const label='NÍVEL '+f.level+(f.count>1?' (+'+f.count+')':''),yy=-h-35-(still?0:12*t);
   c.strokeText(label,0,yy);c.fillText(label,0,yy);
  }finally{c.restore();}
 },pos.x,y);
};
})();
