// Catalogue port from 0.45.0. Server-only round simulation; positional combat is approximate.
import balance from '../js/49-modelo.js';
import {affinities} from './equipment.mjs';
const SKILLS={
 war:[['x','Corte devastador','⚔',12,4,1.25,0,0],['y','Muralha de aço','⛨',10,7,.75,0,1],['z','Ruptura','✸',16,5,1.5,0,0]],
 ranger:[['x','Chuva de flechas','➶',12,4,1.25,0,0],['y','Passo furtivo','☾',10,7,.75,0,1],['z','Flecha perfurante','➳',16,5,1.5,0,0]],
 mage:[['x','Bola de fogo','✹',16,4,1.35,0,0],['y','Barreira glacial','❄',12,7,.75,0,1],['z','Ruptura arcana','✦',20,5,1.65,0,0]],
 cleric:[['x','Julgamento','☀',14,4,1.25,0,0],['y','Luz restauradora','✚',15,7,.65,.20,0],['z','Égide divina','⛨',16,5,1.05,.08,1]]
};
const SKILL_EFFECTS={war:{x:['bleed'],y:['stun'],z:['expose']},ranger:{x:['poison'],y:['slow'],z:['bleed','expose']},mage:{x:['burn'],y:['freeze','slow'],z:['shock']},cleric:{x:['expose'],y:[],z:['stun','shock']}};
const ASC12={war:[['Berserker','bleed','Sede de batalha','dmg',.04,'Carnificina','bleed',.12,'Fúria sem fim','critMult',.08,'Dilaceração',15,7,1.5,0,0,['bleed']],['Guardião','physical','Couraça eterna','reduction',.025,'Guarda inabalável','h',.05,'Aço temperado','def',1.5,'Impacto do bastião',12,8,.95,0,1,['stun']],['Mestre de Armas','physical','Fio perfeito','crit',.02,'Mão do duelista','critMult',.08,'Cadência marcial','haste',.025,'Corte da sentença',16,6,1.55,0,0,['expose']]],ranger:[['Atirador','physical','Olho infalível','crit',.02,'Ponta devastadora','critMult',.08,'Tensão do arco','dmg',.04,'Flecha do carrasco',15,7,1.6,0,0,['expose']],['Patrulheiro','poison','Passo silencioso','dodge',.025,'Toxina silvestre','poison',.12,'Reflexos da mata','haste',.025,'Flecha tóxica',13,7,1.15,0,0,['poison','slow']],['Caçador','physical','Instinto de caça','dmg',.04,'Armadilha predatória','slow',1,'Presa marcada','elite',.06,'Marca do algoz',16,8,1.4,0,0,['expose','slow']]],mage:[['Piromante','fire','Piroclastia','special',.05,'Brasas eternas','burn',.12,'Calor interior','regen',.35,'Inferno profano',22,8,1.65,0,0,['burn']],['Criomante','ice','Sangue glacial','reduction',.025,'Inverno eterno','slow',1,'Cristalização','h',.05,'Lança do inverno',18,8,1.25,0,0,['freeze','slow']],['Arcanista','arcane','Foco do vazio','special',.05,'Fonte de éter','regen',.35,'Ressonância','mana',6,'Colapso do éter',20,7,1.6,0,0,['shock','expose']]],cleric:[['Inquisidor','holy','Fé implacável','dmg',.04,'Marca da penitência','expose',1,'Fulgor divino','special',.05,'Sentença sagrada',18,8,1.5,0,0,['expose','burn']],['Templário','holy','Juramento de ferro','reduction',.025,'Sangue do mártir','h',.05,'Égide eterna','def',1.5,'Escudo da absolvição',16,8,1,.08,1,['stun']],['Curandeiro','holy','Graça renovada','heal',.04,'Fonte de fé','regen',.35,'Vigília eterna','mana',6,'Milagre da vigília',20,9,.8,.23,0,[]]]};
const EXTRA13={
 war:[['s13a','Talho do carrasco','bleed',13,7,1.65,['bleed'],null,6,'x'],['s13b','Quebra-guarda','physical',10,9,.85,['stun','expose'],null,9,'y'],['s13c','Brado de guerra','physical',12,20,0,[],['dmg',.10,7],12,'z']],
 ranger:[['s13a','Disparo serrilhado','bleed',12,7,1.45,['bleed'],null,6,'x'],['s13b','Armadilha de espinhos','poison',11,10,.85,['slow','poison'],null,9,'y'],['s13c','Foco do predador','physical',12,20,0,[],['crit',.06,7],12,'z']],
 mage:[['s13a','Cometa incandescente','fire',20,8,1.75,['burn'],null,6,'x'],['s13b','Prisão de gelo','ice',15,10,.85,['freeze','slow'],null,9,'y'],['s13c','Canalização do éter','arcane',10,22,0,[],['regen',1.2,8],12,'z']],
 cleric:[['s13a','Chama penitente','holy',16,8,1.5,['burn'],null,6,'x'],['s13b','Selo da condenação','holy',12,10,.85,['expose','shock'],null,9,'y'],['s13c','Oração da vigília','holy',12,22,0,[],['reduction',.10,8],12,'z']]
};
const MORE16={war:[['Corte de ferro','physical',1.25,['expose']],['Investida brutal','physical',1.2,['stun']],['Manto de sangue','bleed',1.65,['bleed']],['Baluarte','physical',0,[],['reduction',.12,8]],['Fúria do aço','physical',0,[],['dmg',.14,8]],['Sentença do carrasco','physical',2.05,['expose']],['Ruptura carmesim','bleed',1.9,['bleed','slow']],['Fortaleza de ferro','physical',0,[],['reduction',.16,7]]],ranger:[['Flecha farpada','physical',1.25,['bleed']],['Disparo debilitante','poison',1.15,['slow']],['Víbora da mata','poison',1.6,['poison']],['Olho da noite','physical',0,[],['crit',.08,8]],['Tiro de precisão','physical',1.8,['expose']],['Flecha glacial','ice',1.55,['freeze']],['Flecha do eclipse','physical',2.1,['expose','bleed']],['Instinto de fuga','physical',0,[],['reduction',.1,8]]],mage:[['Faísca arcana','arcane',1.3,['shock']],['Estilhaço glacial','ice',1.2,['slow']],['Fornalha','fire',1.8,['burn']],['Fonte do vazio','arcane',0,[],['regen',1.5,8]],['Raio de Nhal','shock',1.65,['shock']],['Orbe do inverno','ice',1.8,['freeze']],['Eclipse arcano','arcane',2.15,['expose']],['Ascensão ígnea','fire',0,[],['dmg',.15,8]]],cleric:[['Luz do julgamento','holy',1.25,['expose']],['Selo de silêncio','holy',1.15,['stun']],['Chama votiva','holy',1.65,['burn']],['Oração de ferro','holy',0,[],['reduction',.12,8]],['Fonte da graça','holy',0,[],['regen',1.2,9]],['Absolvição','holy',.7,[]],['Veredito eterno','holy',2.05,['expose','shock']],['Voto de misericórdia','holy',0,[],['dmg',.10,8]]]};
const EFFECTS={bleed:['Sangramento','🩸','#d65b65',5,.09],stun:['Atordoamento','✦','#dfb655',2,0],slow:['Lentidão','⌛','#9bb4d0',5,0],expose:['Exposição','◈','#c391e8',6,0],poison:['Veneno','☠','#75b86b',8,.05],burn:['Queimadura','🔥','#ee9150',4,.12],freeze:['Congelamento','❄','#75c9ef',2,0],shock:['Shock','⚡','#b1a1ef',5,0]};
SKILLS.necro=[['x','Dardo ósseo','☠',11,4,1.25,0,0],['y','Drenar essência','✦',16,8,.78,.12,0],['z','Maldição do túmulo','✧',15,6,1.10,0,0],['asc2','Ascensão','✦',15,8,1,0,0]];
SKILL_EFFECTS.necro={x:['bleed'],y:[],z:['poison','expose'],asc2:[]};
ASC12.necro=[['Senhor dos Ossos','dark','Comando da legião','special',.04,'Ossário eterno','h',.04,'Ossos imortais','def',1.2,'Legião da cripta',17,8,1.35,0,1,['slow']],['Tecelão de Maldições','poison','Miasma','poison',.10,'Rito da decadência','expose',1,'Mortalha','regen',.3,'Peste das almas',18,8,1.5,0,0,['poison','expose']],['Ceifador Carmesim','bleed','Sangue usurpado','heal',.035,'Lâmina fúnebre','bleed',.10,'Ceifa perfeita','critMult',.06,'Sacrifício carmesim',16,8,1.42,.07,0,['bleed']]];
EXTRA13.necro=[['s13a','Explosão cadavérica','dark',15,8,1.45,['expose'],null,6,'x'],['s13b','Névoa pestilenta','poison',12,9,1.15,['poison','slow'],null,9,'y'],['s13c','Véu de ossos','dark',12,22,0,[],['reduction',.10,8],12,'z']];
MORE16.necro=[['Estilhaço de crânio','dark',1.25,['bleed']],['Grilhões de ossos','dark',1.15,['slow']],['Sepultura febril','poison',1.6,['poison']],['Carapaça funerária','dark',0,[],['reduction',.12,8]],['Cântico dos mortos','dark',0,[],['regen',1.25,9]],['Ceifa vital','bleed',1.1,['bleed']],['Apocalipse do ossário','dark',1.95,['expose','slow']],['Pacto do vazio','dark',0,[],['dmg',.12,8]]];
const base33={"war": [["Escola do carrasco", "x s160 s13a s165 s166", [["Ferro nas veias", "basic", 0.035, "+3,5% de dano de ataques básicos"], ["Ferida aberta", "bleed", 0.08, "+8% de potência de sangramento"], ["Sentença do aço", "execute", 0.06, "+6% de dano direto contra alvos abaixo de 30% PV"]]], ["Disciplina da muralha", "y s163 s167 s13b", [["Carne de ferro", "hp", 0.035, "+3,5% PV máximo"], ["Placas sobrepostas", "def", 2, "+2 defesa"], ["Escudo de cicatrizes", "guard", 0.025, "+2,5 p.p. de redução de dano enquanto em guarda"]]], ["Ritmo da batalha", "z s161 s162 s164 s13c", [["Passo do veterano", "move", 0.05, "+5% deslocamento de combate"], ["Forja da dor", "hurtEnergy", 3, "+3 Ímpeto ao sofrer dano direto"], ["Ruptura disciplinada", "exposeHit", 0.05, "+5% de dano direto contra alvos expostos"]]]], "ranger": [["Olho do falcão", "x s160 s164 s166 s13a", [["Mira de corvo", "crit", 0.018, "+1,8 p.p. chance crítica"], ["Distância letal", "far", 0.045, "+4,5% de dano direto a partir de 75% do alcance"], ["Flecha cirúrgica", "critDamage", 0.07, "+7 p.p. multiplicador crítico"]]], ["Passos da vigília", "y s163 s167 s13c", [["Pés leves", "move", 0.055, "+5,5% deslocamento em combate"], ["Sombra entre folhas", "dodge", 0.015, "+1,5 p.p. esquiva"], ["Último passo", "nearGuard", 0.045, "−4,5% dano direto recebido a menos de 55% do alcance"]]], ["Toxinas e armadilhas", "z s161 s162 s165 s13b", [["Resina da víbora", "poison", 0.09, "+9% potência de veneno"], ["Rede de espinhos", "slowHit", 0.05, "+5% dano direto contra alvos lentos"], ["Fôlego da caça", "killMana", 0.035, "Recupera 3,5% PM máximo por vitória"]]]], "mage": [["Fornalha dos mártires", "x s162 s167 s13a", [["Brasa interior", "burn", 0.1, "+10% potência de queimadura"], ["Chamas famintas", "burnHit", 0.045, "+4,5% dano de habilidades contra alvos queimando"], ["Cinza concentrada", "spell", 0.035, "+3,5% poder de habilidade"]]], ["Círculo do inverno", "y s161 s165 s13b", [["Cristal protetor", "hp", 0.03, "+3% PV máximo"], ["Manto de geada", "controlGuard", 0.035, "−3,5% dano direto recebido de alvos lentos ou congelados"], ["Fratura glacial", "iceHit", 0.05, "+5% dano direto contra alvos lentos ou congelados"]]], ["Constelação do éter", "z s160 s163 s164 s166 s13c", [["Reservatório arcano", "mana", 0.05, "+5% PM máximo"], ["Canal de éter", "regen", 0.22, "+0,22 PM/s"], ["Rito da economia", "manaCost", 0.05, "−5% custo de mana de habilidades"]]]], "cleric": [["Tribunal da luz", "x s160 s162 s166 s13a", [["Convicção do juiz", "holy", 0.045, "+4,5% dano direto de habilidades sagradas"], ["Marca da penitência", "exposeHit", 0.045, "+4,5% dano direto contra alvos expostos"], ["Dízimo de fé", "castEnergy", 3, "+3 Devoção por habilidade ofensiva que acerta"]]], ["Liturgia da misericórdia", "y s164 s165 s13b", [["Mãos consagradas", "heal", 0.055, "+5,5 p.p. potência de cura"], ["Fonte dos peregrinos", "regen", 0.24, "+0,24 PM/s"], ["Renovação do mártir", "killHeal", 0.025, "Recupera 2,5% PV máximo por vitória"]]], ["Voto de proteção", "z s161 s163 s167 s13c", [["Armadura votiva", "def", 2, "+2 defesa"], ["Corpo sagrado", "hp", 0.04, "+4% PV máximo"], ["Guarda da fé", "guard", 0.025, "+2,5 p.p. redução de dano durante guarda"]]]], "necro": [["Ossuário de comando", "x s160 s161 s166 s13a", [["Ossos consagrados", "servant", 0.025, "+2,5 p.p. potência dos servos"], ["Correntes sepulcrais", "duration", 1, "+1 segundo de duração ao evocar servos"], ["Voz dos mortos", "noServantEnergy", 3, "+3 Almas por acerto sem servos ativos"]]], ["Pacto vital", "y s163 s164 s165 s13c", [["Carne mortuária", "hp", 0.035, "+3,5% PV máximo"], ["Sangue usurpado", "drain", 0.012, "Recupera 1,2% do dano direto causado, em PV"], ["Eco do sacrifício", "killMana", 0.04, "Recupera 4% PM máximo por vitória"]]], ["Livro da decadência", "z s162 s167 s13b", [["Miasma do túmulo", "poison", 0.09, "+9% potência do veneno"], ["Ruína da carne", "curseHit", 0.045, "+4,5% dano direto contra alvos expostos ou envenenados"], ["Oferenda funerária", "killEnergy", 4, "+4 Almas por vitória"]]]]},subs33={"war": [[["Sede do carrasco", "bleed", 0.12, "+12% potência de sangramento"], ["Fúria dos feridos", "lowHit", 0.045, "+4,5% dano direto abaixo de 50% PV"], ["Carnificina", "execute", 0.07, "+7% dano direto contra alvo abaixo de 30% PV"], ["Sangue por aço", "drain", 0.02, "Recupera 2% do dano direto como PV"], ["Último grito", "procHeal", 0.018, "Recupera 1,8% PV ao consumir Ímpeto"]], [["Bastião imortal", "guard", 0.035, "+3,5 p.p. redução durante guarda"], ["Muralha de ferro", "def", 3, "+3 defesa"], ["Corpo da fortaleza", "hp", 0.045, "+4,5% PV máximo"], ["Guarda retaliadora", "hurtEnergy", 4, "+4 Ímpeto ao sofrer dano"], ["Juramento inviolável", "lowGuard", 0.035, "−3,5% dano direto recebido abaixo de 40% PV"]], [["Fio do duelista", "crit", 0.02, "+2 p.p. chance crítica"], ["Cadência perfeita", "haste", 0.025, "+2,5 p.p. chance de ataque extra"], ["Aço preciso", "critDamage", 0.08, "+8 p.p. multiplicador crítico"], ["Contra-ataque", "exposeHit", 0.05, "+5% dano direto contra expostos"], ["Mestre das formas", "basic", 0.05, "+5% dano de ataques básicos"]]], "ranger": [[["Mira de prata", "far", 0.06, "+6% dano direto a partir de 75% do alcance"], ["Pulso imóvel", "crit", 0.02, "+2 p.p. crítico"], ["Ponta de obsidiana", "critDamage", 0.1, "+10 p.p. multiplicador crítico"], ["Respiração contida", "critEnergy", 4, "+4 Foco por acerto crítico"], ["Disparo final", "execute", 0.07, "+7% dano direto contra alvo abaixo de 30% PV"]], [["Toxina ancestral", "poison", 0.12, "+12% potência de veneno"], ["Passo fantasma", "dodge", 0.02, "+2 p.p. esquiva"], ["Trilha corrosiva", "curseHit", 0.055, "+5,5% dano direto contra envenenados ou expostos"], ["Ritmo da mata", "haste", 0.025, "+2,5 p.p. ataque extra"], ["Retirada segura", "nearGuard", 0.055, "−5,5% dano direto recebido a curta distância"]], [["Marca do colosso", "bossHit", 0.055, "+5,5% dano direto contra chefes"], ["Armadilha de tendões", "slowHit", 0.06, "+6% dano direto contra lentos"], ["Presa antiga", "bossGuard", 0.035, "−3,5% dano direto recebido de chefes"], ["Paciência do predador", "farEnergy", 4, "+4 Foco por acerto distante"], ["Troféu de caça", "killEnergy", 5, "+5 Foco por vitória"]]], "mage": [[["Pira eterna", "burn", 0.14, "+14% potência de queimadura"], ["Fogo devorador", "burnHit", 0.06, "+6% dano de habilidades contra queimando"], ["Coração ígneo", "spell", 0.04, "+4% poder de habilidade"], ["Cinzas em retorno", "killMana", 0.04, "Recupera 4% PM por vitória"], ["Erupção final", "execute", 0.06, "+6% dano direto contra alvo abaixo de 30% PV"]], [["Pele cristalina", "hp", 0.04, "+4% PV máximo"], ["Prisão de geada", "iceHit", 0.06, "+6% dano direto contra lentos/congelados"], ["Muralha de inverno", "controlGuard", 0.06, "−6% dano direto recebido de lentos/congelados"], ["Gelo perene", "tenacity", 0.035, "+3,5 p.p. tenacidade"], ["Reserva da nevasca", "lowManaCost", 0.08, "−8% custo de mana abaixo de 35% PM"]], [["Abismo interior", "mana", 0.07, "+7% PM máximo"], ["Condutor do vazio", "regen", 0.32, "+0,32 PM/s"], ["Ressonância elétrica", "shockHit", 0.07, "+7% dano direto contra alvos em shock"], ["Circuito fechado", "procMana", 0.035, "Recupera 3,5% PM ao consumir Éter"], ["Convergência arcana", "castEnergy", 4, "+4 Éter por habilidade ofensiva que acerta"]]], "cleric": [[["Sermão do inquisidor", "holy", 0.06, "+6% dano de habilidades sagradas"], ["Pecado revelado", "exposeHit", 0.06, "+6% dano direto contra expostos"], ["Fogo da penitência", "burn", 0.1, "+10% potência de queimadura"], ["Sangue do mártir", "lowHit", 0.05, "+5% dano direto abaixo de 50% PV"], ["Veredito", "execute", 0.065, "+6,5% dano direto contra alvo abaixo de 30% PV"]], [["Cota da catedral", "def", 3, "+3 defesa"], ["Voto de aço", "guard", 0.035, "+3,5 p.p. redução durante guarda"], ["Escudo da vigília", "bossGuard", 0.04, "−4% dano direto recebido de chefes"], ["Mártir vivo", "hurtEnergy", 4, "+4 Devoção ao sofrer dano direto"], ["Fortaleza sagrada", "hp", 0.05, "+5% PV máximo"]], [["Misericórdia eterna", "heal", 0.06, "+6 p.p. potência de cura"], ["Poço da graça", "regen", 0.32, "+0,32 PM/s"], ["Prece serena", "manaCost", 0.06, "−6% custo de mana de habilidades"], ["Milagre renovado", "procHeal", 0.025, "Recupera 2,5% PV ao consumir Devoção"], ["Vigília dos vivos", "killHeal", 0.035, "Recupera 3,5% PV por vitória"]]], "necro": [[["Comando dos ossos", "servant", 0.035, "+3,5 p.p. potência dos servos"], ["Ossário eterno", "duration", 2, "+2 segundos de duração das novas invocações"], ["Chamado da cripta", "noServantEnergy", 4, "+4 Almas por acerto sem servos"], ["Véu da legião", "servantGuard", 0.045, "−4,5% dano direto recebido com servo ativo"], ["Exército dos mortos", "killEnergy", 5, "+5 Almas por vitória"]], [["Miasma ancestral", "poison", 0.12, "+12% potência de veneno"], ["Peste das ruínas", "curseHit", 0.065, "+6,5% dano direto contra expostos/envenenados"], ["Rito da decadência", "exposeDuration", 1, "+1 segundo de exposição aplicada"], ["Pacto da peste", "servant", 0.025, "+2,5 p.p. potência dos servos"], ["Sepultura ressonante", "castEnergy", 4, "+4 Almas por habilidade ofensiva que acerta"]], [["Ceifa do condenado", "bleed", 0.12, "+12% potência de sangramento"], ["Dreno carmesim", "drain", 0.025, "Recupera 2,5% do dano direto como PV"], ["Lâmina dos moribundos", "execute", 0.065, "+6,5% dano direto contra alvo abaixo de 30% PV"], ["Oferta de sangue", "procHeal", 0.02, "Recupera 2% PV ao consumir Almas"], ["Vida roubada", "lowGuard", 0.045, "−4,5% dano direto recebido abaixo de 40% PV"]]]},active33={"war": {"x": ["bleedHit", 0.12], "z": ["exposeHit", 0.15], "s160": ["exposeHit", 0.12], "s162": ["bleedHit", 0.13], "s165": ["execute", 0.18], "s166": ["bleedHit", 0.15], "asc2": ["sub", 0]}, "ranger": {"x": ["far", 0.15], "z": ["far", 0.12], "s160": ["bleedHit", 0.1], "s162": ["curseHit", 0.15], "s164": ["far", 0.18], "s165": ["slowHit", 0.14], "s166": ["execute", 0.16], "asc2": ["sub", 0]}, "mage": {"x": ["burnHit", 0.14], "z": ["shockHit", 0.14], "s160": ["shockHit", 0.14], "s162": ["burnHit", 0.18], "s164": ["shockHit", 0.18], "s165": ["iceHit", 0.14], "s166": ["highManaHit", 0.16], "asc2": ["sub", 0]}, "cleric": {"x": ["exposeHit", 0.14], "z": ["lowHit", 0.1], "s160": ["exposeHit", 0.15], "s162": ["burnHit", 0.13], "s166": ["execute", 0.16], "asc2": ["sub", 0]}, "necro": {"x": ["servantHit", 0.12], "y": ["lowHit", 0.15], "z": ["curseHit", 0.12], "s13a": ["servantHit", 0.16], "s160": ["bleedHit", 0.12], "s162": ["curseHit", 0.16], "s165": ["lowHit", 0.15], "s166": ["servantHit", 0.18], "asc2": ["sub", 0]}};
const descriptions33={bleedHit:'alvo sangrando',burnHit:'alvo queimando',exposeHit:'alvo exposto',curseHit:'alvo envenenado ou exposto',slowHit:'alvo lento',iceHit:'alvo lento ou congelado',shockHit:'alvo sob shock',execute:'alvo abaixo de 30% PV',far:'distância de pelo menos 75% do alcance',lowHit:'personagem abaixo de 50% PV',highManaHit:'personagem com ao menos 60% PM',servantHit:'servo ativo',bossHit:'chefe',basic:'ataque básico',holy:'habilidade sagrada'};
const subActive33={war:[['bleedHit',.22],['lowHit',.18],['exposeHit',.2]],ranger:[['far',.22],['curseHit',.2],['bossHit',.22]],mage:[['burnHit',.22],['iceHit',.2],['shockHit',.22]],cleric:[['exposeHit',.22],['lowHit',.16],['lowHit',.16]],necro:[['servantHit',.22],['curseHit',.22],['execute',.22]]};
const extra33={"war": [[["Punho de aço", "str", 1, "+1 Força (bônus de talento)"], ["Fio temperado", "bleedHit", 0.035, "+3,5% dano direto contra sangrando"], ["Trono do carrasco", "critDamage", 0.06, "+6 p.p. multiplicador crítico"]], [["Ossatura de ferro", "vit", 1, "+1 Vitalidade (bônus de talento)"], ["Sangue na armadura", "lowGuard", 0.025, "−2,5% dano direto recebido abaixo de 40% PV"], ["Voto de batalha", "bossGuard", 0.025, "−2,5% dano direto recebido de chefes"]], [["Pulso marcial", "haste", 0.018, "+1,8 p.p. ataque extra"], ["Técnica de fôlego", "killMana", 0.025, "Recupera 2,5% PM máximo por vitória"], ["Ferro implacável", "bossHit", 0.04, "+4% dano direto contra chefes"]]], "ranger": [[["Mãos firmes", "dex", 1, "+1 Destreza (bônus de talento)"], ["Foco do olho rubro", "critEnergy", 3, "+3 Foco por acerto crítico"], ["Mira de execução", "execute", 0.045, "+4,5% dano direto contra alvo abaixo de 30% PV"]], [["Sangue de viajante", "vit", 1, "+1 Vitalidade (bônus de talento)"], ["Sopro da mata", "killHeal", 0.018, "Recupera 1,8% PV máximo por vitória"], ["Passagem oculta", "lowGuard", 0.025, "−2,5% dano direto recebido abaixo de 40% PV"]], [["Corda veloz", "haste", 0.02, "+2 p.p. ataque extra"], ["Marca do eremita", "curseHit", 0.035, "+3,5% dano direto contra expostos/envenenados"], ["Sangue da presa", "farEnergy", 3, "+3 Foco por acerto distante"]]], "mage": [[["Runas ígneas", "int", 1, "+1 Inteligência (bônus de talento)"], ["Cinzas que respiram", "killMana", 0.03, "Recupera 3% PM máximo por vitória"], ["Combustão derradeira", "execute", 0.045, "+4,5% dano direto contra alvo abaixo de 30% PV"]], [["Núcleo cristalino", "vit", 1, "+1 Vitalidade (bônus de talento)"], ["Espelho glacial", "tenacity", 0.025, "+2,5 p.p. tenacidade"], ["Selo da nevasca", "lowManaCost", 0.05, "−5% custo de mana abaixo de 35% PM"]], [["Sintonia do éter", "int", 1, "+1 Inteligência (bônus de talento)"], ["Circuito de retorno", "procMana", 0.025, "Recupera 2,5% PM ao consumir Éter"], ["Céu partido", "shockHit", 0.04, "+4% dano direto contra alvos em shock"]]], "cleric": [[["Escritura do juiz", "wis", 1, "+1 Sabedoria (bônus de talento)"], ["Luz abrasadora", "burn", 0.07, "+7% potência de queimadura"], ["Cruzada final", "execute", 0.045, "+4,5% dano direto contra alvo abaixo de 30% PV"]], [["Voto dos peregrinos", "wis", 1, "+1 Sabedoria (bônus de talento)"], ["Oração sem fim", "manaCost", 0.04, "−4% custo de mana de habilidades"], ["Misericórdia plena", "procHeal", 0.015, "Recupera 1,5% PV ao consumir Devoção"]], [["Corpo do mártir", "vit", 1, "+1 Vitalidade (bônus de talento)"], ["Égide contra a ruína", "bossGuard", 0.03, "−3% dano direto recebido de chefes"], ["Sangue fiel", "hurtEnergy", 3, "+3 Devoção ao sofrer dano direto"]]], "necro": [[["Grimório dos ossos", "int", 1, "+1 Inteligência (bônus de talento)"], ["Vínculo do servo", "servantGuard", 0.03, "−3% dano direto recebido com servo ativo"], ["Comando perpétuo", "servant", 0.025, "+2,5 p.p. potência de servos"]], [["Pacto de carne", "vit", 1, "+1 Vitalidade (bônus de talento)"], ["Sussurro vital", "wis", 1, "+1 Sabedoria (bônus de talento)"], ["Sangue imortal", "procHeal", 0.018, "Recupera 1,8% PV ao consumir Almas"]], [["Sigilo funerário", "int", 1, "+1 Inteligência (bônus de talento)"], ["Peste persistente", "exposeDuration", 1, "+1 segundo de exposição aplicada"], ["Colheita dos condenados", "castEnergy", 3, "+3 Almas por habilidade ofensiva que acerta"]]]};
for(const [cl,bs] of Object.entries(extra33))bs.forEach((b,i)=>base33[cl][i][2].push(...b));

const rider33={"war": {"x": ["energy", 5], "y": ["guard", 1], "z": ["status", "expose"], "s13a": ["status", "bleed"], "s13b": ["energy", 8], "s13c": ["buffEnergy", 10], "s160": ["energy", 4], "s161": ["status", "slow"], "s162": ["heal", 0.015], "s163": ["buffHeal", 0.025], "s164": ["buffEnergy", 12], "s165": ["mana", 0.025], "s166": ["energy", 6], "s167": ["buffHeal", 0.035]}, "ranger": {"x": ["energy", 5], "y": ["mana", 0.025], "z": ["status", "expose"], "s13a": ["energy", 6], "s13b": ["status", "slow"], "s13c": ["buffEnergy", 10], "s160": ["status", "bleed"], "s161": ["energy", 6], "s162": ["status", "poison"], "s163": ["buffEnergy", 12], "s164": ["energy", 8], "s165": ["status", "slow"], "s166": ["mana", 0.03], "s167": ["buffHeal", 0.03]}, "mage": {"x": ["status", "burn"], "y": ["guard", 1], "z": ["mana", 0.035], "s13a": ["energy", 6], "s13b": ["status", "slow"], "s13c": ["buffMana", 0.045], "s160": ["energy", 6], "s161": ["status", "slow"], "s162": ["status", "burn"], "s163": ["buffMana", 0.055], "s164": ["energy", 8], "s165": ["status", "slow"], "s166": ["mana", 0.04], "s167": ["buffEnergy", 12]}, "cleric": {"x": ["energy", 6], "y": ["mana", 0.035], "z": ["guard", 1], "s13a": ["status", "burn"], "s13b": ["energy", 7], "s13c": ["buffHeal", 0.035], "s160": ["status", "expose"], "s161": ["status", "slow"], "s162": ["energy", 7], "s163": ["buffHeal", 0.025], "s164": ["buffMana", 0.055], "s165": ["energy", 6], "s166": ["heal", 0.02], "s167": ["buffEnergy", 10]}, "necro": {"x": ["energy", 6], "y": ["heal", 0.018], "z": ["status", "expose"], "s13a": ["energy", 8], "s13b": ["status", "poison"], "s13c": ["buffEnergy", 10], "s160": ["status", "bleed"], "s161": ["status", "slow"], "s162": ["energy", 6], "s163": ["buffHeal", 0.02], "s164": ["buffMana", 0.05], "s165": ["heal", 0.025], "s166": ["energy", 9], "s167": ["buffEnergy", 13]}},subRider33={"war": [["heal", 0.025], ["guard", 2], ["energy", 12]], "ranger": [["energy", 10], ["status", "poison"], ["status", "slow"]], "mage": [["status", "burn"], ["guard", 2], ["mana", 0.06]], "cleric": [["energy", 10], ["guard", 2], ["mana", 0.055]], "necro": [["energy", 10], ["status", "expose"], ["heal", 0.04]]};

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const skills={};const basicElements={war:['bleed','physical','physical'],ranger:['physical','physical','physical'],mage:['fire','ice','arcane'],cleric:['holy','holy','holy'],necro:['bleed','dark','poison']};
for(const [cl,list] of Object.entries(SKILLS)){skills[cl]={};for(const [id,name,icon,mana,cd,power,heal,guard] of list){if(id==='asc2')continue;skills[cl][id]={id,name,mana,cd,power,heal,guard,effects:SKILL_EFFECTS[cl][id]||[],element:basicElements[cl]['xyz'.indexOf(id)]};}
for(const [id,name,element,mana,cd,power,effects,buff] of EXTRA13[cl])skills[cl][id]={id,name,element,mana,cd,power,effects,buff};
MORE16[cl].forEach(([name,element,power,effects,buff],i)=>{const id='s16'+i;skills[cl][id]={id,name,element,power,effects,buff,mana:8+Math.floor(i*1.7),cd:buff?24:7+i%4,heal:i===5?(cl==='cleric'?.23:cl==='necro'?.10:0):0};});}
const passive33={},trees33={};
for(const [cl,branches] of Object.entries(base33)){
const b=branches.map(([name,ids,ps],i)=>{const list=ids.split(' '),out=[];for(let j=0;j<ps.length;j++){const [name,type,value,desc]=ps[j],id=`t33_${cl}_${i}_${j}`;passive33[id]={type,value,cl};let req=j===0?[]:[`t33_${cl}_${i}_${j-1}`];if(j===3)req=[list[1]];if(j===4)req=cl==='war'?[`t33_${cl}_${i}_2`]:cl==='ranger'?[list[2]]:cl==='mage'?[`t33_${cl}_${i}_2`,`t33_${cl}_${(i+1)%3}_1`]:cl==='cleric'?[`t33_${cl}_${i}_3`]:[list[2],`t33_${cl}_${(i+2)%3}_0`];if(j===5)req=[`t33_${cl}_${i}_4`,cl==='war'?list[2]:cl==='ranger'?`t33_${cl}_${i}_3`:cl==='mage'?list[3]:cl==='cleric'?`t33_${cl}_${(i+2)%3}_1`:`t33_${cl}_${i}_2`];out.push({id,name,level:[2,14,38,28,55,75][j],max:3,desc:desc+' por graduação.',req});}for(let j=0;j<list.length;j++){const id=list[j],k=skills[cl][id];if(!k)throw Error('Habilidade ausente '+cl+' '+id);const req=j===0?[]:j===1?[`t33_${cl}_${i}_0`]:j===2?[list[0],`t33_${cl}_${i}_1`]:j===3?[list[1],`t33_${cl}_${i}_1`]:[list[2],`t33_${cl}_${i}_2`];out.push({id,name:k.name,level:(i===0&&j===0)?2:[5,12,24,42,65,80][j],max:3,active:true,req});}return {name,nodes:out.sort((a,b)=>a.level-b.level)};});
trees33[cl]={base:b,sub:subs33[cl].map((ps,i)=>{const a=ASC12[cl][i],nodes=ps.map(([name,type,value,desc],j)=>{const id=`t33_${cl}_sub${i}_${j}`;passive33[id]={type,value,cl,sub:i};return {id,name,level:[16,26,38,55,80][j],max:3,desc:desc+' por graduação.',req:j===0?[]:j===1?[`t33_${cl}_sub${i}_0`]:j===2?['asc2']:j===3?[`t33_${cl}_sub${i}_1`,`t33_${cl}_sub${i}_2`]:[`t33_${cl}_sub${i}_3`]};});nodes.push({id:'asc2',name:a[11],active:true,max:3,level:20,req:[`t33_${cl}_sub${i}_0`]});return {name:a[0],nodes:nodes.sort((a,b)=>a.level-b.level)};})};
}

export function normalize(s){s.servantChoices??=['bone','bone'];s.minions??=[];s.defensive??=false;s.tradeXP??={smith:0,alch:0,enchant:0,jewel:0};s.collection??={};s.recipes??={};s.presets??={};s.loot??={protect:3,sell:-1,notify:3};s.history??=[];s.analyzer??=null;s.oaths??={};s.energyProfile??='auto';s.energyProcs??=0;for(const p of Object.values(s.prof||{})){p.talents??={};p.tool??=0;p.spec??=null;}s.towerRecord??=0;s.legacyXP??=0;s.legacy??={power:0,survive:0};s.rareEvent??=null;s.rotationConditions??={};s.bestiary??={};s.trackCreature??=null;s.rotation??=null;s.runeStock??={};s.potions??={};s.potionCD??={hp:0,mp:0};s.autoPotion??={hp:0,mp:0};s.elixirs??={};s.title??=null;s.forms??={};s.talents??={};s.subclass??=null;s.cooldowns??={};s.buffs??={};s.guard??=0;s.energy??=0;s.servant??=0;s.casts??={};s.mana??=30;s.cursor??=0;s.zoneDungeons??=Array(10).fill(0);s.zoneBosses??=Array(10).fill(0);return s;}
export function tree(cl,s){return [...trees33[cl].base,...(s.subclass===null||s.subclass===undefined?[]:[trees33[cl].sub[s.subclass]])];}
export const freeTalents=s=>Math.max(0,s.level-1-sum(s.talents||{}));
export function canLearn(cl,s,id){const all=tree(cl,s).flatMap(p=>p.nodes),n=all.find(x=>x.id===id);return !!(n&&freeTalents(s)>0&&s.level>=n.level&&(s.talents[id]||0)<n.max&&n.req.every(k=>(s.talents[k]||0)>=Math.min(2,all.find(x=>x.id===k)?.max||2)));}
export function values(cl,s){const v={};for(const [id,n] of Object.entries(s.talents||{})){const p=passive33[id];if(p&&p.cl===cl&&(p.sub===undefined||p.sub===s.subclass))v[p.type]=(v[p.type]||0)+p.value*clamp(n,0,3);}return v;}
export function skill(cl,s,id){let k=skills[cl][id];if(id==='asc2'&&s.subclass!=null){const a=ASC12[cl][s.subclass];k={id,name:a[11],element:a[1],mana:a[12],cd:a[13],power:a[14],heal:a[15],guard:a[16],effects:a[17]};}if(!k)return null;const r=Math.max(0,(s.talents?.[id]||1)-1),v=values(cl,s);const x={...k,mana:Math.ceil(k.mana*(cl==='war'?.94:1)*(1-Math.min(.35,v.manaCost||0))),power:Math.min(2.15,k.power*(1+.11*r)*.94),heal:Math.min(.24,(k.heal||0)*(1+.15*r)*.77),buff13:k.buff?{stat:k.buff[0],value:k.buff[1]*(1+.12*r),duration:k.buff[2]}:null};const form=(s.casts?.[id]||0)>=30?s.forms?.[id]:null,master=(s.casts?.[id]||0)>=120;if(form==='power'){const f=master?1.12:1.07;x.power*=f;x.heal*=f;x.mana=Math.ceil(x.mana*1.1);if(x.buff13)x.buff13.value*=f;}else if(form==='flow'){x.mana=Math.max(1,Math.floor(x.mana*(master?.79:.88)));if(master)x.cd=Math.max(3,x.cd-1);}if(oath(s,0,1))x.mana=Math.max(1,Math.ceil(x.mana*.88));return balance.skill(x);}
export function catalog(cl,s){return tree(cl,s).map(p=>({name:p.name,nodes:p.nodes.map(n=>({...n,rank:s.talents[n.id]||0,available:canLearn(cl,s,n.id),skill:n.active?skill(cl,s,n.id):null}))}));}
export const subclassNames=cl=>ASC12[cl].map(x=>x[0]);
export function eligibleTrial(s){return s.level>=16&&s.skill>=5&&s.zoneDungeons[1]>=1&&s.zoneBosses[1]>=1&&s.subclass==null;}
export function clear(s){s.buffs={};s.guard=0;s.servant=0;s.minions=[];s.energy=0;}
export const potions=Object.freeze(Object.fromEntries([['hp1','Poção de vida menor','hp',.25,8,4],['hp2','Poção de vida','hp',.45,19,7],['hp3','Poção de vida superior','hp',.7,45,12],['mp1','Poção de mana menor','mp',.25,8,4],['mp2','Poção de mana','mp',.45,19,7],['mp3','Poção de mana superior','mp',.7,45,12]].map(([id,name,kind,fraction,price,cd])=>[id,{name,kind,fraction,price,cd}])));
export const elixirs=Object.freeze(Object.fromEntries([{"id":"might","name":"Elixir da força","kind":"attr","attribute":"str","fraction":0,"price":45,"cd":180},{"id":"focus","name":"Elixir da precisão","kind":"attr","attribute":"dex","fraction":0,"price":45,"cd":180},{"id":"mind","name":"Elixir do arcano","kind":"attr","attribute":"int","fraction":0,"price":45,"cd":180},{"id":"faith","name":"Elixir da fé","kind":"attr","attribute":"wis","fraction":0,"price":45,"cd":180},{"id":"guard","name":"Elixir da vigília","kind":"attr","attribute":"vit","fraction":0,"price":45,"cd":180},{"id":"fortune","name":"Elixir da fortuna","kind":"loot","attribute":null,"fraction":0.15,"price":90,"cd":180}].map(({id,...p})=>[id,p])));
export const consumables=Object.freeze({...potions,...elixirs});
function spendConsumable(s,key){
 s.potions[key]--;
 if(s.analyzer?.consumableCost!==undefined){
  s.analyzer.consumableCost+=consumables[key].price;
  if(s.analyzer.consumablesUsed!==undefined)s.analyzer.consumablesUsed++;
 }
}
export function elapseElixirs(s,seconds){for(const k of Object.keys(s.elixirs||{})){s.elixirs[k]=Math.max(0,s.elixirs[k]-seconds);if(!s.elixirs[k])delete s.elixirs[k];}}
export function usePotion(s,st,key){if(Object.hasOwn(elixirs,key)){if(!(s.potions[key]>0)||s.elixirs[key]>0)return false;spendConsumable(s,key);s.elixirs[key]=elixirs[key].cd;return true;}const p=Object.hasOwn(potions,key)?potions[key]:null;if(!p||!(s.potions[key]>0)||s.potionCD[p.kind]>0)return false;const stat=p.kind==='hp'?'hp':'mana',max=st[stat];if(s[stat]>=max)return false;s[stat]=Math.min(max,s[stat]+Math.ceil(max*p.fraction));spendConsumable(s,key);s.potionCD[p.kind]=p.cd;return true;}
export function autoPotion(s,st){for(const k of ['hp','mp']){const stat=k==='hp'?'hp':'mana';if(s.autoPotion[k]>0&&s[stat]/st[stat]*100<=s.autoPotion[k]){const preferred=s.autoPotion[k+'Key'],key=preferred&&Object.hasOwn(potions,preferred)&&potions[preferred].kind===k?preferred:[1,2,3].map(n=>k+n).find(id=>s.potions[id]>0);if(key)usePotion(s,st,key);}}}
export function elapsePotionCooldowns(s,seconds){for(const k of Object.keys(s.potionCD||{}))s.potionCD[k]=Math.max(0,s.potionCD[k]-seconds);}
export function tick(s,st,a){elapsePotionCooldowns(s,1);for(const k of Object.keys(s.cooldowns))s.cooldowns[k]=Math.max(0,s.cooldowns[k]-1);for(const [k,b] of Object.entries(s.buffs))if(--b.left<=0)delete s.buffs[k];s.guard=Math.max(0,s.guard-1);s.servant=Math.max(0,s.servant-1);for(const m of s.minions||[]){m.left--;m.cd=Math.max(0,m.cd-1);m.guard=Math.max(0,m.guard-1);}s.minions=(s.minions||[]).filter(m=>m.left>0);s.servant=Math.max(0,...s.minions.map(m=>m.left));s.mana=Math.min(st.mana,s.mana+st.manaRegen);a.effects??={};a.control=Math.max(0,(a.control||0)-1);a.heroEffects??={};if(trait(a,'regen')&&a.enemyHp>0)a.enemyHp=Math.min(a.enemy.hp,a.enemyHp+Math.max(1,Math.round(a.enemy.hp*.01)));for(const [k,e] of Object.entries(a.heroEffects)){if(EFFECTS[k]?.[4])s.hp-=Math.max(1,Math.round(e.power*EFFECTS[k][4]*(e.stacks||1)));if(--e.left<=0)delete a.heroEffects[k];}for(const [k,e] of Object.entries(a.effects)){if(EFFECTS[k][4])a.enemyHp=Math.max(0,a.enemyHp-Math.max(1,Math.round(e.power*EFFECTS[k][4]*(e.stacks||1))));if(--e.left<=0)delete a.effects[k];}}
function effect(a,k,p,v,boss){if(!EFFECTS[k])return;if(['stun','freeze'].includes(k)){if(a.control||boss)return;a.control=4;}const old=a.effects[k];a.effects[k]={left:EFFECTS[k][3]+(k==='expose'?(v.exposeDuration||0):0),power:Math.min(a.enemy.hp*.30,Math.max(1,p)*(1+(v[k]||0))),stacks:k==='poison'?Math.min(3,(old?.stacks||0)+1):1};}
const arenaMode=mode=>mode==='dungeon'||mode==='boss'||mode==='trial';
const arenaFloor={left:88/800,right:712/800,top:224/600,bottom:515/600};
const huntBounds=[[.09,.91],[.06,.94],[.11,.89],[.10,.90],[.11,.89],[.075,.925],[.07,.93],[.12,.88],[.075,.925],[.10,.90]];
const combatGap=p=>Math.hypot(p.enemy-p.hero,((p.enemyY??0)-(p.heroY??0))*.75);
// Corresponds to rangedIds in the 0.45.0 catalogue, indexed by region and species.
const rangedSpecies=[[4],[3],[2,4],[4],[4],[2,4],[2,4],[2,4],[2,4],[4]];
const rangedEnemy=(a,boss)=>!boss&&!!rangedSpecies[a.z]?.includes(a.index);
const arenaContains=(x,y)=>x>=arenaFloor.left&&x<=arenaFloor.right&&y>=arenaFloor.top&&y<=arenaFloor.bottom;
function escapeArena(p,range,step,a){
 const distance=combatGap(p);
 if(a.escapeWait>0)a.escapeWait--;
 if(!a.escapeRoute&&a.retreatBlocked>=2&&!a.escapeWait&&distance>0&&distance<range*.77){
  const ux=(p.enemy-p.hero)/distance,uy=(p.enemyY-p.heroY)*.75/distance;
  const routes=[];
  for(const sign of [-1,1]){
   const start={x:p.hero-uy*sign*.16,y:p.heroY+ux*sign*.16/.75};
   const around={x:p.enemy-uy*sign*.16,y:p.enemyY+ux*sign*.16/.75};
   const far={x:p.enemy+ux*range*.87-uy*sign*.08,y:p.enemyY+(uy*range*.87+ux*sign*.08)/.75};
   if([start,around,far].every(point=>arenaContains(point.x,point.y)))routes.push([start,around,far]);
  }
  const cost=([start,around,far])=>Math.hypot(start.x-p.hero,(start.y-p.heroY)*.75)+
   Math.hypot(around.x-start.x,(around.y-start.y)*.75)+Math.hypot(far.x-around.x,(far.y-around.y)*.75);
  routes.sort((a,b)=>cost(a)-cost(b));
  if(routes.length)a.escapeRoute={points:routes[0],left:8};
 }
 const route=a.escapeRoute;
 if(!route)return false;
 const target=route.points[0],dx=target.x-p.hero,dy=target.y-p.heroY,d=Math.hypot(dx,dy*.75);
 const t=d?Math.min(1,step/d):1;
 const x=p.hero+dx*t,y=p.heroY+dy*t;
 if(Math.hypot(x-p.enemy,(y-p.enemyY)*.75)>=Math.min(.12,distance)){
  p.hero=x;p.heroY=y;
  if(t===1)route.points.shift();
 }
 if(--route.left<=0||!route.points.length||(route.points.length===1&&combatGap(p)>=range*.90)){
  delete a.escapeRoute;
  a.escapeWait=5;a.retreatBlocked=0;
 }
 return true;
}
function arenaStep(p,actor,other,step){
 const axis=actor+'Y',otherAxis=other+'Y';
 const dx=p[other]-p[actor],dy=p[otherAxis]-p[axis],distance=Math.hypot(dx,dy*.75);
 if(!distance||!step)return;
 const ux=dx/distance,uy=dy*.75/distance;
 const candidate=(vx,vy)=>{
  const x=Math.max(arenaFloor.left,Math.min(arenaFloor.right,p[actor]+vx*step));
  const y=Math.max(arenaFloor.top,Math.min(arenaFloor.bottom,p[axis]+vy*step/.75));
  return {x,y,gap:Math.hypot(x-p[other],(y-p[otherAxis])*.75)};
 };
 let next=candidate(ux,uy);
 if(step<0&&next.gap<=distance+1e-9){
  for(const side of [-1,1]){
   const flank=candidate(-uy*side,ux*side);
   if(flank.gap>next.gap)next=flank;
  }
  if(next.gap<=distance+1e-9)return;
 }
 p[actor]=next.x;p[axis]=next.y;
}
function heroMovement(cl,gap,range,speed){
 if(cl==='war')return gap>range?Math.min(speed,gap-range):0;
 if(gap>range*.96)return Math.min(speed,gap-range*.88);
 if(gap<range*.66)return -Math.min(speed*.66,range*.77-gap);
 return 0;
}
function enemyMovement(ranged,gap,speed){
 if(!ranged)return gap>.12?Math.min(speed,gap-.12):0;
 const pace=speed*.137/.185;
 if(gap>.264)return Math.min(pace,gap-.264);
 if(gap<.156)return -Math.min(pace*.45,.156-gap);
 return 0;
}
function moveHunt(p,cl,range,step,speed,a,ranged){
 const [left,right]=a.mode==='hunt'?(huntBounds[a.z]??huntBounds[0]):[.08,.79];
 const clampX=x=>Math.max(left,Math.min(right,x));
 const direction=Math.sign(p.enemy-p.hero)||a.huntEscape?.direction||1;
 const gap=Math.abs(p.enemy-p.hero);
 if(!a.heroEffects?.stun&&!a.heroEffects?.freeze){
  if(a.escapeWait>0)a.escapeWait--;
  const movement=heroMovement(cl,gap,range,step),next=clampX(p.hero+direction*movement);
  if(a.mode==='hunt'&&movement<0&&Math.abs(next-p.hero)<1e-9&&!a.huntEscape&&!a.escapeWait){
   const edge=direction>0?right:left;
   if(Math.abs(edge-p.enemy)>=.12)a.huntEscape={direction,edge,left:8};
  }
  if(a.huntEscape){
   const route=a.huntEscape;
   p.hero+=route.direction*Math.min(step,Math.abs(route.edge-p.hero));
   const crossed=(p.hero-p.enemy)*route.direction>0;
   if(crossed&&p.hero===route.edge&&Math.abs(p.enemy-p.hero)<.12)p.enemy=p.hero-route.direction*.12;
   const distance=Math.abs(p.enemy-p.hero);
   const blend=Math.max(0,1-distance/.18);
   p.enemyY=.84;
   p.heroY=.84+blend*blend*(3-2*blend)*52/1200;
   if((crossed&&(distance>=range*.84||p.hero===route.edge)||--route.left<=0)&&distance>=.12-1e-9){
    delete a.huntEscape;
    delete p.heroY;delete p.enemyY;
    a.escapeWait=5;
   }
  }else p.hero=next;
 }
 const side=Math.sign(p.enemy-p.hero)||direction;
 const separation=Math.abs(p.enemy-p.hero),motion=enemyMovement(ranged,separation,speed);
 const distance=a.huntEscape?separation-motion:Math.max(.12,separation-motion);
 p.enemy=clampX(p.hero+side*distance);
}
function moveArena(p,cl,range,step,speed,a,ranged){
 p.heroY??=.72;p.enemyY??=.51;
 const gap=combatGap(p);
 if(!a.heroEffects?.stun&&!a.heroEffects?.freeze){
  const movement=heroMovement(cl,gap,range,step);
  if(cl==='war'||!escapeArena(p,range,step,a)){
   arenaStep(p,'hero','enemy',movement);
   if(movement<0&&combatGap(p)-gap<Math.abs(movement)*.5)a.retreatBlocked=(a.retreatBlocked||0)+1;
   else a.retreatBlocked=0;
  }
 }
 arenaStep(p,'enemy','hero',enemyMovement(ranged,combatGap(p),speed));
}
function moveMinions(minions,positions,mode){
 const arena=arenaMode(mode),depth=arena?.075:52/1200;
 for(const [index,minion] of (minions||[]).entries()){
  const reach=servantRoles[minion.role].reach,side=index===0?1:-1;
  const targetX=Math.max(arena?arenaFloor.left:.08,Math.min(arena?arenaFloor.right:.96,positions.enemy+side*reach*.88));
  const targetY=arena
   ?Math.max(arenaFloor.top-positions.enemyY,Math.min(arenaFloor.bottom-positions.enemyY,side*depth))
   :side*depth;
  const y=minion.y??0,dx=targetX-minion.x,dy=targetY-y;
  const distance=Math.hypot(dx,dy*.75);
  const t=distance?Math.min(1,.14/distance):1;
  minion.x+=dx*t;
  minion.y=y+dy*t;
 }
}
export function move(cl,s,st,a,boss){
 const p=a.positions??={hero:.25,enemy:.75,servant:.34};
 const v=values(cl,s),range=cl==='ranger'?.30:cl==='mage'?.27:cl==='cleric'||cl==='necro'?.21:.12;
 const step=.085*(1+Math.min(.3,(v.move||0)+(st.move||0)))*(a.heroEffects?.slow?.left>0?.7:1);
 const stopped=a.effects?.stun||a.effects?.freeze;
 const speed=stopped?0:(a.effects?.slow?.left>0?.033:.065)*(boss?.75:1)*(trait(a,'fast')?1.18:1);
 const ranged=rangedEnemy(a,boss);
 if(arenaMode(a.mode))moveArena(p,cl,range,step,speed,a,ranged);
 else moveHunt(p,cl,range,step,speed,a,ranged);
 if(s.servant>0){
  const target=Math.min(.92,p.enemy+.13);
  p.servant=Math.max(.08,Math.min(.92,p.servant+Math.sign(target-p.servant)*Math.min(Math.abs(target-p.servant),.14)));
 }
 moveMinions(s.minions,p,a.mode);
 return p;
}

const heroReach={war:.14,ranger:.32,mage:.29,cleric:.23,necro:.23};
const heroAttackRate={war:1.06,ranger:1.04,mage:.89,cleric:.95,necro:.94};
const monsterAttackRate=[1,1.13,1,.81,.91];
export function attackReady(a,side,cl,boss){
 const effects=side==='hero'?a.heroEffects:a.effects;
 const reach=side==='hero'?heroReach[cl]:rangedEnemy(a,boss)?.30:.16;
 if(a.positions&&combatGap(a.positions)>reach)return false;
 const clocks=a.attackClock??={hero:0,enemy:0};
 if(effects?.stun||effects?.freeze){clocks[side]=0;return false;}
 const rate=side==='hero'?heroAttackRate[cl]:boss?1:monsterAttackRate[a.index]??1;
 clocks[side]=Math.min(1.99,clocks[side]+(side==='enemy'&&trait(a,'fast')?.25:0)+rate*.82*(effects?.slow?.left>0?.7:1));
 if(clocks[side]<1)return false;
 clocks[side]-=1;
 return true;
}
const damageByStatus=(source,target)=>(source?.shock?.left>0?.8:1)*(target?.expose?.left>0?1.2:1);
function relicSkillDamage(s,st,a,damage){
 const relics=st.advanced?.relics??[];
 let extra=0;
 if(relics.includes(6)&&a.effects.bleed?.left>0){
  const bleed=a.effects.bleed;
  extra+=bleed.power*.12*bleed.left*.7;
  delete a.effects.bleed;
 }
 if(relics.includes(8)){
  s.relicEchoCharges=((s.relicEchoCharges||0)+1)%5;
  if(s.relicEchoCharges===0)extra+=damage*.4;
 }
 return extra?Math.max(1,Math.round(extra)):0;
}
export function learnedSkills(cl,s){return tree(cl,s).flatMap(p=>p.nodes).filter(n=>n.active&&(s.talents[n.id]||0)>0).map(n=>skill(cl,s,n.id)).filter(Boolean);}
export function turn(cl,s,st,a,random,boss,deferRanged=false){const has=k=>!!a.effects[k],all=learnedSkills(cl,s),learned=s.rotation===null?all:s.rotation.map(id=>all.find(k=>k.id===id)).filter(Boolean);if(a.heroEffects?.stun||a.heroEffects?.freeze)return 0;if(a.positions&&combatGap(a.positions)>heroReach[cl])return 0;let cast=s.rotation===null?learned.find(k=>k.buff13&&!s.buffs[k.id]&&!s.cooldowns[k.id]&&s.mana>=k.mana):null;if(!cast&&learned.length){for(let i=0;i<learned.length;i++){const j=s.rotation===null?(s.cursor+i)%learned.length:i,k=learned[j],cond=s.rotationConditions?.[k.id]||'always';if(s.rotation!==null&&(cond==='hp'&&s.hp/st.hp>=.5||cond==='mp'&&s.mana/st.mana>=.35||cond==='execute'&&a.enemyHp/a.enemy.hp>=.3||cond==='boss'&&!boss&&!a.affixes?.length&&a.mode!=='dungeon'||cond==='control'&&(has('stun')||has('freeze'))))continue;if((!k.buff13||s.rotation!==null&&!s.buffs[k.id])&&!s.cooldowns[k.id]&&s.mana>=k.mana){cast=k;s.cursor=(j+1)%learned.length;break;}}}
 if(cast){s.mana-=cast.mana;s.cooldowns[cast.id]=cast.cd;s.casts[cast.id]=(s.casts[cast.id]||0)+1;s.lastCast=cast.name;}
 if(deferRanged&&cl!=='war'&&!cast?.buff13){
  const element=heroAttackElement(cl,cast);
  const kind=cl==='ranger'?'arrow':element==='ice'?'ice':'magic';
  a.pendingHeroShot={cast:cast??null,projectile:launchProjectile(a.positions,'enemy',kind,boss)};
  return {element};
 }
 return resolveHeroAttack(cl,s,st,a,random,boss,cast);
}
const heroAttackElement=(cl,cast)=>cast?.element||({mage:'arcane',cleric:'holy',necro:'dark'}[cl]||'physical');
// The combat stage uses normalized coordinates. Projectile velocities use the
// reference stage's 800 × 600 pixels and follow a moving elliptical target.
function projectileBody(p,side,boss){
 const scale=side==='hero'&&p.heroY!==undefined?1.55:1;
 return {x:p[side]*800,y:(p[side+'Y']??.84)*600-(side==='hero'?4*scale:boss?15:7),
  rx:side==='hero'?12*scale:boss?33:14,ry:side==='hero'?20*scale:boss?40:20};
}
function launchProjectile(positions,side,kind,boss){
 if(!positions)return null;
 const source=side==='hero'?'enemy':'hero',target=projectileBody(positions,side,boss);
 const x=positions[source]*800,y=(positions[source+'Y']??.84)*600-8;
 const nominal=kind==='arrow'?650:kind==='ice'?780:930;
 const speed=Math.max(.105,Math.min(.39,Math.hypot(target.x-x,target.y-y)/nominal));
 return {x,y,speed,radius:kind==='arrow'?1:5};
}
function contactFraction(x,y,nextX,nextY,from,to,radius){
 const rx=to.rx+radius,ry=to.ry+radius;
 const ax=(x-from.x)/rx,ay=(y-from.y)/ry;
 const dx=(nextX-to.x)/rx-ax,dy=(nextY-to.y)/ry-ay;
 const c=ax*ax+ay*ay-1;
 if(c<=0)return 0;
 const a=dx*dx+dy*dy,b=ax*dx+ay*dy,disc=b*b-a*c;
 if(!a||disc<0)return null;
 const t=(-b-Math.sqrt(disc))/a;
 return t>=0&&t<=1?t:null;
}
function advanceProjectile(projectile,side,boss,start,end){
 if(!projectile||!start||!end)return 0;
 const from=projectileBody(start,side,boss),to=projectileBody(end,side,boss);
 let body=from;
 for(let step=1;step<=20;step++){
  const progress=step/20;
  const target={...to,x:from.x+(to.x-from.x)*progress,y:from.y+(to.y-from.y)*progress};
  const {x,y,speed,radius}=projectile,dx=target.x-x,dy=target.y-y;
  const distance=Math.hypot(dx,dy),ratio=distance?Math.min(1,speed*50/distance):0;
  const nextX=x+dx*ratio,nextY=y+dy*ratio;
  const hit=contactFraction(x,y,nextX,nextY,body,target,radius);
  if(hit!==null)return (step-1+hit)*50;
  projectile.x=nextX;projectile.y=nextY;
  body=target;
 }
 return Infinity;
}
export function advanceCombatProjectiles(cl,s,st,a,random,boss,start){
 const hero=a.pendingHeroShot?advanceProjectile(a.pendingHeroShot.projectile,'enemy',boss,start,a.positions):Infinity;
 const enemy=a.pendingEnemyShot?advanceProjectile(a.pendingEnemyShot.projectile,'hero',boss,start,a.positions):Infinity;
 if(enemy<hero)landEnemyShot(s,st,a,random);
 const landed=Number.isFinite(hero)&&landHeroShot(cl,s,st,a,random,boss);
 if(enemy>=hero&&Number.isFinite(enemy))landEnemyShot(s,st,a,random);
 return landed;
}
export function landHeroShot(cl,s,st,a,random,boss){
 const shot=a.pendingHeroShot;
 if(!shot)return false;
 delete a.pendingHeroShot;
 if(a.enemyHp<=0||s.hp<=0)return false;
 resolveHeroAttack(cl,s,st,a,random,boss,shot.cast);
 return true;
}
function resolveHeroAttack(cl,s,st,a,random,boss,cast){
const v=values(cl,s),has=k=>!!a.effects[k];
const heal=n=>{s.hp=Math.min(st.hp,s.hp+n*(trait(a,'curse')?.7:1));},mana=n=>{s.mana=Math.min(st.mana,s.mana+n);};
const gap=a.positions?combatGap(a.positions):null,range=cl==='ranger'?.30:cl==='mage'?.27:cl==='cleric'||cl==='necro'?.21:.12,far=gap===null?cl==='ranger'&&a.turn<=Math.max(4,6+Math.round((v.move||0)*10)):gap>=range*.75,near=gap===null?!far:gap<range*.55;
const cond={far,near,bleedHit:has('bleed'),burnHit:!!cast&&has('burn'),exposeHit:has('expose'),curseHit:has('poison')||has('expose'),slowHit:has('slow'),iceHit:has('slow')||has('freeze'),shockHit:has('shock'),execute:a.enemyHp<a.enemy.hp*.3,lowHit:s.hp<st.hp*.5,highManaHit:s.mana>=st.mana*.6,servantHit:s.servant>0,bossHit:boss,basic:!cast,holy:cast?.element==='holy'};
const pow=st.powers||{},path=cast?trees33[cl].base.findIndex(p=>p.nodes.some(n=>n.id===cast.id)):-1,root=i=>s.talents['t33_'+cl+'_'+i+'_0']||0,rank=path<0?0:root(path),low60=s.hp<st.hp*.6;let synergyDamage=0;
if(rank&&cast&&!cast.buff13){if((cl==='war'&&path===0&&has('bleed'))||(cl==='ranger'&&path===0&&far)||(cl==='mage'&&path===0&&has('burn'))||(cl==='cleric'&&path===0&&has('expose'))||(cl==='necro'&&path===2&&(has('poison')||has('expose'))))synergyDamage=(cl==='ranger'||cl==='mage'?.06:.05)+.02*rank;}
const rider=cast&&(cast.id==='asc2'?subRider33[cl][s.subclass]:rider33[cl][cast.id]);let dmg=0,critical=false;
if(cast?.buff13){s.buffs[cast.id]={...cast.buff13,left:cast.buff13.duration};}
else{critical=random()<st.crit;let bonus=Object.keys(descriptions33).reduce((n,k)=>n+(cond[k]?(v[k]||0):0),0);const ex=cast&&(cast.id==='asc2'?subActive33[cl][s.subclass]:active33[cl][cast.id]);if(ex&&cond[ex[0]])bonus+=ex[1];bonus+=synergyDamage+(cond.execute?((pow.execute||0)+(st.advanced?.execute||0)):0)+(cast&&cond.highManaHit?(pow.resonance||0):0);dmg=Math.max(1,Math.round(st.damage*(cast?st.special*cast.power:1)*(critical?st.critMult:1)*(1+Math.min(.40,bonus))*(1+(a.masteryBonus||0))*damageByStatus(a.heroEffects,a.effects)*(.9+random()*.2)));const element=heroAttackElement(cl,cast);a.lastAttackElement=element;a.lastAttackSkill=cast?.name??null;dmg=Math.max(1,Math.round(dmg*(1-enemyResistance(a,element,boss))));dmg+=combo(a,element,dmg)+(cast?relicSkillDamage(s,st,a,dmg):0);if(boss)dmg=Math.min(dmg,Math.max(1,Math.round(a.enemy.hp*.29)));a.enemyHp=Math.max(0,a.enemyHp-dmg);if(cast){if(cast.guard)s.guard=3;if(cast.heal)heal(Math.min(st.hp*.2,st.hp*cast.heal*(1+st.heal)));for(const k of cast.effects||[])effect(a,k,dmg,v,boss);}heal(dmg*Math.min(.12,(v.drain||0)+(cl==='necro'&&path===1&&rank&&low60?.015+.008*rank:0)));if(cast&&rank){if(cl==='war'&&path===2&&has('expose'))mana(st.mana*(.012+.008*rank));if(cl==='ranger'&&path===2&&has('poison'))mana(st.mana*(.015+.008*rank));if(cl==='mage'&&path===2&&a.lastElement&&a.lastElement!==cast.element)mana(st.mana*(.025+.01*rank));if(cl==='cleric'&&path===1&&low60&&cast.heal)heal(st.hp*(.01+.006*rank));if(cl==='necro'&&path===0&&s.minions.length){for(const m of s.minions)m.left=Math.min(12+rank,m.left+1);s.servant=Math.max(...s.minions.map(m=>m.left));}}if(cast)a.lastElement=cast.element;for(const [k,chance] of Object.entries(st.runeProcs||{}))if(a.enemyHp>0&&random()<chance)effect(a,k,dmg,v,boss);if(random()<st.haste&&a.enemyHp>0)a.enemyHp=Math.max(0,a.enemyHp-Math.round(st.damage));}
if(rider){const [kind,raw]=rider,n=typeof raw==='number'?raw*(1+.1*Math.max(0,(s.talents[cast.id]||1)-1)):raw;if(kind==='energy'||kind==='buffEnergy')s.energy+=n;else if(kind==='mana'||kind==='buffMana')mana(st.mana*n);else if(kind==='heal'||kind==='buffHeal')heal(st.hp*n);else if(kind==='guard')s.guard=Math.min(6,s.guard+Math.round(n));else if(kind==='status')effect(a,n,Math.max(1,dmg*.65),v,boss);}
s.energy=Math.min(100,s.energy+(cast?12:8)+(cast?v.castEnergy||0:0)+(critical?v.critEnergy||0:0)+(far?v.farEnergy||0:0)+(cl==='necro'&&!s.servant?v.noServantEnergy||0:0)+(cast&&oath(s,0,0)?8:0));
if(dmg>0&&s.energy>=100&&(s.energyProfile==='auto'||s.energyProfile==='boss'&&boss||s.energyProfile==='hurt'&&s.hp/st.hp<.65)){s.energy=0;s.energyProcs++;const p=paths[cl]?.[s.subclass],bonus=(p?p[3]:({war:.22,ranger:.25,mage:.24,cleric:.12,necro:.08}[cl]))+(oath(s,1,0)?.10:0)+(oath(s,2,0)?.18:0)+(affinity(cl,s,a,critical,cast,st,far,boss)?.10:0);const extra=Math.round(dmg*bonus),applied=boss?Math.min(extra,Math.max(0,Math.round(a.enemy.hp*.29)-dmg)):extra;a.enemyHp=Math.max(0,a.enemyHp-applied);dmg+=applied;if(cl==='necro')summon(s,st,a,v);if(p?.[2]==='guard')s.guard=Math.max(s.guard,3);else if(p?.[2]&&a.enemyHp>0)effect(a,p[2],dmg*(oath(s,2,0)?1.15:.75),v,boss);heal(st.hp*((p?p[4]:cl==='cleric'?.05:0)+(oath(s,2,1)?.04:0)+(v.procHeal||0)));mana(st.mana*((p?p[5]:cl==='mage'?.05:0)+(oath(s,2,1)?.05:0)+(v.procMana||0)));}

a.lastHit=dmg;a.lastSupportCast=cast?.buff13?{skill:cast.name,element:cast.element}:null;a.lastCritical=critical;a.hitSeq=(a.hitSeq||0)+1;return dmg;}
export function enemyStrike(cl,s,st,a,random,boss,deferRanged=false){
 if(a.enemyHp<=0||s.hp<=0||random()<st.dodge)return;
 const v=values(cl,s),effects=a.effects||{},pow=st.powers||{};
 const gap=a.positions?combatGap(a.positions):Infinity;
 const near=gap<({war:.12,ranger:.30,mage:.27,cleric:.21,necro:.21}[cl])*.55;
 const iceHit=!!(effects.slow||effects.freeze);
 const path=cl==='cleric'?2:1,rank=s.talents['t33_'+cl+'_'+path+'_0']||0;
 const eligible=rank&&trees33[cl].base[path].nodes.some(n=>n.active&&s.talents[n.id]>0);
 const synergy=eligible&&((cl==='war'||cl==='cleric')&&s.guard||cl==='ranger'&&near||cl==='mage'&&iceHit)
  ?(cl==='war'||cl==='cleric'?.03:.025)+.015*rank:0;
 const reduction=(s.guard?.14+(v.guard||0):0)+(near?v.nearGuard||0:0)+(iceHit?v.controlGuard||0:0)
  +(boss?v.bossGuard||0:0)+(s.hp<st.hp*.4?(v.lowGuard||0)+(pow.ward||0):0)+(s.servant?v.servantGuard||0:0);
 const damage=a.enemy.atk*(1-balance.armor(st.def,a.z))*(1-Math.min(.63,st.reduction+reduction+synergy))
  *(cl==='war'&&s.subclass===0?1.10:1)*(oath(s,1,1)&&s.energy>=50?.93:1);
 const element=trait(a,'profane')?'dark':boss||a.index===4?affinities[a.z]:'physical';
 const ranged=rangedEnemy(a,boss);
 const shot={element,kind:a.z===1&&a.index===3?'arrow':a.z===2&&a.index===4?'fire':'dark'};
 if(ranged&&deferRanged){
  a.pendingEnemyShot={damage,element,energy:v.hurtEnergy||0,projectile:launchProjectile(a.positions,'hero',shot.kind,boss)};
  return shot;
 }
 const dealt=incoming(s,st,a,damage,boss,random,element);
 s.energy=Math.min(100,s.energy+(v.hurtEnergy||0));
 if(ranged)return {...shot,damage:dealt};
}
export function landEnemyShot(s,st,a,random){
 const shot=a.pendingEnemyShot;
 if(!shot)return;
 delete a.pendingEnemyShot;
 if(s.hp<=0||a.enemyHp<=0)return;
 incoming(s,st,a,shot.damage,false,random,shot.element);
 s.energy=Math.min(100,s.energy+shot.energy);
}
export function onVictory(cl,s,st){const v=values(cl,s);s.hp=Math.min(st.hp,s.hp+Math.min(st.hp*.08,st.hp*((v.killHeal||0)+(st.powers?.harvest||0)+(st.recovery||0))));s.mana=Math.min(st.mana,s.mana+st.mana*(v.killMana||0));s.energy=Math.min(100,s.energy+(v.killEnergy||0));}

// Original vocation oath catalogue.
const paths={war:[['Carnificina','Sangramento e execução','bleed',.32,0,0,['Sede rubra','Ferro selvagem','Ruptura profunda','Pele de cicatrizes','Última sentença','Coração indomável']],['Bastião','Defesa e contra-ataque','guard',.14,.035,0,['Muralha','Revide','Escudo ancestral','Voto de ferro','Fortaleza eterna','Sentinela implacável']],['Duelo perfeito','Crítico e precisão','expose',.30,0,0,['Fio preciso','Ritmo marcial','Lâmina perfeita','Guarda de duelo','Mestre do corte','Dança de aço']]],ranger:[['Marca fatal','Crítico e exposição','expose',.35,0,0,['Ponto vital','Mira paciente','Olho de falcão','Passo leve','Disparo final','Precisão absoluta']],['Emboscada','Veneno e controle','poison',.23,0,0,['Presa tóxica','Rastreador','Sangue verde','Camuflagem','Predador noturno','Sobrevivente']],['Caçada ancestral','Pressão contra elites','slow',.30,0,0,['Marca da presa','Passo do caçador','Flecha ritual','Refúgio','Algoz de titãs','Vigília silvestre']]],mage:[['Pira','Queimadura e explosão','burn',.33,0,.02,['Brasa viva','Chama econômica','Fornalha interior','Manto de cinza','Sol negro','Renascimento ígneo']],['Inverno eterno','Gelo e proteção','freeze',.18,.025,.02,['Cristal cortante','Geada estável','Estilhaço','Pele glacial','Zero absoluto','Refúgio de gelo']],['Colapso do éter','Shock e mana','shock',.27,0,.08,['Eco arcano','Fluxo profundo','Sobrecarga','Égide do éter','Singularidade','Fonte infinita']]],cleric:[['Anátema','Dano sagrado e exposição','expose',.31,.02,0,['Flagelo','Liturgia','Julgamento','Voto do mártir','Anátema final','Luz purificadora']],['Égide','Proteção e recuperação','guard',.13,.06,0,['Escudo sagrado','Disciplina','Bastião da fé','Voto de proteção','Égide eterna','Guardião da luz']],['Milagre','Cura e sustentação','heal',.12,.085,.025,['Prece','Sacrifício','Fonte de vida','Graça serena','Milagre maior','Vigília eterna']]]};
paths.necro=[['Legião funerária','Invoca dois servos de duração prolongada','slow',.06,0,0,['Ossos inquietos','Vínculo profundo','Legião','Ossário protegido','Trono de ossos','Vigília dos mortos']],['Praga do sepulcro','Maldições e exposição','expose',.20,0,0,['Sussurros','Rito econômico','Maldição eterna','Véu pestilento','Apoteose da praga','Pacto do túmulo']],['Colheita rubra','Sacrifício de servos e cura','bleed',.21,.025,0,['Sangue pactual','Ritual contido','Ceifa','Carne mortuária','Último sacrifício','Pacto eterno']]];

const oathGates=[[30,2],[60,5],[90,8]],oathDetails=[['+8 recurso por habilidade','−12% custo de mana'],['+10 p.p. dano fortalecido','−7% dano recebido com recurso >=50'],['+18 p.p. dano fortalecido e status amplificado','+4% PV e +5% PM no golpe fortalecido']];
export function oathGate(s,i){const gate=oathGates[i];return !!gate&&s.subclass!=null&&s.level>=gate[0]&&s.zoneDungeons[gate[1]]>0&&s.zoneBosses[gate[1]]>0;}
function oath(s,i,n){return oathGate(s,i)&&s.oaths[i]===n;}
export function oathCatalog(cl,s){const p=paths[cl]?.[s.subclass];return p?oathGates.map(([level,z],i)=>({level,z,available:oathGate(s,i),selected:s.oaths[i]??null,cost:150+10*level,choices:[0,1].map(n=>({name:p[6][i*2+n],desc:oathDetails[i][n]}))})):[];}
function affinity(cl,s,a,critical,cast,st,far,boss){const h=s.hp/st.hp<.65,e=k=>!!a.effects[k];return ({war:[a.enemyHp/a.enemy.hp<.35,h,critical],ranger:[far,e('poison'),boss||a.mode==='dungeon'],mage:[e('burn'),e('slow')||e('freeze'),!!cast],cleric:[e('expose'),s.guard>0,h],necro:[s.servant>0,e('poison')||e('expose'),h]})[cl]?.[s.subclass]||false;}

const opposites={poison:'fire',dark:'holy',fire:'ice',ice:'fire',holy:'dark',physical:'shock',arcane:'physical'};
const af={vamp:['Vampírico','Recupera 20% do dano causado'],rage:['Enfurecido','Dano cresce até +35% conforme perde PV'],armor:['Blindado','25% resistência física'],ghost:['Espectral','35% resistência física'],venom:['Venenoso','Aplica veneno ao atacar'],regen:['Regenerador','Recupera 1% dos PV por segundo'],exec:['Carrasco','+25% dano contra alvo abaixo de 35% PV'],curse:['Amaldiçoado','Reduz cura de habilidades em 30%'],fast:['Voraz','+25% velocidade de ataque'],profane:['Profano','Dano sombrio e exposição']};
const mechanics=[['Raízes','slow'],['Julgamento sepulcral','expose'],['Sopro de cinzas','burn'],['Maré tóxica','poison'],['Prisão glacial','freeze'],['Selo dos mártires','bleed'],['Golpe do marechal','stun'],['Erupção da fornalha','burn'],['Eclipse','shock'],['Sentença da noite','expose']];
export const affixCatalog=af;
export function encounterTraits(a,random){a.affixes=[];a.phase=0;a.bossClock=0;a.warning=null;a.heroEffects={};a.lastCombo=null;a.comboSeq=0;let n=a.mode==='dungeon'&&a.wave!==4?Math.max(0,(a.difficulty||0)-1):a.mode==='hunt'&&random()<.065?(random()<.16?2:1):0;const keys=Object.keys(af);while(n--&&keys.length)a.affixes.push(keys.splice(Math.floor(random()*keys.length),1)[0]);}
const trait=(a,k)=>a.affixes?.includes(k);
export function enemyResistance(a,element,boss){if(!a.mode||a.mode==='trial')return 0;let r=element===affinities[a.z]?(boss?.42:.22):element===opposites[affinities[a.z]]?-.18:0;if(element==='physical')r+=(trait(a,'armor')?.25:0)+(trait(a,'ghost')?.35:0);return clamp(r,-.35,.70);}
function heroEffect(a,k,n,tenacity=0){if(!EFFECTS[k])return;a.heroEffects??={};const old=a.heroEffects[k];a.heroEffects[k]={left:Math.max(1,Math.ceil(EFFECTS[k][3]*(1-tenacity))),power:Math.max(1,n),stacks:k==='poison'?Math.min(3,(old?.stacks||0)+1):1};}
export function combo(a,element,damage){const combos={fire:['poison',.25,'Combustão tóxica'],physical:['freeze',.25,'Estilhaçamento'],arcane:['shock',.20,'Sobrecarga'],bleed:['expose',.15,'Hemorragia']},p=combos[element];if(!p||!a.effects?.[p[0]])return 0;if(element!=='bleed')delete a.effects[p[0]];a.lastCombo=p[2];a.comboSeq=(a.comboSeq||0)+1;return Math.round(damage*p[1]);}
function incoming(s,st,a,n,boss,random,element){let d=n*damageByStatus(a.effects,a.heroEffects)*(trait(a,'rage')?1+.35*(1-a.enemyHp/a.enemy.hp):1)*(trait(a,'exec')&&s.hp/st.hp<.35?1.25:1)*(boss?1+(a.phase||0)*.085:1)*(1-(st.advanced?.resist?.[element]||0));const sentinel=(s.minions||[]).find(m=>m.role==='sentinel'&&!m.guard&&Math.abs(m.x-(a.positions?.hero??.25))<=.35);if(sentinel){d*=.88;sentinel.guard=4;}d=Math.max(1,Math.round(d));s.hp-=d;if(trait(a,'vamp'))a.enemyHp=Math.min(a.enemy.hp,a.enemyHp+Math.ceil(d*.2));if(s.hp>0){if(trait(a,'venom'))heroEffect(a,'poison',d,st.tenacity);if(trait(a,'profane')&&random()<.2)heroEffect(a,'expose',d,st.tenacity);}return d;}
export function bossMechanic(s,st,a,random){if(a.mode==='trial'||a.enemyHp<=0||s.hp<=0)return;const r=a.enemyHp/a.enemy.hp;a.phase=Math.max(a.phase||0,r<=.10?3:r<=.35?2:r<=.70?1:0);a.bossClock=(a.bossClock||0)+1;if(a.warning){a.warning=null;if(s.defensive&&s.hp/st.hp<=.30){a.lastMechanic='Recuo defensivo';return;}const [name,k]=mechanics[a.z],element=affinities[a.z],resist=st.advanced?.resist?.[element]||0;const n=Math.max(1,Math.round(a.enemy.atk*.65*(1-resist)));incoming(s,st,a,n,true,random,element);if(s.hp>0)heroEffect(a,k,n,st.tenacity);a.lastMechanic=name;}else if(a.bossClock%Math.max(4,9-a.phase)===0)a.warning=mechanics[a.z][0];}

export const servantRoles={bone:{name:'Servo original',reach:.16,mult:1},sentinel:{name:'Sentinela Óssea',reach:.16,mult:.70},archer:{name:'Arqueiro Espectral',reach:.36,mult:.85},herald:{name:'Arauto das Cinzas',reach:.30,mult:.65}};
function summon(s,st,a,v){if(s.subclass===2&&s.minions.length&&a.enemyHp>0){s.minions.shift();a.enemyHp=Math.max(0,a.enemyHp-Math.round(st.damage*.45));s.hp=Math.min(st.hp,s.hp+Math.round(st.hp*.025));}else{s.minions=Array.from({length:s.subclass===0?2:1},(_,i)=>({role:Object.hasOwn(servantRoles,s.servantChoices[i])?s.servantChoices[i]:'bone',left:(s.subclass===0?10:s.subclass===2?12:8)+(v.duration||0),x:a.positions?.hero??.25,y:0,nextStrike:2,cd:0,guard:0}));}s.servant=Math.max(0,...s.minions.map(m=>m.left));}
export function minionStrike(s,st,a,boss=false){if(s.hp<=0)return 0;const v=values('necro',s),pow=st.powers||{},before=a.enemyHp;for(const m of s.minions||[]){const role=servantRoles[m.role];if(a.enemyHp<=0)break;m.nextStrike=Math.max(0,(m.nextStrike??2)-1);if(m.nextStrike)continue;if(Math.hypot(m.x-(a.positions?.enemy??.75),(m.y??0)*.75)>role.reach+.025)continue;m.nextStrike=2;let dmg=st.damage*Math.min(.44,.24+(v.servant||0)+(pow.pact||0))*role.mult*(s.subclass===0?.76:s.subclass===1?1.12:1);if(s.subclass===1&&(a.effects.poison||a.effects.expose))dmg*=1.12;if(m.role==='archer'&&!m.cd){dmg*=1.3;m.cd=4;}if(m.role==='herald'&&!m.cd){effect(a,'slow',dmg,v,boss);m.cd=5;}a.enemyHp=Math.max(0,a.enemyHp-Math.max(1,Math.round(dmg)));}return before-a.enemyHp;}
