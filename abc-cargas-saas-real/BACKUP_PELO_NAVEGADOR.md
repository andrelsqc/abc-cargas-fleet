# Etapa 1 — backup, sem limpeza

1. Publique TODO este pacote no repositório e serviço ATUAIS, como nas atualizações anteriores. Este é o pacote v4-backup, NÃO o pacote Ambiente Separado Vazio.
2. Mantenha DATABASE_URL, JWT_SECRET, NODE_ENV e SEED_PASSWORD atuais. Build: npm ci. Start: npm run db:migrate && npm run db:seed && npm start.
3. Aguarde Live, entre no sistema como Michele com a senha atual.
4. Abra https://abc-cargas-fleet.onrender.com/manutencao.html no mesmo navegador.
5. Confirme a senha atual e clique em Baixar backup completo da empresa.
6. Confirme o arquivo .sql na pasta Downloads e guarde uma segunda cópia protegida.
7. Retorne à conversa informando que baixou o arquivo. O backup de referência já foi restaurado em ambiente isolado. Siga LIMPEZA_PASSO_A_PASSO.md.

## Conteúdo e limites
Backup lógico completo dos registros da empresa desta conta: organização, configurações, todos os usuários (com hashes, sem senhas legíveis), veículos, pátios, motoristas, manutenção, combustível, notificações, reservas, vistorias, fotos e decisões.
Inclui esquema de aplicação v4 e SQL de restauração. Não é pg_dump do servidor PostgreSQL: não exporta roles do servidor, outras empresas, extensões externas, infraestrutura Render ou tabelas não previstas no pacote. Código e imagens do catálogo ficam neste pacote/GitHub e também devem ser guardados.
A exportação lê uma fotografia consistente do banco. Registros posteriores não entram no arquivo. Evite uso operacional entre o backup final e a limpeza futura.
O marcador final indica download completo, não comprova restauração. A restauração ainda deverá ser testada. Arquivo sensível: não envie ao GitHub ou a serviços públicos.

## Restauração técnica
Em PostgreSQL exclusivo e vazio, executar o SQL completo com ferramenta que suporte transação e parar em erro. O arquivo cria esquema v4 e reinsere UUIDs, hashes, fotos e relacionamentos, ajustando a sequência dos eventos. Não executar sobre o banco atual ou sobre cadastros novos. Uma restauração de homologação deve verificar login, quantidades e fotos.
Este pacote inclui limpeza manual após novo backup. Siga LIMPEZA_PASSO_A_PASSO.md. Nenhuma exclusão ocorre automaticamente na publicação.
