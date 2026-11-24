# Beta privada — Eldoria
## Pré-requisitos
VPS Linux com Docker Engine e Compose v2, Git, DNS de domínio apontado para o IP da VPS. Para piloto pequeno, 2 vCPU / 4 GB RAM / SSD 40 GB é ponto de partida, não garantia de capacidade. SSH por chave; firewall do provedor permite 80/443 e SSH restrito. Não exponha 8787. Não copie senhas ou códigos para Git.
## Instalação
Clone a branch eldoria-online-0460. Crie .env (ignorado pelo Git) com ELDORIA_DOMAIN=seu-hostname, REGISTRATION_MODE=closed. Rode:
```sh
docker compose -f compose.yaml -f compose.public.yaml up -d --build --wait
docker compose -f compose.yaml -f compose.public.yaml ps
```
Teste https://SEU_HOST/health, login e jogo. HTTPS depende do DNS e portas públicas. A configuração mantém a base no volume eldoria-data.
## Convites
Para abrir cadastro de beta, gere um segredo forte com openssl rand -hex 24. Guarde o segredo privado; calcule seu SHA-256 com printf '%s' "$CONVITE" | sha256sum. No .env defina REGISTRATION_MODE=invite e BETA_INVITE_SHA256=<digest de 64 caracteres>. Recrie os serviços com o comando acima. O código é compartilhado entre convidados, não individual; rotacione quando necessário ou feche os cadastros. Contas existentes continuam entrando no modo closed. Nunca coloque o segredo em Git.
## Backup e atualização
bash scripts/beta-backup.sh cria cópia verificada em ~/eldoria-backups (ou ELDORIA_BACKUP_DIR). Copie para armazenamento externo privado e configure retenção. Para atualização: bash scripts/beta-update.sh. O script exige branch correta, árvore limpa, backup e fast-forward. Não executa reset. Não há rollback automático. Agende backups no cron da VPS após validar manualmente. Não execute docker compose down -v.
## Antes de convidar jogadores
Teste recuperação de conta, transferência de mercado, integridade e restauração de backup em ambiente isolado, desempenho HTTP e carga real, logs, privacidade e termos. A base local de testes não é automaticamente transferida. Decida se o beta inicia vazio ou importa a base de teste por backup verificado. Não há VPS ou domínio provisionado.

## Verificação de carga isolada
Na VPS de teste, sem utilizar o banco real, execute `cd server && npm run load:http -- 12 8` (Node 22.13+). Para outro cenário, ajuste clientes (1–40) e rodadas, mantendo até 450 consultas. O script cria e remove seu próprio SQLite e servidor localhost. Avalie p95, erros e vazão; teste com carga realista antes de ampliar a beta. Não é prova de capacidade em produção.
