# Validação — versão 4

- 11 testes automatizados de CNH, métricas e validação aprovados.
- Verificação de sintaxe dos módulos do servidor e navegador.
- Migrações 2/3/4 aplicadas em banco isolado; repetição preservou veículos, KM, senha e fotos.
- API: reserva, conflito simultâneo, aprovação concorrente, permissões, cinco fotos obrigatórias/distintas, imutabilidade, retirada, checkout, solicitação de correção, versões anteriores preservadas e liberação.
- CNH vencida bloqueou reserva e retirada de reserva já aprovada. CNH vencendo durante uso permitiu devolução e correção.
- Inativação impedida com pendências; veículo inativo saiu da disponibilidade; motorista inativo não pôde reservar; conta inativa perdeu acesso com sessão existente; reativação funcionou.
- Operações manuais também impediram inativação de veículo, motorista e conta enquanto Em operação.
- Exportação PDF autenticada com comparações, 15 fotos de três vistorias e histórico; análise visual de páginas e download real no Chromium.
- Navegador desktop 1440×1000 e celular simulado 390×844: menu Reservas, edição e gravação de CNH, alerta de sete dias no card inicial, download PDF, oito guias de fotos e ausência de rolagem horizontal/erros JavaScript.

Banco de teste: PostgreSQL via PGlite (WASM), isolado da produção. Isso valida as consultas e regras, mas não substitui o teste operacional no PostgreSQL do Render. A câmera física do telefone e a publicação na conta do usuário não foram executadas nesta validação.

As prévias incluídas usam dados sintéticos. Imagens ilustrativas foram criadas com a ferramenta integrada de geração de imagens: atlas de 24 modelos na vista superior e guia de seis vistas no estilo 3D prata. As figuras são representações, sem garantia de correspondência exata de acabamento/ano.
