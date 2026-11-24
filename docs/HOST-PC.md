# Hospedar Eldoria no próprio computador (Windows + Docker Desktop)
## Acesso local
Abra Docker Desktop, Git Bash e execute na pasta Eldoria-Online: `docker compose up -d --build --wait`. Acesse http://localhost:8787. A porta 8787 continua ligada apenas a 127.0.0.1, não ao roteador. O volume existente é preservado.
## Acesso externo temporário
`bash scripts/share-start.sh` faz backup, inicia Cloudflare Quick Tunnel, identifica a URL HTTPS e autoriza somente essa origem pública e as origens locais. O IP de visitante é aceito apenas do endereço interno do container de túnel. Cadastro aberto, sem convite. Compartilhe a URL exibida apenas após a validação. Quick Tunnel é serviço de teste, sem SLA, com URL variável a cada reinício e limite de 200 requisições em voo (não equivale a jogadores). Não há redirecionamento de portas. Cloudflare termina TLS e atua como intermediário. É necessário acesso à internet.
`bash scripts/share-status.sh` consulta URL e saúde. `bash scripts/share-stop.sh` encerra acesso externo sem apagar dados. Não use down -v. Se atualizar o jogo, encerre primeiro o túnel, use beta-update.sh e execute share-start.sh novamente (novo link). O túnel não reinicia automaticamente: após desligamento do PC, abra Docker Desktop e execute share-start.sh.
## Segurança e disponibilidade
Mantenha Windows e Docker atualizados, não compartilhe senhas/backups, não publique outros serviços. Enquanto o computador estiver desligado, suspenso, sem internet ou Docker parado, ninguém consegue jogar. O progresso offline segue as regras e limites do servidor. Abertura pública permite cadastro a qualquer pessoa que encontre o endereço; há limites de requisições e autenticação, mas ainda não há moderação completa ou mitigação de abuso suficiente para grande lançamento. Teste inicialmente com poucos jogadores. Não há garantia de capacidade baseada no teste CI. Um domínio próprio e túnel nomeado são alternativas posteriores para endereço permanente, ainda usando o PC como servidor.

Para atualizar a imagem antes do compartilhamento, execute `bash scripts/beta-update.sh` com o jogo local ativo. O campo de convite fica oculto quando o cadastro é aberto.

### Atualizar sem perder progresso
Se estiver compartilhando o jogo, avise os jogadores e execute `bash scripts/share-stop.sh`, depois `bash scripts/beta-update.sh` e por fim `bash scripts/share-start.sh`. O link temporário muda. Não use `docker compose down -v`.

### Atualização com o túnel ativo (0.47.7)
Após obter a nova versão do script com `git pull --ff-only`, use `bash scripts/share-update.sh` para backup, atualização, build e reinício somente do serviço eldoria. O túnel fica ativo, portanto o endereço normalmente permanece igual. Existe breve interrupção e pode ser necessário entrar novamente. Se o túnel estiver parado, use beta-update.sh e share-start.sh. Nunca use down -v.
