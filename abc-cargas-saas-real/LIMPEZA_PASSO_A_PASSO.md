# Limpeza do ambiente atual

Backup enviado pelo usuário em 07/10/2026: checksum válido, restauração em PostgreSQL/PGlite isolado aprovada, contagens conferidas, 5 fotos com hash válido, conta Michele preservada. Este teste não é uma restauração no Render.

1. Guarde duas cópias do backup anterior e do pacote de código atual.
2. Publique o conteúdo COMPLETO deste ZIP DENTRO de abc-cargas-saas-real no GitHub. Preserve as variáveis e os comandos atuais do Render.
3. Publique o último commit e aguarde Live. Abra /manutencao.html no mesmo navegador, como Michele. Ctrl+F5.
4. Combine uma pausa de utilização. Nenhum outro usuário deve cadastrar ou alterar dados durante este procedimento.
5. Baixe um NOVO backup pela página e confirme que foi salvo. Ele terá autorização de limpeza por 30 minutos, enquanto o servidor não reiniciar. Guarde também esse arquivo.
6. Na seção Limpar os registros operacionais, selecione o NOVO arquivo SQL, informe a senha atual e digite LIMPAR FROTA.
7. Clique Confirmar limpeza definitiva e confirme a mensagem. Esta é a etapa que APAGA dados.
8. Aguarde Limpeza concluída. Volte ao sistema e atualize. Totais, pátios, veículos, motoristas, reservas, manutenção, combustível e alertas devem ficar vazios. Só Michele permanece como conta, com a senha anterior.
9. Cadastre os pátios e depois os demais registros novos.

Se o banco mudou, a autorização expirou ou o servidor reiniciou: nenhum registro deve ser apagado. Gere novo backup e repita. A limpeza usa transação: falhas antes do commit desfazem as alterações. Se a conexão cair no instante da confirmação, consulte o sistema antes de repetir.

Preservados: ID, nome, email, papel e hash da senha da Michele, empresa, catálogo, regras e configurações. Alertas lidos descartados e revisão incrementada para rejeitar telas antigas.
A rotina altera somente a empresa da conta autenticada. Não exclui PostgreSQL nem infraestrutura. Backup lógico contém os registros da empresa, não roles e infraestrutura do PostgreSQL. Restauração somente em banco isolado e vazio conforme BACKUP_PELO_NAVEGADOR.md. Não importe o backup por Configurações/JSON.
