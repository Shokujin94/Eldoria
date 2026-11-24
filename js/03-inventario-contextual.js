
/* 0.18 — Inventário contextual + sprites reais de itens e monstros */
(function(){
  const css=document.createElement('style');
  css.textContent=`
  .stock19-slot,.bag-slot.filled{position:relative;overflow:visible}
  .stock19-slot.active,.bag-slot.filled.selected{box-shadow:0 0 0 1px var(--rar,#d2b47b),0 0 20px #000 inset,0 0 16px color-mix(in srgb,var(--rar,#d2b47b) 35%, transparent)}
  .inv18-actions{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);display:flex;gap:6px;align-items:center;padding:5px 6px;border:1px solid #84663e;border-radius:10px;background:linear-gradient(180deg,rgba(18,17,20,.96),rgba(8,8,10,.96));box-shadow:0 10px 20px rgba(0,0,0,.45);z-index:6}
  .inv18-actions button{min-width:auto;padding:6px 9px;font-size:11px;line-height:1;border-radius:8px;background:linear-gradient(180deg,#24202a,#121116);border:1px solid #9e7c47;color:#ead6ab}
  .inv18-actions button:disabled{opacity:.45}
  .inv18-actions .sell{color:#d7bf8a}
  .inv18-actions .remove{color:#d9c8ae}
  .stock19-head p{max-width:52ch}
  .stock19-grid{overflow:visible}
  .bag-grid{overflow:visible}
  .stock19-slot .stock19-name{padding-bottom:2px}
  `;
  document.head.append(css);

  function esc18(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
  function reqOk18(it){ try{return canEquip(it);}catch(e){return true;} }


  const render18base=renderRefined;
  renderRefined=function(t){
    if(t!=='bag' || bagTab19!=='equip') return render18base(t);
    bagCounts19();
    const el=$('content-bag'), all=state.inventory;
    const list=all.filter(it=>window.eldoria26BagMatch(it)&&(bagFilter==='all'||it.slot===bagFilter)&&(equipRar16==='all'||it.rarity===+equipRar16)&&it.name.toLowerCase().includes(equipSearch16.toLowerCase()));
    const h=`<div class="stock19-head"><div><h3>Equipamentos</h3><p>Selecione uma peça para ver as ações no próprio item. Os atributos continuam no tooltip ao passar o mouse.</p></div><b>${all.length}/120</b></div>
    <div class="stock19-tools"><input type="search" id="equipSearch16" placeholder="Buscar equipamento" value="${esc18(equipSearch16)}"><select id="equipRar16"><option value="all">Todas as raridades</option>${RARITIES.map((r,i)=>`<option value="${i}" ${equipRar16===String(i)?'selected':''}>${r[0]}</option>`).join('')}</select><select id="equipType16"><option value="all">Todos os tipos</option>${Object.entries(SLOTS).map(([k,n])=>`<option value="${k}" ${bagFilter===k?'selected':''}>${n}</option>`).join('')}</select>${window.eldoria26BagControls()}</div>
    ${RARITIES.map((r,i)=>{const rows=list.filter(it=>it.rarity===i);return rows.length?`<section class="stock19-group" style="--rar:${r[1]}"><h4>${rarMarks19[i]} ${r[0]} <small>${rows.length} peças</small></h4><div class="stock19-grid">${rows.map(it=>`<button class="stock19-slot ${selectedItem===it.id?'active':''}" data-itemid="${it.id}" style="--rar:${r[1]}" aria-label="${esc18(it.name)}"><span class="stock19-mark">${rarMarks19[i]}</span><img src="${itemIcon(it)}" alt=""><span class="stock19-count">${state.equipment[it.slot]===it.id?'E':it.upgrade?'+'+it.upgrade:''}</span>${socketDots(it)}<span class="stock19-name">${it.name}</span></button>`).join('')}</div></section>`:'';}).reverse().join('')||'<div class="stock19-empty">Nenhum item nesta seleção.</div>'}
    <p class="muted">${120-all.length} espaços livres · materiais e runas não ocupam estes espaços.</p>`;
    if(el._markup!==h){
      const f=document.activeElement,keep=f?.id==='equipSearch16',pos=keep?f.selectionStart:null;
      el.innerHTML=h;el._markup=h;
      if(keep){const n=$('equipSearch16');n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}}
    }
  };

  /* Ícones de itens redesenhados com silhuetas reais por família. */
  const runeMark18={common:'#bfc5bd',uncommon:'#79c58c',rare:'#79aef5',epic:'#c293ee',legend:'#edc36c'};
  function svg18(body){return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">${body}</svg>`)}
  function palette18(it){
    const rar=(it?.rarity??0), tier=Math.max(0,it?.tier??0);
    const metal=['#b9babf','#8fb899','#87a8c8','#a98ed1','#d6b06a'][rar]||'#b9babf';
    const trim=['#73675f','#5e755a','#4a6986','#654f84','#8f6b3c'][rar]||'#73675f';
    const leather=['#8d6b45','#7d6243','#6d5640','#8b5c54','#85583c'][tier%5];
    const cloth=['#615d69','#56675b','#4f5f71','#695a7b','#78634d'][((it?.quality??0)+tier)%5];
    const glow=['#f5f1e7','#c6f0cf','#d8ecff','#ecd8ff','#fff2bf'][rar]||'#f5f1e7';
    return {metal,trim,leather,cloth,glow,dark:'#18191d'};
  }
  function weaponType18(n){
    n=n.toLowerCase();
    if(/arco|besta/.test(n)) return 'bow';
    if(/cajado|cetro/.test(n)) return 'staff';
    if(/grimóri|grimori|tomo|livro/.test(n)) return 'tome';
    if(/machado/.test(n)) return 'axe';
    if(/maça|maca|martelo/.test(n)) return 'mace';
    if(/lança|lanca|alabarda/.test(n)) return 'spear';
    if(/adaga|punhal/.test(n)) return 'dagger';
    return 'sword';
  }
  function offhandType18(n){
    n=n.toLowerCase();
    if(/escudo/.test(n)) return 'shield';
    if(/aljava/.test(n)) return 'quiver';
    if(/orbe/.test(n)) return 'orb';
    if(/relic|grimóri|grimori|tomo/.test(n)) return 'relic';
    return 'shield';
  }
  function slotVariant18(it){
    const n=(it?.name||'').toLowerCase();
    if(it.slot==='weapon') return weaponType18(n);
    if(it.slot==='offhand') return offhandType18(n);
    if(it.slot==='head') return /capuz|coroa|mitra/.test(n)?'hood':'helm';
    if(it.slot==='armor') return /manto|veste|túnica|tunica/.test(n)?'robe':'chest';
    if(it.slot==='hands') return /braç|brac/.test(n)?'bracer':'glove';
    if(it.slot==='legs') return /saia|calça leve|perneira/.test(n)?'leggings':'greaves';
    if(it.slot==='feet') return /sandália|sandalia/.test(n)?'sandal':'boot';
    if(it.slot==='accessory') return /amuleto|talismã|talismã|pendente|relicário/.test(n)?'amulet':'charm';
    if(it.slot==='ring') return 'ring';
    return it.slot;
  }
  function bg18(it,p){
    const tier=Math.max(0,it?.tier??0), rar=RARITIES[it?.rarity??0]?.[1]||'#bfc5bd';
    return `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1015"/><stop offset="1" stop-color="#171922"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.trim}"/><stop offset="1" stop-color="${p.metal}"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="3" fill="url(#g)" stroke="#574b3a"/><path d="M2 21 21 2h9v9L11 30H2Z" fill="#ffffff08"/><rect x="3" y="3" width="26" height="26" rx="2" fill="none" stroke="${rar}" stroke-opacity=".35"/><rect x="3" y="23" width="7" height="5" rx="1" fill="${p.cloth}" stroke="#d0b189" stroke-width=".6"/><path d="M22 4h6l-6 6z" fill="${p.glow}" fill-opacity=".18"/><circle cx="25" cy="7" r="3.2" fill="#0b0c11" stroke="${rar}" stroke-width=".8"/><text x="25" y="8.8" text-anchor="middle" font-size="5.2" font-family="monospace" fill="${rar}">${Math.min(9,tier+1)}</text>`;
  }
  function body18(it,p){
    const v=slotVariant18(it), s=it.slot;
    if(s==='weapon'){
      if(v==='sword') return `<path d="M7 26 12 21l-1-2 2-2 3 3-2 2-2-1-5 5Z" fill="${p.leather}"/><path d="M13 18 23 6l4-1-1 4-10 12Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".6"/><path d="M18 11 24 5" stroke="${p.glow}" stroke-width="1.2"/><path d="M9 17l7 7" stroke="#d7a55c" stroke-width="1.6"/>`;
      if(v==='axe') return `<path d="M10 27 20 8" stroke="${p.leather}" stroke-width="3.2"/><path d="M15 6h10v9H17l-4-4Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".7"/><path d="M23 6v9" stroke="${p.glow}" stroke-width="1"/>`;
      if(v==='mace') return `<path d="M10 27 20 8" stroke="${p.leather}" stroke-width="3"/><circle cx="23" cy="6.5" r="4.8" fill="${p.metal}" stroke="${p.dark}" stroke-width=".7"/><path d="M23 2v9M18.5 6.5h9" stroke="${p.glow}" stroke-width="1"/>`;
      if(v==='staff') return `<path d="M9 28 20 5" stroke="${p.leather}" stroke-width="3.3"/><path d="M20 4 24 1l4 3v6l-4 3-4-3Z" fill="${p.trim}" stroke="${p.dark}" stroke-width=".7"/><circle cx="24" cy="7" r="2.5" fill="${p.glow}"/>`;
      if(v==='tome') return `<path d="M7 7h8c3 0 4 1 5 3 1-2 2-3 5-3h1v17h-1c-3 0-4 1-5 3-1-2-2-3-5-3H7Z" fill="${p.cloth}" stroke="${p.dark}" stroke-width=".8"/><path d="M15 7v17" stroke="#dac7a2" stroke-width="1"/><path d="M10 11h3m-3 4h4m7-4h3m-3 4h4" stroke="${p.glow}" stroke-width=".9"/>`;
      if(v==='bow') return `<path d="M9 5c4 4 5 8 5 11s-1 7-5 11" fill="none" stroke="${p.leather}" stroke-width="2.4"/><path d="M21 5c-4 4-5 8-5 11s1 7 5 11" fill="none" stroke="${p.leather}" stroke-width="2.4"/><path d="M9 5 21 27" stroke="${p.glow}" stroke-width="1"/><path d="M16 14h9" stroke="${p.metal}" stroke-width="1.4"/><path d="M25 14 28 16 25 18" fill="${p.metal}"/>`;
      if(v==='spear') return `<path d="M8 28 22 6" stroke="${p.leather}" stroke-width="2.8"/><path d="M24 3 28 8 22 12 18 7Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".7"/><path d="M20 7 25 3" stroke="${p.glow}" stroke-width="1"/>`;
      return `<path d="M8 27 14 20l-2-2 3-2 3 3-2 3-2-1-6 6Z" fill="${p.leather}"/><path d="M15 17 24 7l4-1-1 4-9 10Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".6"/>`;
    }
    if(s==='offhand'){
      if(v==='shield') return `<path d="M16 4 25 8v8c0 5-4 8-9 12-5-4-9-7-9-12V8Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".8"/><path d="M16 7v18M10 12h12" stroke="${p.trim}" stroke-width="1.2"/>`;
      if(v==='quiver') return `<path d="M10 6h11l2 4-3 17H11L8 10Z" fill="${p.leather}" stroke="${p.dark}" stroke-width=".8"/><path d="M12 10h9" stroke="${p.metal}" stroke-width="1.4"/><path d="M13 10V3m4 7V4m4 6V2" stroke="${p.metal}" stroke-width="1.1"/>`;
      if(v==='orb') return `<circle cx="16" cy="14" r="7" fill="${p.trim}" stroke="${p.dark}" stroke-width=".8"/><circle cx="16" cy="14" r="3.5" fill="${p.glow}"/><path d="M10 23h12l2 4H8Z" fill="${p.leather}"/>`;
      return `<path d="M9 6h14l4 6v11l-4 3H9l-4-3V12Z" fill="${p.cloth}" stroke="${p.dark}" stroke-width=".8"/><path d="M10 10h12M16 6v20" stroke="${p.glow}" stroke-width="1.1"/>`;
    }
    if(s==='head') return v==='hood'
      ? `<path d="M9 11 16 4l7 7v11H9Z" fill="${p.cloth}" stroke="${p.dark}" stroke-width=".8"/><path d="M12 12h8v6h-8z" fill="#ccbca3"/><path d="M10 23h12v4H10z" fill="${p.leather}"/>`
      : `<path d="M8 11 12 5h8l4 6v12H8Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".8"/><path d="M11 12h10v7H11z" fill="#cbb89e"/><path d="M8 10h16" stroke="${p.trim}" stroke-width="1.1"/>`;
    if(s==='armor') return v==='robe'
      ? `<path d="M11 5h10l4 4-2 4-3-1-1 14H9l-1-14-3 1-2-4Z" fill="${p.cloth}" stroke="${p.dark}" stroke-width=".8"/><path d="M16 6v19" stroke="${p.glow}" stroke-width="1"/><path d="M12 23h8" stroke="${p.trim}" stroke-width="1.2"/>`
      : `<path d="M8 5h6l2 3 2-3h6l5 6-4 5-3-2v13H10V14l-3 2-4-5Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".8"/><path d="M13 9h6v18h-6z" fill="${p.cloth}"/><path d="M10 24h12" stroke="${p.trim}" stroke-width="1.2"/>`;
    if(s==='hands') return v==='bracer'
      ? `<path d="M7 10h8l2 5-2 8H7l-2-8Z" fill="${p.leather}" stroke="${p.dark}" stroke-width=".8"/><path d="M17 10h8l2 5-2 8h-8l-2-8Z" fill="${p.leather}" stroke="${p.dark}" stroke-width=".8"/><path d="M9 14h4m8 0h4" stroke="${p.glow}" stroke-width="1"/>`
      : `<path d="M7 11h8l1 12H7Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".8"/><path d="M17 11h8v12h-9Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".8"/><path d="M10 11V7m4 4V7m6 4V7m4 4V7" stroke="${p.trim}" stroke-width="1"/>`;
    if(s==='legs') return v==='leggings'
      ? `<path d="M10 6h12v7l-2 14h-4l-1-7-1 7H10l-2-14z" fill="${p.cloth}" stroke="${p.dark}" stroke-width=".8"/><path d="M16 6v14" stroke="${p.glow}" stroke-width="1"/>`
      : `<path d="M10 5h12l2 7-3 15h-5l-1-10-1 10H9L6 12Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".8"/><path d="M16 5v22" stroke="${p.trim}" stroke-width="1"/>`;
    if(s==='feet') return v==='sandal'
      ? `<path d="M6 20h9v5H6z" fill="${p.leather}" stroke="${p.dark}" stroke-width=".8"/><path d="M17 20h9v5h-9z" fill="${p.leather}" stroke="${p.dark}" stroke-width=".8"/><path d="M8 16h5m8 0h5" stroke="${p.glow}" stroke-width="1"/>`
      : `<path d="M7 9h8v14H5v-8Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".8"/><path d="M17 9h8v14H17Z" fill="${p.metal}" stroke="${p.dark}" stroke-width=".8"/><path d="M5 23h12v4H5zM17 23h10v4H17z" fill="${p.leather}"/>`;
    if(s==='accessory') return v==='amulet'
      ? `<path d="M9 6c0 5 4 7 7 8 3-1 7-3 7-8" fill="none" stroke="#d6c39d" stroke-width="1.1"/><path d="M16 9 23 16 16 24 9 16Z" fill="${p.trim}" stroke="${p.dark}" stroke-width=".8"/><circle cx="16" cy="16" r="3.2" fill="${p.glow}"/>`
      : `<path d="M16 6 23 11v10l-7 5-7-5V11Z" fill="${p.trim}" stroke="${p.dark}" stroke-width=".8"/><path d="M16 10v12M10 16h12" stroke="${p.glow}" stroke-width="1"/>`;
    if(s==='ring') return `<circle cx="16" cy="17" r="7" fill="none" stroke="${p.metal}" stroke-width="4"/><path d="M11 11 16 6l5 5" fill="${p.trim}" stroke="${p.dark}" stroke-width=".7"/><circle cx="16" cy="9.5" r="2.5" fill="${p.glow}"/>`;
    return `<rect x="7" y="7" width="18" height="18" fill="${p.metal}" stroke="${p.dark}"/>`;
  }
  const baseItem18=itemIcon;
  itemIcon=function(it){
    if(!it||!it.slot) return baseItem18(it);
    const p=palette18(it);
    const body=bg18(it,p)+body18(it,p)+(it.perk?`<path d="M5 6h4v4H5Z" fill="${p.glow}" stroke="#0d0d11" stroke-width=".6"/>`:``)+(it.sockets?`<circle cx="26" cy="25" r="1.8" fill="#1b1d24" stroke="${p.glow}" stroke-width=".8"/><text x="26" y="26.6" text-anchor="middle" font-size="3.8" font-family="monospace" fill="${p.glow}">${it.sockets}</text>`:'');
    return svg18(body);
  };

  /* Monstros sem recoloração: silhuetas próprias para cada família. */
  function px18(c,x,y,w,h,f,s){c.fillStyle=f;c.fillRect(x,y,w,h);if(s){c.strokeStyle=s;c.strokeRect(x+.5,y+.5,w-1,h-1)}}
  function shadow18(c,x,y,s){c.fillStyle='#0007';c.fillRect(x-10*s,y+10*s,20*s,4*s)}
  function drawFamily18(c,f,x,y,s,flash){
    c.save(); c.translate(x,y); if(flash) c.globalAlpha=.93; shadow18(c,0,0,s);
    const P={
      slime:['#6a8c58','#9fca7a','#32412c'], wolf:['#6b6f75','#a7a9b0','#27292d'], spider:['#6f5b88','#b59dde','#23192c'], boar:['#7d583f','#b28767','#2a1b16'], wraith:['#48556d','#c1d2ff','#151821'],
      skeleton:['#c7bea9','#efe5d2','#554d44'], bat:['#65516f','#bda7d9','#1d1622'], cultist:['#6d4c4a','#caa58d','#231919'], golem:['#787264','#c3baa8','#312f2a'], drake:['#7d4d3f','#d59362','#261613'],
      imp:['#6f3b46','#d77a7c','#240f12'], elemental:['#4b6883','#a4ddff','#18242d']
    };
    const [m,l,d]=P[f]||P.wolf;
    const glow=flash?l+'aa':l;
    switch(f){
      case 'slime':
        px18(c,-10*s,-2*s,20*s,10*s,m,d);px18(c,-8*s,-6*s,16*s,5*s,m,d);px18(c,-4*s,-1*s,3*s,2*s,glow);px18(c,2*s,-1*s,3*s,2*s,glow);px18(c,-6*s,8*s,4*s,2*s,l);px18(c,4*s,8*s,3*s,2*s,l);break;
      case 'wolf':
        px18(c,-11*s,-3*s,14*s,7*s,m,d);px18(c,2*s,-4*s,8*s,6*s,m,d);px18(c,9*s,-7*s,2*s,4*s,d);px18(c,6*s,-7*s,2*s,4*s,d);px18(c,-10*s,4*s,3*s,6*s,d);px18(c,-2*s,4*s,3*s,6*s,d);px18(c,5*s,4*s,3*s,6*s,d);px18(c,9*s,4*s,2*s,6*s,d);px18(c,7*s,-1*s,2*s,2*s,glow);px18(c,-13*s,-1*s,3*s,2*s,d);break;
      case 'spider':
        px18(c,-5*s,-4*s,10*s,8*s,m,d);px18(c,4*s,-2*s,6*s,5*s,l,d);[[ -6,-6],[-8,-2],[-8,4],[-6,8],[5,-6],[8,-2],[8,4],[5,8]].forEach(([ax,ay])=>{c.strokeStyle=d;c.lineWidth=1.6*s;c.beginPath();c.moveTo(0,0);c.lineTo(ax*s,ay*s);c.stroke();});px18(c,6*s,-1*s,1.5*s,1.5*s,glow);px18(c,8*s,-1*s,1.5*s,1.5*s,glow);break;
      case 'boar':
        px18(c,-10*s,-2*s,17*s,9*s,m,d);px18(c,5*s,-1*s,6*s,5*s,m,d);px18(c,10*s,1*s,2*s,2*s,glow);px18(c,7*s,2*s,2*s,2*s,'#e7d7bf');px18(c,-8*s,7*s,3*s,5*s,d);px18(c,-1*s,7*s,3*s,5*s,d);px18(c,5*s,7*s,3*s,5*s,d);break;
      case 'wraith':
        px18(c,-8*s,-9*s,16*s,18*s,m,d);px18(c,-6*s,-12*s,12*s,5*s,l,d);px18(c,-3*s,-4*s,2*s,2*s,glow);px18(c,1*s,-4*s,2*s,2*s,glow);[[ -8,9],[-4,12],[0,10],[4,12],[8,9]].forEach(([ax,ay])=>px18(c,ax*s,ay*s,2*s,4*s,m));break;
      case 'skeleton':
        px18(c,-5*s,-10*s,10*s,6*s,'#ddd4bf',d);px18(c,-8*s,-3*s,16*s,12*s,m,d);px18(c,-3*s,-8*s,2*s,2*s,d);px18(c,1*s,-8*s,2*s,2*s,d);px18(c,-9*s,1*s,3*s,9*s,d);px18(c,6*s,1*s,3*s,9*s,d);px18(c,-5*s,9*s,4*s,8*s,d);px18(c,1*s,9*s,4*s,8*s,d);break;
      case 'bat':
        px18(c,-3*s,-3*s,6*s,6*s,m,d);px18(c,-13*s,-5*s,9*s,5*s,m,d);px18(c,4*s,-5*s,9*s,5*s,m,d);px18(c,-16*s,-2*s,13*s,4*s,m);px18(c,3*s,-2*s,13*s,4*s,m);px18(c,-1*s,-1*s,1.5*s,1.5*s,glow);px18(c,1*s,-1*s,1.5*s,1.5*s,glow);break;
      case 'cultist':
        px18(c,-4*s,-10*s,8*s,5*s,'#d2c2ab',d);px18(c,-8*s,-5*s,16*s,16*s,m,d);px18(c,-10*s,0,3*s,8*s,d);px18(c,7*s,0,3*s,8*s,d);px18(c,-5*s,11*s,4*s,8*s,d);px18(c,1*s,11*s,4*s,8*s,d);px18(c,-6*s,-1*s,12*s,2*s,l);break;
      case 'golem':
        px18(c,-9*s,-11*s,18*s,8*s,m,d);px18(c,-12*s,-3*s,24*s,13*s,m,d);px18(c,-14*s,1*s,4*s,10*s,d);px18(c,10*s,1*s,4*s,10*s,d);px18(c,-9*s,10*s,6*s,10*s,d);px18(c,3*s,10*s,6*s,10*s,d);px18(c,-4*s,-7*s,3*s,2*s,glow);px18(c,1*s,-7*s,3*s,2*s,glow);break;
      case 'drake':
        px18(c,-10*s,-5*s,14*s,10*s,m,d);px18(c,3*s,-8*s,7*s,7*s,m,d);px18(c,9*s,-7*s,3*s,2*s,glow);px18(c,-13*s,-1*s,4*s,3*s,d);px18(c,-4*s,5*s,3*s,7*s,d);px18(c,3*s,5*s,3*s,7*s,d);c.strokeStyle=d;c.lineWidth=1.5*s;c.beginPath();c.moveTo(-6*s,-5*s);c.lineTo(-1*s,-12*s);c.lineTo(4*s,-5*s);c.stroke();break;
      case 'imp':
        px18(c,-5*s,-9*s,10*s,6*s,m,d);px18(c,-8*s,-3*s,16*s,12*s,m,d);px18(c,-6*s,-12*s,4*s,5*s,d);px18(c,2*s,-12*s,4*s,5*s,d);px18(c,-3*s,-7*s,2*s,2*s,glow);px18(c,1*s,-7*s,2*s,2*s,glow);px18(c,-10*s,1*s,3*s,7*s,d);px18(c,7*s,1*s,3*s,7*s,d);px18(c,-4*s,9*s,3*s,8*s,d);px18(c,1*s,9*s,3*s,8*s,d);break;
      case 'elemental':
        px18(c,-7*s,-10*s,14*s,18*s,m,d);px18(c,-4*s,-14*s,8*s,5*s,l,d);px18(c,-2*s,-5*s,2*s,2*s,glow);px18(c,1*s,-5*s,2*s,2*s,glow);for(let i=0;i<5;i++)px18(c,(-8+i*4)*s,(8+(i%2)*3)*s,2*s,4*s,m);break;
    }
    c.restore();
  }
  const family18=id=>/^t\d+m\d$/.test(id)?(ALIAS16[id]||'wolf'):id;
  creature=function(c,id,x,y,s=1,flash=false){drawFamily18(c,family18(id),x,y,s,flash)};
  drawBoss=function(c,x,y,z,flash=false){const fam=['boar','skeleton','drake','golem','wraith','cultist','golem','drake','wraith','elemental'][z]||'golem';drawFamily18(c,fam,x,y,2.1,flash);c.save();c.translate(x,y);c.strokeStyle=['#c3a06a','#9ec17a','#cf7b6d','#90adc8','#c4b1db','#c3a06a','#d59f61','#bb8dc8','#90adc8','#d4c09a'][z]||'#d0b07a';c.lineWidth=2;c.strokeRect(-20,-22,40,4);c.restore();};
})();
