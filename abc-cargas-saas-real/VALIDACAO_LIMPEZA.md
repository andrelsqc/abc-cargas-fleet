# Validação em 07/10/2026

Backup de referência: checksum SHA-256 aprovado e marcador de conclusão presente. Contagens conferidas após execução do SQL em PostgreSQL via PGlite com pgcrypto, isolado do Render. Conta administradora ativa e hash bcrypt preservados. Cinco fotos verificadas pelo SHA-256 dos bytes recuperados.

Limpeza testada nesse banco isolado: registros operacionais zerados, uma empresa e uma administradora preservadas, senha intacta, configurações mantidas exceto descarte de avisos lidos e incremento de revisão. Rollback testado: digest do banco voltou ao original. Endpoint recusou confirmação incorreta e ausência de autorização de backup. Treze testes automatizados existentes passaram. JavaScript do navegador validado sintaticamente.

Limites: não houve limpeza ou restauração no Render. Não foi possível validar a senha legível da conta, que não consta do backup. Interação no navegador publicado e câmera não foram retestadas nesta etapa. Backup contém dados da empresa, não roles ou infraestrutura PostgreSQL. Guardar também código e ativos do projeto.
