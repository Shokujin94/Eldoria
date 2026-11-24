# Crônicas de Eldoria 0.38 — Fundação Web

## Jogar e editar localmente
1. Extraia o ZIP em uma pasta de trabalho. Mantenha um backup do save anterior (Gestão > Exportar).
2. Windows: execute JOGAR-LOCAL.bat (requer Python 3). Alternativa: no terminal, dentro da pasta, execute `python -m http.server 8000 --bind 127.0.0.1`.
3. Abra `http://localhost:8000`. Importe seu save pela Gestão. Use sempre o mesmo endereço/porta para manter o save local.
4. Edite `config/conteudo.js`, salve e recarregue. Use VS Code ou outro editor de texto. Não use Word.

## Publicar em um domínio
Este é um jogo estático (HTML/CSS/JS), sem servidor de contas. Você pode usar um host estático que suporte HTTPS e domínio personalizado, como Cloudflare Pages, Netlify ou GitHub Pages. Crie um projeto no provedor, configure a pasta de publicação como `public` se usar a exportação abaixo e conecte o domínio conforme as instruções de DNS fornecidas pelo próprio host. Não há instalação ou download para o jogador.

Para produzir uma atualização: `python tools/publicar.py --versao 0.38.1 --saida public` (a saída precisa estar vazia). Envie **o conteúdo** da pasta public para o mesmo site ou configure o pipeline Git para executar esse comando e publicar essa pasta. O exportador versiona os arquivos e cria version.json. Mantenha a URL e HTTPS constantes. A página verifica version.json a cada minuto, avisando quando há versão diferente; o jogador pode salvar e recarregar. Não há recarga forçada nem atualização de saves no servidor. Ao mudar de versão, arquive o pacote anterior e use outro diretório vazio para exportar (ex.: `--saida ../public-039`).

## Onde alterar
- `config/conteudo.js`: multiplicadores globais, atributos de classe, monstros, habilidades base, passivas, novas habilidades, nomes de itens e mapas alternativos.
- `docs/CATALOGO.json`: IDs e valores de referência do motor. Os números de monstros são base, antes de escalas de combate; habilidades são linhas [id,nome,ícone,mana,recarga,potência,cura,guarda].
- `docs/ARTES-POR-NOME.json`: nome ou ID → caminho exato da imagem. A chave de equipamento pode ser o nome anterior, preservado para arte; consulte os pares em CATALOGO.json. Para sprites femininas use sufixo _f. Mapas são city, zone0–zone9 e crypt0–crypt9.
- `assets/maps/`: mapas WebP e miniaturas. Substitua pelos arquivos novos de mesmo nome ou informe o caminho em config.maps (miniaturas são arquivos próprios). Mantenha perspectiva, proporção e faixa de chão.
- `assets/images/`: sprites/ícones PNG identificados por hash; use ARTES-POR-NOME.json para localizar. Substitua preservando dimensões/proporções, fundo transparente para sprites e nome/extensão do arquivo.
- `css/refino.css`: últimos ajustes de layout, HUD e tooltips; demais CSS são estilos legados.
- `js/`: scripts clássicos ordenados por dependências. 01 = motor e conteúdo inicial; 12/15 = combate/economia/persistência; 17 = Necromante/runas; 19 = talentos e áudio; 20 = navegação; 21 = VFX; 22 = HUD; 23 = catálogo/bestiário; 38 = integração e configuração. Não troque a ordem em index.html.

## Exemplos de configuração
Para acelerar XP 10% em relação à exigência atual, mude xpRequired para 0.9 (não altera XP por monstro). Para aumentar chance base de equipamento em 20%, mude loot para 1.2; não muda as raridades condicionais.
Em enemies, use `wolf: {hp:48, atk:7, xp:15, gold:6}`; valores são anteriores à escala do encontro. Em skills, use `mage: {x:{mana:9, cd:5, power:1.25, effects:['burn']}}`. IDs de efeito: bleed, burn, poison, stun, freeze, slow, expose, shock. Habilidades comuns mantêm escala de graduação; asc2 ainda depende da tabela específica de subclasse no motor.
Em newSkills, use a estrutura de exemplo comentada no config. IDs novos devem começar com custom_, ter nome único e usar efeitos existentes. branch 0 a 2; level = requisito; requires = IDs de talentos existentes (opcional). Novas habilidades usam a família visual da vocação como ponto de partida. Para passivas, use ID do catálogo de passivas e valor numérico (fração para percentuais) e atualize a descrição simultaneamente.

## Limites e segurança
Saves ainda ficam no navegador por domínio/origem; não há login, sincronização entre dispositivos, economia compartilhada, multiplayer ou proteção contra alteração pelo jogador. O código enviado ao navegador é público. Não publique arquivos de personagem, senhas ou chaves. A migração mantém os IDs e a chave de save, mas em um domínio novo é necessário importar o save exportado. O launcher Python de disco anterior não integra esta versão web; exportação/importação continuam disponíveis. Para tornar o jogo MMO ou com ranking confiável, o próximo estágio exige backend autoritativo, autenticação, banco de dados e migração de regras.

A separação é incremental: os arquivos legados ainda compartilham variáveis globais. Novas regiões, espécies adicionais, classes e mecânicas totalmente novas ainda requerem mudanças de motor. Não existe editor administrativo online ou gerenciador de conteúdo visual nesta versão. As artes ampliadas da 0.37 são preservadas; a renderização de terreno em resolução física reduz a perda de definição, mas não inventa detalhe original ou garante 4K nativo.
