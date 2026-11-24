/* Edite apenas este arquivo para ajustes usuais; preserve IDs de saves.
 * Consulte docs/CATALOGO.json para chaves e números atuais. */
window.ELDORIA_CONFIG = {
  versao: '0.46.9',
  onlineApi: '', // URL HTTPS do servidor; vazio bloqueia o modo online.
  balance: {xpRequired:1, damage:1, enemyDamage:1, gold:1, loot:1},
  visual: {mapDprMax:2.5, servantScale:0.86, bodySpacing:1},
  // Exemplo: wolf: {hp:42, atk:5, xp:12, gold:8, name:'Lobo da noite'}
  enemies: {},
  // Exemplo: mage: {x: {name:'Chama do exílio', mana:9, cd:5, power:1.2}}
  skills: {},
  // ID de passiva: {value:0.03, desc:"+3% por graduação"}
  passives: {},
  // Exemplo: war: [{id:"custom_talho", name:"Talho da Vigília", branch:0, level:12, mana:8, cd:6, power:1.3, effects:["bleed"], element:"bleed"}]
  newSkills: {},
  // Exemplo: war: {base:{str:8, dex:3, int:2, vit:7, wis:0}}
  classes: {},
  // Índice de região (0 a 9): {name:'Novo nome'}
  regions: {},
  // Nome atual completo: 'Novo nome' (o ícone original é preservado).
  itemNames: {},
  // Chave city, zone0..zone9, crypt0..crypt9: caminho para imagem alternativa.
  maps: {}
};
