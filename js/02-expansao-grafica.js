
/* 0.17 — Convergência Sombria: finalização de pendências, sprites e ícones dedicados. */
(function(){
  const BUILD17='0.17-convergencia';
  const q17=s=>document.querySelector(s);

  /* Salvamento persistente validado + backup espelhado. */
  const save17base=save;
  save=function(){
    try{
      state.version=3;
      state.savedAt=Date.now();
      state.build17=BUILD17;
      const raw=JSON.stringify(state);
      localStorage.setItem(KEY,raw);
      localStorage.setItem(KEY+'-backup',raw);
      localStorage.setItem('eldoria-autosave-v023',raw);
      if($('saveStatus'))$('saveStatus').textContent='Progresso salvo';
      return true;
    }catch(err){
      try{ if($('saveStatus'))$('saveStatus').textContent='Salvamento indisponível'; }catch(_e){}
      return false;
    }
  };
  let autosave17=null;
  function installPersistence17(){
    if(autosave17)clearInterval(autosave17);
    autosave17=setInterval(()=>{ if(state.cls) save(); },15000);
    const settings=q17('#content-settings');
    if(settings && !q17('#persist17')){
      const wrap=document.createElement('div');
      wrap.className='service-card';
      wrap.id='persist17';
      wrap.innerHTML=`<h3>Salvamento persistente</h3><p class="muted">O progresso é salvo no navegador, com cópia de segurança local a cada atualização relevante.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="secondary" id="export17">Exportar save</button><button class="secondary" id="import17">Importar save</button><input id="import17file" type="file" accept="application/json" style="display:none"></div>`;
      settings.append(wrap);
      q17('#export17').onclick=()=>{
        try{
          const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
          const a=document.createElement('a');
          a.href=URL.createObjectURL(blob);
          a.download='eldoria-save-v023.json';
          a.click();
          setTimeout(()=>URL.revokeObjectURL(a.href),800);
        }catch(err){ log('Falha ao exportar save.','bad'); }
      };
      q17('#import17').onclick=()=>q17('#import17file').click();
      q17('#import17file').addEventListener('change',async e=>{
        const file=e.target.files && e.target.files[0];
        if(!file)return;
        try{
          const txt=await file.text();
          const data=JSON.parse(txt);
          if(!data || data.version!==3 || !CLASSES[data.cls] || !ZONES[data.zone] || !Array.isArray(data.inventory) || !data.equipment || !data.attrs || !data.talents) throw new Error('save inválido');
          if(!confirm('Importar este personagem? O progresso atual desta edição será substituído.')) return;
          const previous=state;try{state=data;state.active=false;normalizeWorld();lastMode='';dest=null;pos={x:400,y:300};render();}catch(err){state=previous;lastMode='';render();throw err;}
          const persisted=save();
          log(persisted?'Save importado com sucesso.':'Save carregado na sessão; armazenamento local indisponível.','good');
        }catch(err){ log('Arquivo de save inválido.','bad'); }
        e.target.value='';
      });
    }
  }

  /* Balanceamento completo das vocações: primeira passagem definitiva. */
  const stats17base=stats;
  stats=function(eq=state.equipment){
    const s=stats17base(eq);
    if(!state.cls) return s;
    if(state.cls==='war'){
      s.dmg*=1.06; s.h=Math.floor(s.h*1.06); s.reduction=Math.min(.72,s.reduction+.04);
    }else if(state.cls==='ranger'){
      s.dmg*=.985; s.dodge=Math.min(.31,s.dodge); s.crit=Math.min(.72,s.crit+.01); s.critMult+=.04;
    }else if(state.cls==='mage'){
      s.dmg*=1.03; s.h=Math.floor(s.h*1.08); s.reduction=Math.min(.64,s.reduction+.025); s.special*=1.04;
    }else if(state.cls==='cleric'){
      s.dmg*=.97; s.h=Math.floor(s.h*1.1); s.heal*=1.18; s.reduction=Math.min(.66,s.reduction+.03);
    }
    s.h=Math.floor(s.h);
    return s;
  };

  /* Ícones exclusivos para cada novo item: base + sigilo por nome/tier/perk. */
  const itemIcon17base=itemIcon;
  const perkGlyph17={
    blood:'M4 22 8 17 12 22 16 11 20 22 24 17 28 22',
    ward:'M16 4 26 10v8c0 5-4 8-10 10C10 26 6 23 6 18v-8Z',
    swift:'M6 18c5-7 9-11 18-12-4 4-7 8-8 12h6c-4 4-8 6-16 6Z',
    ember:'M16 4c4 5 6 9 6 13a6 6 0 1 1-12 0c0-4 2-8 6-13Z',
    flow:'M6 10c4-4 8-4 12 0s8 4 12 0M6 18c4-4 8-4 12 0s8 4 12 0',
    mercy:'M16 6v20M6 16h20',
    rend:'M10 6 6 14l5 3-3 9 14-16-5-3 3-5Z',
    iron:'M6 8h20v16H6Z',
    hunt:'M16 5l4 7 7 4-7 4-4 7-4-7-7-4 7-4Z',
    venom:'M8 8c7 1 10 6 10 10 0 4-3 7-8 9 2-4 1-8-2-10-2-2-3-5 0-9Z',
    well:'M7 8h18v5l-7 11h-4L7 13Z',
    grace:'M16 6c6 0 10 4 10 9 0 8-10 11-10 11S6 23 6 15c0-5 4-9 10-9Z',
    frost:'M16 4v24M6 10l20 12M6 22 26 10',
    judgment:'M16 4v22M9 11h14M5 26h22'
  };
  const sigil17=[
    'M6 6h6v6H6Z','M16 4 28 16 16 28 4 16Z','M8 26 16 6l8 20Z','M6 12h20M16 2v28','M7 7l18 18M25 7 7 25',
    'M16 4 24 10v12l-8 6-8-6V10Z','M8 8h16v16H8Z','M16 4l5 8-5 8-5-8Z'
  ];
  function hash17(t){ let h=0; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))>>>0; return h; }
  function overlaySvg17(uri,it){
    try{
      const idx=uri.indexOf(','); if(idx<0) return uri;
      const head=uri.slice(0,idx+1), body=decodeURIComponent(uri.slice(idx+1));
      if(!/</.test(body)) return uri;
      const h=hash17(`${it.name}|${it.slot}|${it.vocation||''}|${it.tier||0}`), sig=sigil17[h%sigil17.length], col=COLOR16[(it.tier??0)-3]||RARITIES[it.rarity??0][1]||'#d6bc85';
      const perk=it.perk&&perkGlyph17[it.perk]?`<path d="${perkGlyph17[it.perk]}" fill="none" stroke="${RARITIES[it.rarity??0][1]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`:'';
      const vocationFill={war:'#725c53',ranger:'#54684a',mage:'#5a4a74',cleric:'#807156'}[it.vocation||state.cls]||'#5f5661';
      const extra=`<path d="M2 2h28v28H2Z" fill="none" stroke="${col}" stroke-opacity=".35"/><circle cx="25" cy="7" r="4.1" fill="#111319" stroke="${col}" stroke-width="1"/><path d="${sig}" fill="none" stroke="${col}" stroke-width="1.6" transform="translate(17 -1) scale(.42)" stroke-linecap="round" stroke-linejoin="round"/><rect x="3.5" y="24" width="9" height="4.5" rx="1" fill="${vocationFill}" stroke="#c5b28f" stroke-width=".8"/>${perk}`;
      return head+encodeURIComponent(body.replace('</svg>',extra+'</svg>'));
    }catch(err){ return uri; }
  }
  itemIcon=function(it){ return it && it.name ? overlaySvg17(itemIcon17base(it),it) : itemIcon17base(it); };

  /* Sprites exclusivas para os novos monstros e bosses da expansão. */
  const MON17={
    3:{main:'#5d7a4e',mid:'#88a563',lite:'#d8edb8',dark:'#2a2f29',accent:'#7db36f'},
    4:{main:'#88b7c8',mid:'#b8d8e4',lite:'#eefcff',dark:'#27343b',accent:'#9ee7ff'},
    5:{main:'#c1bea9',mid:'#e2d4be',lite:'#fff7e5',dark:'#403730',accent:'#d0c28d'},
    6:{main:'#6b707a',mid:'#9da5b3',lite:'#e8edf8',dark:'#252932',accent:'#be6962'},
    7:{main:'#a55d3d',mid:'#d98a5a',lite:'#ffd8a3',dark:'#341d19',accent:'#ff9a4d'},
    8:{main:'#8b7397',mid:'#b69fd0',lite:'#f3e9ff',dark:'#251c2d',accent:'#b17ad9'},
    9:{main:'#474d5f',mid:'#717998',lite:'#dde2ff',dark:'#13161e',accent:'#8a58c8'}
  };
  function mpx17(c,x,y,w,h,col){ r17(c,x,y,w,h,col); }
  function beast17(c,p,s){
    mpx17(c,-8*s,-2*s,12*s,8*s,p.main); mpx17(c,3*s,-1*s,7*s,6*s,p.mid); mpx17(c,-11*s,3*s,4*s,3*s,p.dark); mpx17(c,-5*s,6*s,3*s,5*s,p.dark); mpx17(c,3*s,6*s,3*s,5*s,p.dark); mpx17(c,8*s,6*s,3*s,5*s,p.dark); mpx17(c,8*s,-5*s,2*s,4*s,p.dark); mpx17(c,5*s,-5*s,2*s,4*s,p.dark); mpx17(c,9*s,0,2*s,2*s,p.lite); mpx17(c,-8*s,0,2*s,2*s,p.accent);
    line17(c,p.lite,1,[[-2*s,-3*s],[1*s,-7*s],[4*s,-3*s]]);
  }
  function ooze17(c,p,s){
    poly17(c,p.main,[[-8*s,7*s],[-10*s,2*s],[-8*s,-3*s],[-4*s,-6*s],[3*s,-7*s],[8*s,-4*s],[10*s,0],[8*s,7*s]],p.dark); mpx17(c,-4*s,-1*s,2*s,2*s,p.lite); mpx17(c,2*s,-1*s,2*s,2*s,p.lite); mpx17(c,-6*s,7*s,2*s,2*s,p.accent); mpx17(c,5*s,6*s,2*s,2*s,p.accent);
  }
  function spider17(c,p,s){
    oval17(c,0,0,7*s,6*s,p.main); oval17(c,7*s,0,5*s,4*s,p.mid); mpx17(c,8*s,-1*s,1.5*s,1.5*s,p.lite); mpx17(c,10*s,-1*s,1.5*s,1.5*s,p.lite);
    [[-6,-6],[-9,-2],[-9,3],[-6,7],[3,-7],[0,-9],[-1,9],[4,7]].forEach((a,i)=>line17(c,p.dark,1.5,[[0,0],[a[0]*s,a[1]*s]]));
  }
  function cult17(c,p,s){
    mpx17(c,-4*s,-9*s,8*s,5*s,p.mid); mpx17(c,-7*s,-4*s,14*s,12*s,p.main); mpx17(c,-9*s,8*s,5*s,9*s,p.dark); mpx17(c,4*s,8*s,5*s,9*s,p.dark); mpx17(c,-2*s,-7*s,1.5*s,1.5*s,p.dark); mpx17(c,1*s,-7*s,1.5*s,1.5*s,p.dark); mpx17(c,-10*s,0,3*s,9*s,p.dark); mpx17(c,7*s,0,3*s,9*s,p.dark); line17(c,p.accent,1,[[-5*s,2*s],[5*s,2*s]]);
  }
  function brute17(c,p,s){
    mpx17(c,-8*s,-10*s,16*s,6*s,p.mid); mpx17(c,-11*s,-4*s,22*s,14*s,p.main); mpx17(c,-12*s,10*s,7*s,10*s,p.dark); mpx17(c,5*s,10*s,7*s,10*s,p.dark); mpx17(c,-15*s,-1*s,4*s,12*s,p.dark); mpx17(c,11*s,-1*s,4*s,12*s,p.dark); mpx17(c,-3*s,-8*s,2*s,2*s,p.dark); mpx17(c,1*s,-8*s,2*s,2*s,p.dark); mpx17(c,-6*s,-14*s,12*s,3*s,p.accent);
  }
  function spirit17(c,p,s){
    poly17(c,p.main,[[-7*s,-10*s],[0,-13*s],[7*s,-10*s],[10*s,0],[8*s,10*s],[0,16*s],[-8*s,10*s],[-10*s,0]],null); c.globalAlpha=.35; oval17(c,0,3*s,7*s,11*s,p.lite); c.globalAlpha=1; mpx17(c,-3*s,-3*s,2*s,2*s,p.lite); mpx17(c,1*s,-3*s,2*s,2*s,p.lite); line17(c,p.accent,1,[[-2*s,4*s],[2*s,4*s]]);
  }
  function renderMonster17(c,id,x,y,s,flash){
    const m=/^t(\d)m(\d)$/.exec(id); if(!m) return false; const z=+m[1], i=+m[2], p=MON17[z]||MON17[3];
    c.save(); c.translate(x,y); if(flash) c.globalAlpha=.9; oval17(c,0,13*s,11*s,3*s,'#0007');
    if(z===3){ [ooze17,beast17,spider17,brute17,cult17][i](c,p,s); }
    else if(z===4){ [ooze17,beast17,spider17,brute17,spirit17][i](c,p,s); }
    else if(z===5){ [spider17,beast17,cult17,brute17,spirit17][i](c,p,s); }
    else if(z===6){ [cult17,beast17,cult17,brute17,cult17][i](c,p,s); }
    else if(z===7){ [ooze17,beast17,cult17,brute17,spider17][i](c,p,s); }
    else if(z===8){ [spirit17,beast17,cult17,brute17,spirit17][i](c,p,s); }
    else { [ooze17,beast17,spider17,brute17,cult17][i](c,p,s); }
    mpx17(c,-9*s,-15*s,5*s,2*s,p.accent); c.restore(); return true;
  }
  const creature17base=creature;
  creature=function(c,id,x,y,s=1,flash=false){ if(renderMonster17(c,id,x,y,s,flash)) return; return creature17base(c,id,x,y,s,flash); };
  const boss17base=drawBoss;
  drawBoss=function(c,x,y,z,flash){
    if(z<3) return boss17base(c,x,y,z,flash);
    const p=MON17[z]||MON17[9], s=2.2;
    c.save(); c.translate(x,y); if(flash) c.globalAlpha=.9; oval17(c,0,22,21,5,'#0008');
    if(z===3){ brute17(c,p,s); line17(c,p.accent,2,[[-18,-6],[18,-6],[-18,7],[18,7]]); }
    else if(z===4){ spirit17(c,p,s*1.05); line17(c,p.lite,2,[[-14,-16],[0,-24],[14,-16]]); }
    else if(z===5){ cult17(c,p,s); mpx17(c,-16,-18,32,5,p.accent); }
    else if(z===6){ brute17(c,p,s); mpx17(c,-20,-2,6,18,p.accent); mpx17(c,14,-2,6,18,p.accent); }
    else if(z===7){ brute17(c,p,s); line17(c,p.accent,2,[[-20,-20],[0,-30],[20,-20]]); }
    else if(z===8){ spirit17(c,p,s*1.1); mpx17(c,-18,-18,36,4,p.accent); }
    else { cult17(c,p,s); spirit17(c,p,.8); mpx17(c,-18,-21,36,4,p.accent); }
    c.restore();
  };

  /* Música, ambiência e efeitos mais sombrios. */
  const ROOT17=[45,43,41,39,37,35,33,32,30,28];
  const MOTIF17=[
    [0,3,7,5,3,2,0,-2],[0,1,3,5,1,0,-2,0],[0,3,5,6,3,1,0,-2],[0,2,3,5,2,0,-2,-4],
    [0,1,4,6,4,1,0,-3],[0,3,1,5,3,1,-1,-3],[0,2,5,3,1,0,-2,-5],[0,1,4,7,4,1,-2,-4],[0,3,6,3,0,-2,-4,-5],[0,2,5,1,-1,-4,-2,0]
  ];
  audioTick11=function(){
    if(!audioReady11()||!state.cls) return;
    const now=audio10.currentTime, z=Math.max(0,Math.min(9,state.zone)), boss=state.mode==='boss'||state.mode==='trial'||(state.mode==='dungeon'&&state.wave===4), crypt=state.mode==='dungeon'&&!boss, city=state.mode==='city';
    const scene=city?'city':boss?'boss'+z:crypt?'crypt'+z:'land'+z;
    if(scene!==audioScene11){ audioScene11=scene; audioStep11=0; audioNext11=now; audioAmbientNext11=now; }
    const root=city?46:(ROOT17[z]||38), motif=city?[0,2,3,7,5,3,2,0,-2,0]:(boss?[0,0,3,5,1,0,6,3,1,-2]:crypt?[0,1,0,4,3,1,0,-2]:MOTIF17[z]||MOTIF17[0]), tempo=city?2.5:(boss?.62:crypt?2.25:2.75);
    if(now>=audioNext11){
      const step=audioStep11++, note=root+motif[step%motif.length];
      pad16(root-12,tempo*4.8,boss?.055:.04); pad16(root-5,tempo*3.2,.018);
      soundNote11('music',audioFreq11(note+12),boss?1.25:1.8,boss?.032:.024,boss?'triangle':'sine',audioFreq11(note+12),.14);
      if(step%2===0) soundNote11('music',audioFreq11(note+19),boss?.9:1.4,boss?.018:.012,'sine',audioFreq11(note+7),.22);
      if(step%4===0) soundNote11('music',audioFreq11(root+7),tempo*2.4,.012,'sine',audioFreq11(root+7),.18);
      if(boss){ soundNoise11('music',.24,.11,95,'lowpass'); soundNote11('music',58,.18,.12,'triangle',28); }
      audioNext11=now+tempo;
    }
    if(now>=audioAmbientNext11){
      if(city){ soundNoise11('ambient',2.7,.045,380,'lowpass'); soundNote11('ambient',audioFreq11(57),2.5,.02,'sine',audioFreq11(69),.2); }
      else if(boss){ soundNoise11('ambient',2.2,.085,80,'lowpass'); soundNote11('ambient',42,1.8,.07,'triangle',28); }
      else if(crypt){ soundNoise11('ambient',3.8,.06,180,'lowpass'); soundNote11('ambient',220,.45,.012,'sine',140,.7); }
      else {
        const amb=[480,360,250,210,150,120,105,98,90,80][z]||180;
        soundNoise11('ambient',3.7,.06,amb,'lowpass');
        soundNote11('ambient',110-4*z,.7,.016,'triangle',65,.4);
        if(z>=5) soundNote11('ambient',420-22*z,.35,.007,'sine',180,.9);
      }
      audioAmbientNext11=now+3.2+Math.random()*1.8;
    }
  };
  const tone17base=tone10;
  tone10=function(kind){
    tone17base(kind);
    if(['burn','bleed','stun','hit'].includes(kind)) soundNoise11('fx',.18,.08,900,'bandpass',.55);
    if(['holy','freeze','shock','arcane'].includes(kind)) soundNote11('fx',kind==='holy'?880:720,.22,.03,'sine',kind==='freeze'?420:260,.18);
    if(kind==='poison') soundNote11('fx',180,.35,.025,'triangle',90,.12);
  };

  /* Finalização visual em painéis de profissão e estado. */
  const prof17base=profPanel10;
  profPanel10=function(){
    return prof17base().replace('Maestria de coleta · recursos para forja e fabricação','Maestria de ofícios · especialização persistente, recursos raros e receitas avançadas');
  };

  installPersistence17();
  if(state.cls){ render(); save(); }
})();
