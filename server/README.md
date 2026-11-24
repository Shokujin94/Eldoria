# Eldoria Online — prévia técnica (0.46.0)
**Não mesclar/publicar como substituto do jogo atual ainda.** Este é um protótipo autoritativo com interface própria e ciclo simplificado de caçada, coleta, forja e equipamentos. O motor completo anterior (mapa, talentos, subclasses, dungeons, bosses, runas, efeitos e demais mecânicas) ainda precisa ser portado para o servidor. O HTML anterior foi preservado em docs/legacy-client.html, não publicado pelo exportador. O novo index não carrega os scripts do motor antigo.

## Executar
Node 22.13+ (SQLite nativo). Na raiz, execute python -m http.server 8000; em outro terminal, cd server && npm test && npm start. Configure onlineApi em config/conteudo.js para http://localhost:8787. Em produção, HOST=0.0.0.0, PORT conforme hospedagem, DB_PATH em volume persistente, ALLOWED_ORIGINS=https://shokujin94.github.io (origem exata), proxy HTTPS, backups e limites por IP real. GitHub Pages serve apenas frontend; nunca publicar a base SQLite. Nenhum serviço de hospedagem foi provisionado.

## Segurança e progresso
Conta e senha (scrypt com salt, sessões opacas com hash e validade, token somente em memória do navegador). Uma conta por personagem, nomes únicos. Não há endpoint de importação, exportação ou upload de estado. Todos os ganhos e modificações vêm de ações validadas e relógio do servidor. O frontend elimina chaves conhecidas de saves antigos e não lê ou grava saves locais; sem API, não joga. A simulação idle do protótipo é calculada sob demanda pelo servidor, limitada a duas horas por intervalo, sem duplicar o tempo. Não migra personagens locais, pois são adulteráveis. Ranking lê último estado processado; não é um tick global de todos os personagens. Recuperação de senha, verificação de conta, monitoramento, integração do motor completo e testes de carga ainda pendentes.

## Economia
Anúncio em custódia, itens de aprendiz/equipados excluídos, máximo 30 anúncios, compra/cancelamento transacionais. Taxa em pontos-base: min(1200, 300+4*(nível-1)+80*raridade+origem), origem: caça 0, craft 50, dungeon 100, boss 200. Arredonda para cima; só queima na venda, sem taxa de cancelamento. Ouro não pertence a nenhuma conta após a queima. O protótipo só gera itens de caça/forja; dungeons e bosses são origens reservadas para integração.

## Ranking
Nível (XP desempata), Combat Power = 10*nível + soma do poder dos itens equipados ponderado pela raridade [1,1.25,1.65,2.15,2.85]. Poder do item calculado de atributos efetivos no servidor. Profissões soma e individual (Mineração, Lenhador, Herbalismo, Fabricação), recursos coletados totais e por profissão. Desempate restante pelo nome normalizado. Listas de 50, sem dados de credenciais. Sem bônus por item guardado ou anunciado.
