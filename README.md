# Crônicas de Eldoria — GitHub Pages

Projeto de RPG idle em HTML, CSS e JavaScript. Base 0.38, preparada para publicação automática.

## Publicar pela primeira vez (Windows)

1. Instale GitHub Desktop e entre na sua conta GitHub.
2. Extraia o ZIP inteiro. Em File > Add Local Repository, selecione a pasta que contém `index.html` (incluindo `.github`). Se o Desktop informar que não é um repositório Git, use o link para criar um repositório nessa pasta. Não crie uma pasta extra dentro dela.
3. Clique Publish repository, nome `eldoria`, desmarque Keep this code private se estiver usando GitHub Free e aceite que os arquivos serão públicos.
4. No repositório pelo navegador, Settings > Pages > Build and deployment > Source: GitHub Actions.
5. Em Actions > Publicar Eldoria > Run workflow, escolha main. Depois confira o endereço em Settings > Pages.

## Atualizações

Edite a pasta original; teste com `JOGAR-LOCAL.bat` (Python 3). No GitHub Desktop, revise Changes, descreva a atualização, faça Commit to main e Push origin. O workflow exporta `public`, valida as referências estáticas e publica somente os arquivos do jogo. Cada execução recebe um identificador de versão exclusivo, por exemplo `0.38-gh12-1`. Para uma nova versão base, edite `version.json` e o campo `versao` em `config/conteudo.js`; não edite o `public` gerado. O jogo consulta o manifesto de versão e oferece salvar e atualizar.

## Atenção

Não envie saves, tokens ou senhas para o GitHub. O código do jogo é público. Os saves continuam no navegador: exporte antes de trocar de domínio ou importar outra versão. Esta versão é single-player, sem login ou backend. Não é hospedagem adequada para um MMO comercial. Para detalhes de edição, leia `LEIA-ME.md`.


## Desenvolvimento online 0.46.0
A branch de desenvolvimento online possui uma prévia de servidor autoritativo, sem saves locais. Consulte [server/README.md](server/README.md) antes de publicar; o motor completo ainda requer integração. Não substituir a versão atual até completar testes.
