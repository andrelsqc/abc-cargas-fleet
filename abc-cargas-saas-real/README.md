# ABC Cargas — versão web 3

Node.js/Express e PostgreSQL. Frota leve, pátios, catálogo de modelos, reservas com aprovação, vistorias fotográficas e conferência de devolução.

Leia **ATUALIZAR_PELO_NAVEGADOR.md** para publicar no GitHub/Render e testar no celular. Não é necessário instalar programas no computador do usuário.

Inicialização: `npm run db:migrate && npm run db:seed && npm start`.

Variáveis existentes: DATABASE_URL, JWT_SECRET, NODE_ENV=production, SEED_PASSWORD. Opcional: PHOTO_QUOTA_MB (250 MB por empresa por padrão). DB_POOL_MAX permite ajustar o pool (10 por padrão).

`npm test` executa testes de métricas e validações. As reservas e fotos usam rotas próprias, autorização no servidor e gravações transacionais; não são importadas pelo sincronizador genérico de cadastros.

Fotos persistem em BYTEA, separadas do bootstrap. Reservas/inspeções não têm exclusão no aplicativo. Vistorias enviadas são preservadas ao pedir correção; mudanças de status são auditadas. O vínculo com veículos/contas é protegido por chaves estrangeiras.

A sessão permanece válida por até 8 horas. Cadastro de novas contas é permitido ao administrador; responsáveis aprovam; colaboradores fazem as vistorias designadas a eles.
