# Paridade com Ofícios da Nova Era

A revisão de referência é `9018633036cc60e20743e63038bdd3d7c5f8e71d`, cujo manifesto identifica a versão 0.45.0. O primeiro commit online no caminho até a branch atual é `b24ea4f`. A comparação abaixo usa o código da 0.45.0 e a base online `7b83218`, com a recuperação do desenho de coleta desta etapa.

| Área | Estado | Evidência ou lacuna |
| --- | --- | --- |
| Nome e vocação | Preservada | A criação oferece as cinco vocações e o servidor valida nome, vocação e unicidade. |
| Progressão e ficha | Parcial | Níveis, atributos, resets, maestria, subclasses, provações, juramentos, grimório, títulos e perfis têm caminhos online. Fórmulas, condições e apresentação ainda precisam de comparação por vocação. |
| Talentos e consumíveis | Parcial | O servidor aplica pré-requisitos, graduações, rotação, condições, mana, recargas, custo de reset, poções e elixires. Falta conferir cada habilidade, condição e sinergia contra o legado. |
| Inventário e equipamentos | Parcial | Há slots, raridades, qualidade, afixos, conjuntos, comparação, filtros, proteção, depósito, runas, relíquias e desmontagem. Falta verificar tabelas, combinações e tooltips item a item. |
| Ofícios | Parcial | Coleta, maestria, ferramentas, forja, alquimia, joalheria e serviços de aprimoramento passam pelo servidor. A cena usa as formas, cores e distribuição de 18 nós do legado, com alvo marcado e movimento visual. A equivalência de receitas, especializações e percurso no mapa continua pendente. |
| Mundo | Parcial | Vespera usa a área navegável da 0.45.0, com colisão com NPCs, caminhada por teclado e rotas por clique. Os serviços continuam ligados ao servidor. O cliente tem atlas, caçadas, dungeons, chefes, torre, bestiário, eventos e treinamento. Falta comparar câmera, posicionamento de NPCs, progressão de salas e eventos. |
| Combate | Parcial | O servidor calcula movimento e alcance em dois eixos nas arenas e mantém a faixa horizontal da caça. Lacaios ocupam lados distintos do alvo. Estados, fases e retorno à cidade na derrota continuam no servidor. Falta comparar as manobras de recuo, os encaixes dos lacaios, a cadência e os efeitos com a 0.45.0. |
| Registros e progresso offline | Parcial | Há registro da aventura, histórico, Hunt Analyzer e recuperação de tempo no servidor. Falta comparar as métricas, a cadência e os limites da simulação. |
| HUD e janelas | Parcial | Há orbes, barra de habilidades, zoom, minimapa e janelas simultâneas com arraste, redimensionamento e memória de layout. A edição da HUD permite mover módulos, escolher quais exibir e restaurar o layout. A barra de combate é movida como um conjunto. A câmera acompanha o personagem nos dois eixos com a âncora vertical da 0.45.0. Iluminação, chuva, neve e cinzas foram recuperadas, com respeito à preferência por movimento reduzido. Falta comparar a projeção completa da câmera, as animações e a disposição em resoluções diferentes. |
| Persistência do legado | Incompatível com importação direta | O save local era alterável pelo jogador. A persistência online parte de estados criados e atualizados pelo servidor. |
| Sistemas adicionados no online | Preservados nesta etapa | Contas, recuperação, sessões, mercado, ranking, SQLite, Docker, túnel e rotinas de backup permanecem no fluxo existente. |

A próxima comparação funcional do combate deve medir posição, alcance, cadência, dano, estados e sequência de encontros sob as mesmas condições iniciais em cada motor. Isso permite identificar quais regras podem ser portadas separadamente, mantendo a progressão no servidor. A comparação visual deve incluir cidade, caça, dungeon e as três profissões de coleta, com janelas e HUD abertos nas mesmas resoluções.
