# Atualização ABC Cargas — versão 2

A atualização é feita pelo navegador. Não é necessário instalar Node.js nem Docker neste computador. Esses componentes rodam na hospedagem.

## 1. Preparar

1. Exporte o backup no sistema atual, em Configurações, e guarde o arquivo.
2. Baixe e extraia o ZIP desta atualização usando o Windows.
3. Dentro dele, abra a pasta `abc-cargas-saas-real`.

O backup antigo serve como registro dos dados anteriores. A nova tela de importação aceita backups da versão 2. Não importe o backup antigo após atualizar: seus dados continuarão no mesmo PostgreSQL.

## 2. Enviar ao GitHub

1. Abra seu repositório `andrelsqc/abc-cargas-fleet`.
2. Selecione a branch `main`, não uma tela de commit antigo.
3. Entre na pasta `abc-cargas-saas-real`.
4. Clique em **Add file → Upload files**. Em algumas larguras da tela, a ação fica em um menu de três pontos.
5. Arraste **o conteúdo da pasta extraída**, incluindo as pastas `public`, `server`, `db`, `tests` e os arquivos da raiz. Não arraste a pasta externa `abc-cargas-saas-real`, para evitar criar outra pasta com o mesmo nome dentro dela.
6. Confira que aparecerão, entre outros, `public/app.js`, `public/styles.css`, `public/metrics.js`, `public/assets/vehicles.png`, `server/catalog.js`, `server/validation.js` e `db/upgrade-v2.sql`.
7. Use **Commit changes** para confirmar a atualização.

Esta versão precisa dos arquivos de interface, servidor e banco juntos. Atualizar somente `public/index.html` não é suficiente.

## 3. Publicar no Render

Mantenha o mesmo serviço e o mesmo banco. Não crie outro PostgreSQL.

- Root Directory: `abc-cargas-saas-real`, conforme a configuração que já funcionou.
- Build Command: `npm install` (ou `npm ci`).
- Start Command: `npm run db:migrate && npm run db:seed && npm start`.
- Mantenha DATABASE_URL, JWT_SECRET, NODE_ENV e SEED_PASSWORD já configurados.

Se o deploy automático estiver ativo, aguarde ficar **Live**. Caso contrário, use **Manual Deploy → Deploy latest commit**. Reabra o endereço publicado e atualize com Ctrl+F5.

A migração adiciona campos e um pátio principal, preservando os códigos internos que ligam manutenções e abastecimentos. Executar a migração novamente não recria os dados. O seed também preserva a empresa existente e sua senha. Se houver placas duplicadas no banco antigo, a migração interrompe a atualização sem apagar registros: será necessário corrigir as duplicidades primeiro.

## 4. Organizar os dados

1. Em **Pátios**, cadastre suas unidades.
2. Em **Frota**, revise cada veículo: placa, montadora, modelo e pátio.
3. Os modelos antigos foram preservados e sinalizados para revisão. Escolha o veículo leve correto; nenhuma conversão automática foi feita.
4. Preencha aquisição, valor residual, vida útil planejada e quilometragem limite.
5. Em **Configurações**, ajuste a política de renovação à sua operação. Os limites iniciais são demonstrativos.

A placa é a identificação mostrada em todas as telas. O sistema mantém apenas uma chave interna invisível para preservar o histórico.

## Mudanças incluídas

- Retirada dos gráficos de utilização e status e do card de quilometragem total.
- Cards Total de veículos, Disponíveis, Indisponíveis e Operação, sem os textos adicionais antigos.
- Operação em amarelo, com destaque e etiqueta no pátio; indisponibilidade em vermelho.
- Cadastro de pátios e seleção da unidade no painel; quantidade de carros acompanha o cadastro.
- Catálogo inicial de 24 modelos de 7 montadoras, com modelos dependentes da montadora. É possível adicionar opções em Configurações.
- Ilustrações diferentes para os modelos do catálogo inicial. São imagens ilustrativas, não fotografias oficiais. Modelos adicionados usam uma ilustração da categoria; uma foto personalizada pode ser cadastrada em cada veículo.
- Mapa do veículo selecionado com data, origem e coordenadas da última posição.
- Relatórios de consumo comparável, custo registrado por km, depreciação linear, vida restante e alertas de substituição.
- Custos de manutenção, dias de indisponibilidade, custos de abastecimento e marcação de tanque completo.
- Exportação CSV, backup versão 2 e proteção contra gravação de uma sessão desatualizada.

## Rastreador: etapa ainda necessária

O mapa está disponível, mas a conexão automática com o rastreador depende do fornecedor, da documentação da API e das credenciais. Nesta versão, as posições são informadas manualmente e exibidas como **Posição informada manualmente**. Não há rastreamento ao vivo. O identificador do rastreador pode ser cadastrado no veículo para a integração posterior.

## Como os indicadores funcionam

- **Depreciação:** (aquisição − residual) / vida útil em meses. A estimativa diminui com os meses completos de uso, sem ficar abaixo do residual. É uma estimativa gerencial, sem consulta FIPE ou cálculo fiscal.
- **KM/L:** exige dois abastecimentos com tanque completo. Soma também os abastecimentos parciais entre eles.
- **Custo registrado/km:** custos de combustível informados e manutenção concluída no intervalo entre os abastecimentos. Não representa todos os custos de propriedade.
- **Substituição:** alerta por idade de uso, quilometragem ou manutenção concluída nos últimos 12 meses em relação ao valor base informado/estimado. O alerta orienta uma revisão, sem decidir automaticamente pela substituição.
- Campos ausentes são mostrados como dados insuficientes. Valores de compra, residual e mercado devem ser informados pela empresa.

## Conferência após publicar

1. Entrar com a conta atual e verificar os quatro cards.
2. Cadastrar um pátio, vincular um veículo e selecionar esse pátio no painel.
3. Alterar o status para Em operação e confirmar o amarelo.
4. Recarregar a página e conferir a persistência.
5. Cadastrar um novo veículo e conferir que ele aparece no pátio.
6. Abrir Mapa e informar uma posição para conferir marcador e identificação manual.
7. Preencher aquisição e residual e conferir Relatórios.

## Validação desta entrega

Testados em banco PostgreSQL isolado: migração de dados antigos, repetição da migração, preservação de status, km, históricos e empresa; login; gravação e recarga; rejeição de placas/pátios/datas inválidos; conflito entre sessões.

Testados em navegador: cadastro de pátio e veículo, 11 veículos no pátio, filtros, amarelo de operação, todas as páginas, posição manual e layout em celular. Os testes não acessaram o banco publicado da empresa.
