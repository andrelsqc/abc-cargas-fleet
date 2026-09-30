# ABC Cargas — frota leve v2

Aplicação Node.js/Express e PostgreSQL com autenticação, pátios, catálogo de veículos leves e indicadores de ciclo de vida.

Para atualizar a hospedagem pelo navegador, leia **ATUALIZAR_PELO_NAVEGADOR.md**. Não é necessário instalar programas no computador do usuário. Abra o endereço publicado, e não o HTML com duplo clique.

Na hospedagem, mantenha as variáveis DATABASE_URL, JWT_SECRET, NODE_ENV=production e SEED_PASSWORD. Comando inicial: `npm run db:migrate && npm run db:seed && npm start`.

Desenvolvimento local opcional: Node.js 20+, PostgreSQL disponível, `npm install`, configurar `.env`, executar a migração e iniciar o servidor. Os scripts Windows e Docker são apenas alternativas para desenvolvimento local.

`npm test` verifica métricas e validação.

A conexão automática com o rastreador exige uma implementação específica para o fornecedor. O mapa atual exibe a última posição manual claramente identificada. As estimativas de depreciação são gerenciais e os limites de renovação são editáveis.
