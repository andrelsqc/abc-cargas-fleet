# ABC Cargas Fleet Control — versão 4

Aplicação Express/Node/PostgreSQL para frota leve, com pátios, reservas aprovadas, retirada/devolução com fotos, conferência, dossiês PDF e controle de CNH. Layout branco e vermelho preservado.

Consulte **ATUALIZAR_PELO_NAVEGADOR.md** para publicar no GitHub/Render sem instalar aplicativos.

## Execução

Requer Node.js compatível (produção já configurada), PostgreSQL e variáveis DATABASE_URL, JWT_SECRET, NODE_ENV e SEED_PASSWORD. Instale as dependências com `npm ci`; execute `npm run db:migrate && npm run db:seed && npm start`. Migrações idempotentes e seed preservam os dados existentes. Nunca envie .env ou senhas ao GitHub.

Dependências novas nesta versão: PDFKit para relatórios PDF. Sharp já era usado na versão 3 e converte as fotos para o PDF. As credenciais do serviço oficial de consulta CNH não são exigidas: não existe integração externa nesta entrega.

## Testes

`npm test` executa 11 testes de regras de CNH, métricas e validação. A validação adicional de API e navegador está descrita em VALIDACAO.md.

## Dados

Fotos permanecem no PostgreSQL, separadas dos cadastros, com limite por empresa definido por PHOTO_QUOTA_MB (padrão 250). DB_POOL_MAX é opcional (padrão 10). O PDF é gerado sob demanda, exige autenticação e não fica gravado no disco do Render. Reservas canceladas, vistorias e versões corrigidas continuam preservadas.

O backup JSON de Configurações mantém o formato de cadastros da versão 2, incluindo os novos campos quando presentes. Não contém contas, reservas ou fotos. Para recuperação integral, mantenha backup do PostgreSQL.

As 24 ilustrações do catálogo inicial são representações por modelo. Modelos adicionais aceitam ilustração cadastrada; sem ela utilizam a figura de categoria.
