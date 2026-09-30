# ABC Cargas SaaS — Arquitetura Real v1.1

Aplicação web do ABC Cargas com dashboard **Pixel First**, backend Node.js/Express, PostgreSQL, autenticação por sessão HTTP-only e isolamento multiempresa.

## IMPORTANTE: como abrir o sistema

**Não abra `public/index.html` com duplo clique.** Isso executa o navegador em `file://` e o navegador não consegue acessar a API do backend, causando `Failed to fetch`.

No Windows, com **Node.js 20+** e **Docker Desktop** instalados:

1. Execute `INICIAR_ABC_CARGAS.bat`.
2. O script instala as dependências, sobe o PostgreSQL, cria o banco, insere os dados de demonstração e inicia o backend.
3. O navegador será aberto em:

`http://localhost:3000`

Alternativamente, no PowerShell:

```powershell
.\INICIAR_ABC_CARGAS.ps1
```

## Execução manual

```powershell
Copy-Item .env.example .env
npm install
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm start
```

Depois acesse `http://localhost:3000`.

## Usuário inicial de demonstração

- E-mail: `michele@abccargas.local`
- Senha: `ABC@123456`

Troque a senha antes de qualquer uso real.

## Arquitetura

- `public/index.html` — interface Pixel First e integração com a API.
- `server/index.js` — servidor web, autenticação e API.
- `server/db.js` — conexão PostgreSQL.
- `server/migrate.js` — criação do schema.
- `server/seed.js` — empresa, usuário e dados de demonstração.
- `db/schema.sql` — banco relacional.
- `docker-compose.yml` — PostgreSQL local.
- `INICIAR_ABC_CARGAS.bat` — inicialização simplificada no Windows.

## API principal

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/bootstrap`
- `POST /api/state/sync`
- `GET /api/users`
- `POST /api/users`
- `GET /api/health`

## Observação

O login usa cookie HTTP-only e o dashboard é servido pelo próprio Express. Assim, front-end e API usam a mesma origem (`http://localhost:3000`), evitando o problema de CORS e de `file://`.
