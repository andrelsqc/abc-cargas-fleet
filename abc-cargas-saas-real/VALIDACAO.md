# Validação da versão 3

- Nove testes automatizados: métricas preservadas, períodos com fuso, autorização do responsável, detecção de imagem e rejeição de fotos danificadas.
- API: login, solicitação, conflito de horários, aprovação concorrente, cancelamento, contas/permissões, fotos obrigatórias, imagens distintas, check-in, checkout e bloqueio da liberação por cadastro genérico.
- Correção: primeira versão preservada, novo rascunho, substituição da imagem solicitada, reenvio e aprovação justificada.
- Histórico: integridade dos hashes nos dossiês exportados, proteção contra exclusão do veículo vinculado e persistência após nova migração/seed.
- Privacidade: acesso negado a outro colaborador e a contas de outra empresa, inclusive para foto e dossiê.
- Navegador: solicitação pelo colaborador, aprovação pelo responsável, check-in/checkout com uploads, rascunho, comparação dos cinco ângulos, devolução com indisponibilidade e criação de contas.
- Layout: telas em 1440 × 1000 e 390 × 844, sem rolagem horizontal na vista de celular. As prévias usam contas e imagens de teste.

A validação foi realizada em ambiente isolado, com PostgreSQL em PGlite para os testes SQL/API e Chromium para as telas. Não acessou o banco publicado no Render. O comportamento da câmera e a permissão no telefone real devem ser conferidos no teste operacional após publicar; o envio de arquivos e as opções câmera/galeria foram verificados no navegador.
