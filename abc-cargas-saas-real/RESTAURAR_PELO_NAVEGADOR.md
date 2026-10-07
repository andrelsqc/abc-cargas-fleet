# Restaurar o backup anterior no sistema atual

A publicação desta atualização NÃO restaura nem apaga dados automaticamente. Temas e novo layout permanecem.

1. Guarde o backup ANTIGO ABC_Cargas_Backup_2026-10-07T14-01-38-186Z.sql, que contém exemplos anteriores à limpeza.
2. Extraia este ZIP e envie TODO o conteúdo DENTRO de abc-cargas-saas-real no GitHub. Root Directory/variáveis/comandos Render continuam iguais.
3. Publique o último commit e aguarde Live. Entre como Michele e abra https://abc-cargas-fleet.onrender.com/manutencao.html. Ctrl+F5.
4. Pause cadastros/alterações dos outros usuários.
5. No início da página, informe a senha atual e BAIXE UM NOVO BACKUP DO ESTADO ATUAL. Guarde-o para voltar ao estado de hoje, se necessário. Não atualize a página depois desse download.
6. Role até Restaurar os registros anteriores. Nesse formulário selecione o arquivo ANTIGO do passo 1, não o recém-baixado.
7. Informe a senha ATUAL da Michele e digite RESTAURAR FROTA.
8. Clique Confirmar restauração e confirme a mensagem de substituição. ESTA É A ETAPA QUE SUBSTITUI OS DADOS ATUAIS.
9. Aguarde Restauração concluída. Volte ao sistema e atualize a página. Confira veículos/pátios, motoristas, manutenção, combustível, reservas e fotos.

Michele mantém a conta e a senha ATUAIS. Os outros usuários que constarem do backup recuperam seus hashes de senha da época. Registros criados após o backup antigo são substituídos, não mesclados. Configurações da empresa/política/catálogo voltam ao backup. O tema individual é mantido no navegador. Não use Importar backup JSON.

Proteções: autenticação administrativa e senha, confirmação escrita, checksum e contagens, identidade da empresa/Michele, hashes das fotos, novo backup atual autorizado por 30 minutos, comparação do banco com o backup atual, bloqueio de escritas durante a troca, transação com rollback em falha. Se o servidor reiniciar, prazo vencer, página for recarregada ou dados mudarem, baixe outro backup atual. Se cair a conexão durante o commit, confira o sistema antes de repetir.

Não há execução do SQL carregado: somente registros JSON do formato de backup gerado pelo sistema são extraídos e inseridos por parâmetros. Esquema/tabelas devem ser compatíveis com v4. Arquivos até 8 MB nesta versão; o backup validado do usuário tem aproximadamente 61 KB. Guarde arquivos de backup em local restrito, nunca no GitHub. Este ZIP não contém backups ou dados pessoais.

Validação: o arquivo antigo foi restaurado via PGlite/PostgreSQL isolado, 13 tabelas conferidas e 5 fotos verificadas. A rotina de substituição recuperou contagens e fotos mantendo conta/senha atual. Erro provocado confirmou rollback integral. Verificação de integridade e bloqueio sem backup/confirmacão testados. 13 testes existentes aprovados. Fluxo no navegador testado com API simulada. Não houve acesso ou restauração no Render.
