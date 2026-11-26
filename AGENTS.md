# AGENTS.md — Eldoria

## 1. Missão

Eldoria é um Idle MMORPG. Evolua o jogo preservando a experiência original e integrando os sistemas online. A referência visual e funcional é https://shokujin94.github.io/Eldoria/ e, quando disponível, a última revisão estável anterior à migração online. A referência não deve substituir os sistemas multiplayer já implementados.

## 2. Regras de trabalho

- Responda em português brasileiro, de forma direta. Resuma o plano e priorize a execução.
- Antes de alterar código, inspecione a estrutura, README, configurações, dependências, histórico Git e alterações locais. Não presuma a stack, portas ou comandos.
- Identifique a revisão estável anterior à migração online pelo histórico e pela comparação funcional; não escolha um commit arbitrário.
- Preserve alterações do usuário e de outros agentes. Não use reset --hard, clean -fd, force push ou sobrescrita indiscriminada.
- Faça alterações completas, pequenas quando possível, coerentes com a arquitetura existente. Evite reescrever sistemas funcionais sem necessidade.
- Não invente resultados de testes, commits, merges ou deploys. Informe bloqueios e decisões não especificadas.
- Não interrompa a execução por escolhas técnicas reversíveis; peça confirmação quando houver risco de perda de dados, mudança de escopo ou operação destrutiva.

## 3. Prioridade atual: paridade funcional e visual

1. Inventarie as funcionalidades da versão original e da versão online.
2. Compare telas, HUD, navegação, estados, eventos, dados e regras de jogo.
3. Classifique cada funcionalidade como preservada, ausente, parcial ou incompatível.
4. Restaure o que estiver faltando, adaptando persistência e operações à arquitetura online.
5. Valide o conjunto antes de publicar. Não substitua o jogo por uma versão simplificada ou um protótipo.

Use a referência original para layout, esquemas, posicionamento e comportamento. Integre mercado, conta e demais recursos online na mesma linguagem visual. Em caso de conflito entre fidelidade e segurança, preserve a segurança e adapte a implementação sem descaracterizar a interface.

## 4. Interface e identidade visual

- Preserve a temática, paleta, hierarquia, sprites e organização das janelas existentes.
- HUD limpa, compacta, com informações essenciais e sem fundos sólidos excessivos.
- Inventário, personagem, talentos e demais janelas devem ser intuitivos, consistentes e fáceis de ler.
- Informações detalhadas em tooltips; não esconda ações essenciais.
- Mantenha alinhamento independente do tamanho dos textos. Verifique overflow, escala e resolução.
- Preserve a definição do mapa e dos sprites. Evite ampliação borrada e compressão desnecessária; use renderização adequada ao estilo dos assets.
- Não altere globalmente o design quando o pedido se limitar a uma janela.
- Mercado e segurança da conta devem seguir o padrão visual do jogo, sem interfaces desconectadas.

## 5. Mecânicas de jogo

Preserve e teste todos os sistemas existentes, inclusive os não enumerados aqui. Os itens abaixo são requisitos conhecidos, não uma descrição exaustiva da implementação atual.

| Sistema | Diretriz |
| --- | --- |
| Personagem | Permitir inserir nome na seleção de vocação; validar também no servidor. |
| Vocações | Identidade própria, habilidades ativas e passivas distintas, profundidade e sinergias. |
| Talentos | Leitura simples, cores por vocação, ícones coerentes, tooltips e reset com custo em gold baseado no nível. |
| Caça | Escala personagem/monstro semelhante à das dungeons; evitar sobreposição de sprites. |
| Lacaios | Escala proporcional e movimentação capaz de alcançar o alvo sem travar entre personagem e monstro. |
| Morte | Retornar à cidade após morrer em caça, dungeon ou boss. |
| Coleta | Sprites coerentes com o material coletado. |
| Inventário e progressão | Preservar regras, itens, atributos, recompensas e dados existentes. |
| Mercado | Integrar à economia e ao layout, com transações seguras e consistentes. |

Não rebalanceie valores, remova conteúdo ou altere fórmulas sem necessidade ou solicitação. Reutilize as fontes de dados existentes e evite duplicar regras entre sistemas.

## 6. Multiplayer e arquitetura online

- O computador do proprietário será inicialmente o servidor do Eldoria, permitindo acesso simultâneo de outros jogadores.
- Cadastro aberto, sem exigência de convite.
- O servidor deve ser a autoridade sobre progressão, combate, recompensas, inventário, gold, mercado e demais estados que afetem a economia ou outros jogadores.
- Nunca confie em valores enviados pelo cliente para conceder recursos, definir dano ou confirmar transações.
- Valide identidade, autorização, propriedade, limites e entradas em cada operação relevante.
- Preserve a persistência após reconexão e reinício. Trate sessões concorrentes, desconexões, mensagens duplicadas e condições de corrida.
- Mantenha dados de jogadores isolados. Compartilhe somente estados públicos necessários ao multiplayer.
- Reutilize os mecanismos de comunicação e armazenamento existentes quando adequados. Não imponha uma nova stack sem justificativa.
- GitHub Pages pode hospedar o frontend estático, mas não substitui o servidor de jogo. Confirme a topologia efetiva antes de modificar deploy ou URLs.

## 7. Segurança e economia

- Senhas devem ser armazenadas com hash seguro (por exemplo, Argon2id ou bcrypt), nunca em texto puro.
- Proteja sessões e tokens, aplique expiração e autorização no servidor. Não registre senhas ou tokens em logs.
- Use HTTPS/WSS em acesso público, configuração de origem restrita e proteção contra abuso, conforme a arquitetura.
- Segredos em variáveis de ambiente; nunca no Git, frontend ou arquivos de exemplo com valores reais.
- Mercado: valide saldo, propriedade, quantidade e preço. Garanta atomicidade entre débito, crédito e transferência; impeça duplicação, saldo negativo e compra concorrente do mesmo anúncio.
- Valide nomes, mensagens e demais entradas; escape conteúdo exibido e use consultas parametrizadas quando aplicável.
- Não exponha banco de dados, interfaces administrativas ou serviços internos à internet.
- Antes de migrações, faça backup e defina recuperação. Não apague contas ou saves para resolver incompatibilidades.

## 8. Git e publicação

- Repositório de referência: https://github.com/shokujin94/Eldoria (confirme o remote real).
- Branch principal esperada: main. Confirme a branch e o fluxo atual antes de trabalhar.
- Inspecione git status, git diff, git log e git remote -v antes de integrar mudanças.
- Use commits descritivos e focados. Preserve histórico e resolva conflitos por intenção funcional, não aceitando automaticamente um lado inteiro.
- Não faça merge ou push automaticamente sem autorização aplicável. Quando solicitado, valide a integração antes de publicar na main.
- Não confunda publicar o código no GitHub com atualizar o processo que roda na máquina do proprietário.
- Ao concluir uma atualização destinada ao online, forneça o bash exato para atualizar e testar o servidor, baseado nos scripts e serviços reais do projeto. Não invente comandos, caminhos ou nomes de serviços.
- Inclua etapas de backup, migração, reinício e rollback quando pertinentes. Nunca inclua segredos nos comandos compartilhados.

## 9. Validação obrigatória

Execute os testes, lint, build e verificações existentes que forem pertinentes. Quando não houver automação, faça testes manuais ou descreva claramente os passos ainda pendentes.

- [ ] Layout comparado com a referência original, incluindo janelas e HUD.
- [ ] Cadastro, login, seleção de vocação e nome do personagem.
- [ ] Inventário, talentos, habilidades, coleta e progressão.
- [ ] Caça, dungeon, boss, lacaios e retorno à cidade após morte.
- [ ] Mercado: anúncio, compra, cancelamento e operações concorrentes.
- [ ] Dois jogadores simultâneos, isolamento de dados e sincronização.
- [ ] Reconexão, persistência e reinício do servidor.
- [ ] Rejeição de operações não autorizadas e entradas inválidas.
- [ ] Ausência de erros relevantes no console e nos logs.
- [ ] Build e procedimento de atualização compatíveis com o ambiente real.

Adapte a lista ao escopo da mudança, sem declarar itens não executados como aprovados. Para mudanças transversais ou restauração integral, valide a lista completa.

## 10. Critério de conclusão e comunicação

Uma tarefa está concluída quando a implementação solicitada funciona, as regressões relevantes foram verificadas e as limitações restantes estão explicitadas. Não considere apenas a aparência ou um build bem-sucedido como prova de paridade funcional.

Na resposta final, informe resumidamente:

1. O que foi implementado ou corrigido.
2. O que foi efetivamente testado e seu resultado.
3. Pendências, bloqueios, riscos e decisões tomadas sem orientação explícita.
4. Commit, merge e publicação, somente se realmente executados.
5. Bash de atualização e teste, quando pertinente.

## 11. Hierarquia de decisões

Respeite instruções explícitas mais recentes do proprietário e instruções aplicáveis ao diretório. Use o código, histórico e configurações reais como fonte da verdade técnica. Este arquivo consolida objetivos e restrições; não comprova que determinada funcionalidade já esteja implementada.

## 12. Fluxo de trabalho no Trello

O quadro de trabalho do projeto é [Elorian](https://trello.com/b/FA00MHIV/elorian).

1. Consulte o quadro no início de cada rodada de desenvolvimento. Retome primeiro os cartões em **Desenvolvimento** ou **Teste**. Ao escolher uma nova tarefa, priorize as etiquetas de **Pronto Para Iniciar** e use a ordem da lista em caso de empate. Prioridades explícitas do proprietário e dependências entre cartões prevalecem. **Backlog** reúne trabalho ainda em preparação.
2. Leia a descrição, os checklists, os anexos relevantes e os comentários recentes. Use os requisitos da descrição para validar a entrega, inclusive quando o título for genérico. Acompanhe cada tarefa no cartão existente.
3. Mova o cartão para **Desenvolvimento** ao começar e para **Teste** quando a implementação estiver pronta para validação. Registre progresso parcial e bloqueios no cartão. Mantenha o cartão na etapa correspondente enquanto houver trabalho ou verificação pendente.
4. Após validar a mudança, comente no cartão o que foi entregue, como foi implementado, problemas encontrados e corrigidos e quais testes foram executados com seus resultados. Inclua o commit e o resultado da publicação quando aplicável. Marque os itens de checklist que foram comprovados.
5. Marque o check de conclusão do cartão e mova para **Concluido** apenas depois de atender aos requisitos e verificar a publicação quando o cartão afetar o jogo público. Se o Trello estiver indisponível, informe o bloqueio e continue o trabalho local que puder ser verificado.

**Prioridade dos cartões:** vermelho = P1 Alta, laranja = P2 Média-alta, amarelo = P3 Média, verde = P4 Baixa.
