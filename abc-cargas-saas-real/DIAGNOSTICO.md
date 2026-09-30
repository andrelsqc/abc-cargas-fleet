# Diagnóstico ABC Cargas Fleet SaaS

O HTML e a imagem Pixel First permanecem idênticos ao pacote original.

Validação executada em Node.js 24 e PostgreSQL 16 isolado (o Docker Compose original prevê PostgreSQL 17).
- Migração e seed: aprovados.
- GET /api/health: HTTP 200, banco online.
- Bootstrap sem sessão: HTTP 401.
- Login demonstrativo: aprovado, cookie HTTP-only emitido.
- Bootstrap autenticado: 10 veículos, 6 motoristas, 4 manutenções, 3 abastecimentos e 3 notificações.
- Sincronização: HTTP 200; edição confirmada em nova leitura do PostgreSQL e restaurada ao valor original.
- Logout: aprovado; bootstrap posterior retorna HTTP 401.
- JavaScript do front-end e backend: sintaxe aprovada.

Correções desta revisão
- Inicializador BAT usa call para retornar das chamadas npm.
- Inicializadores aguardam pg_isready em vez de depender apenas de pausa fixa.
- PowerShell interrompe em erros de comandos externos.
- Seed preserva organização existente e não recria nem sobrescreve os dados nas próximas inicializações.
- Seed executado duas vezes após a correção: apenas uma organização no banco.

Limites da validação
Não foi possível instalar o navegador automatizado neste ambiente. Login visual, navegação, F5, responsividade e comparação visual com a V5 ainda precisam ser validados. Os scripts Windows e o Docker Compose foram revisados, mas não executados em Windows/Docker. Esta revisão não substitui a V5 como baseline aprovada.

Execução no Windows
Extraia o pacote em uma pasta nova. Com Node.js 20+ e Docker Desktop ativos, execute INICIAR_ABC_CARGAS.bat. Abra http://localhost:3000. Credenciais demonstrativas estão no README.md. Confira também http://localhost:3000/api/health. Valide login, navegação, edição, F5 e logout.
