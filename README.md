# Neurops Tattoo

Site em React/Vite com painel administrativo. A API usa Hono, Prisma ORM, PostgreSQL e armazenamento de imagens compatível com S3.

## Rodar localmente

Requisitos: Node.js 22.18+, npm e um banco PostgreSQL acessível. Para publicar no Prisma Compute, instale também Bun e autentique o Prisma Platform CLI.

1. Instale as dependências: `npm.cmd ci` (no macOS/Linux, `npm ci`).
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_SECRET` e as quatro variáveis `S3_*`. Use um segredo de sessão aleatório com pelo menos 32 caracteres.
3. Aplique as migrações: `npm.cmd run db:deploy`.
4. Em um terminal, inicie a API: `npm.cmd run dev:api`.
5. Em outro terminal, inicie o Vite: `npm.cmd run dev`.
6. Abra `http://localhost:5173/` e acesse o painel em `http://localhost:5173/login`.

O Vite encaminha `/api` para a API local na porta 3000. O login do painel usa `ADMIN_USER` e `ADMIN_PASSWORD` do `.env`; a conta usada para entrar no Prisma Console/CLI não autentica no painel. Copie apenas o valor entre aspas no `.env`, sem as aspas. Se mudar a senha ou o usuário, reinicie a API.

O site mostra o conteúdo inicial até que o painel salve um documento no banco. Depois disso, textos, configurações e URLs das imagens ficam disponíveis para todos os visitantes. As imagens enviadas pelo painel vão para o armazenamento de objetos e são servidas pela API.

No painel, a seção Portfólio permite criar, renomear e excluir categorias, enviar várias imagens de uma vez, trocar cada trabalho de categoria e remover imagens. `Salvar alterações` persiste o conteúdo no PostgreSQL; ao abrir ou voltar para a página principal, ela busca a versão mais recente. `Restaurar` grava novamente o conteúdo padrão após confirmação.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm.cmd run build` | Gera o Prisma Client, compila o site e incorpora os arquivos estáticos na API. |
| `npm.cmd start` | Serve a API e o site na porta `PORT` (padrão: 3000). |
| `npm.cmd run db:migrate` | Cria/aplica migrações durante o desenvolvimento. |
| `npm.cmd run db:deploy` | Aplica as migrações existentes ao banco configurado. |
| `npm.cmd run lint` | Executa o ESLint. |

No macOS/Linux, use `npm` no lugar de `npm.cmd`.

## Publicação

O site está publicado em [Prisma Compute](https://s7e3a4d13fr61lrhlifcxim6.ewr.prisma.build/). A API e o site precisam ser servidos na mesma origem para a sessão do painel funcionar. As migrações são uma etapa separada do deploy: execute `npm.cmd run db:deploy` com a `DATABASE_URL` do ambiente correto antes de publicar uma mudança de esquema.

O comando abaixo foi usado para publicar a aplicação existente na branch `main`. Ele requer autenticação no Prisma Platform CLI e Bun disponível no `PATH`. A versão do CLI está fixada porque foi a versão com `app deploy` validada neste projeto.

```powershell
npm.cmd run build
npx.cmd --yes @prisma/cli@3.0.0-beta.30 app deploy --project proj_h9orsmszndpabbth7ide1nwv --branch main --app neurops --framework bun --entry server/index.ts --http-port 3000 --env .env --no-db --prod --yes
```

O arquivo `.env` contém a conexão com o banco e as credenciais do painel e do armazenamento. Ele é ignorado pelo Git e não deve ser enviado ao repositório. Use `.env.example` como referência para configurar outros ambientes. As credenciais antigas do painel estavam no código do navegador e não devem ser reutilizadas.

### Domínio na Hostinger

`neurops.com.br` ainda serve uma cópia estática do site na Hostinger. O build copia `public/.htaccess` para `dist/.htaccess` e também gera `dist/login/index.html` e `dist/admin/index.html` como alternativa para hospedagens que não aplicam as regras do Apache. Essas rotas redirecionam para a aplicação no Prisma Compute, onde o painel consegue acessar a API e manter a sessão. Publique todo o conteúdo de `dist` na raiz do site (`public_html`). O antigo `vercel.json` só se aplica à Vercel.

O conteúdo salvo no painel ainda não aparece na cópia estática da Hostinger, pois `/api/content` não existe nela. Para que todo o site use o mesmo banco e permaneça em `neurops.com.br`, configure esse domínio como domínio personalizado da aplicação no Prisma Compute e altere os registros DNS na Hostinger para o destino indicado pelo Prisma. Depois de verificar o domínio e o HTTPS, a cópia estática da Hostinger deixa de ser necessária.
