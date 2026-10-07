# ABC Cargas — atualização v4: PDF, CNH e cadastros ativos

Esta atualização é para o sistema já hospedado no Render. Não é necessário instalar aplicativos no computador ou no celular.

## Publicar pelo navegador

1. No sistema atual, exporte o backup dos cadastros em Configurações e guarde o arquivo. Mantenha também o histórico de versões do GitHub.
2. Baixe e extraia o ZIP da atualização. Abra a pasta `abc-cargas-saas-real` dentro dele.
3. No GitHub, abra `andrelsqc/abc-cargas-fleet`, selecione a branch `main` e entre na pasta `abc-cargas-saas-real`.
4. Use **Add file → Upload files** e arraste **o conteúdo da pasta extraída** para a página, incluindo as pastas `public`, `server`, `db` e `tests`, além dos arquivos da raiz. Não arraste a pasta externa para dentro da pasta com o mesmo nome.
5. Confirme em **Commit changes**. Toda a atualização deve entrar no mesmo commit. Não atualize somente o HTML.
6. No mesmo serviço do Render, mantenha:

| Campo | Configuração |
|---|---|
| Root Directory | `abc-cargas-saas-real` |
| Build Command | `npm install` ou `npm ci` |
| Start Command | `npm run db:migrate && npm run db:seed && npm start` |

7. Mantenha as variáveis DATABASE_URL, JWT_SECRET, NODE_ENV e SEED_PASSWORD que já funcionam. Use o mesmo PostgreSQL.
8. Aguarde o deploy automático ou acione **Manual Deploy → Deploy latest commit**. Quando aparecer **Live**, abra a URL habitual e atualize com Ctrl+F5.

A migração acrescenta os campos de CNH, vínculo com a conta e situação ativa dos motoristas, preservando as tabelas de reservas, vistorias, fotos e decisões. Não recria a frota, não troca a senha e não substitui os registros anteriores. A sessão continua válida por até 8 horas.

## Criar as contas

Com a conta administrativa, abra **Configurações → Gerenciar contas → Criar conta**.

| Perfil | Permissões nesta versão |
|---|---|
| Administrador | Gerencia a frota, cria contas e aprova reservas/devoluções |
| Responsável | Gerencia a frota e aprova reservas/devoluções |
| Colaborador / motorista | Solicita reservas para si e registra as próprias retiradas/devoluções |
| Consulta | Consulta os dados disponíveis ao perfil, sem aprovar ou registrar vistorias |

Cada motorista precisa de uma conta individual. Em **Motoristas → Editar**, selecione essa conta, informe o número da CNH (11 dígitos), categoria e validade. Cadastros antigos ficam preservados, mas precisam desses dados antes de reservar ou retirar. O responsável pode solicitar a reserva em nome de um motorista selecionado. A vistoria deve ser feita pela conta desse motorista, inclusive quando a reserva foi criada pelo responsável.

O perfil técnico antigo `operator` passa a representar o Colaborador. A administração geral dos cadastros fica com Administrador e Responsável. Nenhum convite é enviado automaticamente; informe o acesso ao usuário pelo meio habitual da empresa.

## Como usar

### 1. Solicitar reserva

Em **Reservas**, escolha **Solicitar reserva**, informe retirada e devolução previstas, consulte os veículos livres e selecione a placa. Preencha finalidade e destino.

A reserva fica **Aguardando aprovação** e bloqueia provisoriamente aquele período. O sistema impede solicitações sobrepostas, inclusive quando são enviadas simultaneamente. O responsável deve aprovar ou recusar a solicitação. O cancelamento libera o horário e exige um motivo.

O veículo continua com sua condição atual no painel: uma reserva futura não muda o status para Em operação. Carros indisponíveis não são oferecidos. Um carro em operação sem reserva que informe previsão de devolução também não é oferecido como livre.

A alteração de veículo ou horário é feita cancelando a solicitação anterior e criando uma nova. O registro cancelado permanece no histórico.

### 2. Check-in de retirada

Após uma decisão do responsável, use **Atualizar** em Reservas para carregar o novo status.

O motorista entra em sua própria conta, abre a reserva aprovada e escolhe **Check-in · retirada**.

Informe KM inicial, combustível e eventuais avarias. Envie as cinco fotos obrigatórias:

- Frente: veículo inteiro, faróis, para-choque e placa.
- Traseira: veículo inteiro, lanternas e para-choque.
- Lateral esquerda: portas, rodas e retrovisor.
- Lateral direita: portas, rodas e retrovisor.
- Painel: odômetro, combustível e luzes de advertência.

Há três campos adicionais para detalhes de danos ou interior. É possível usar a câmera do telefone ou escolher uma imagem da galeria. A câmera depende do suporte e da permissão do navegador do dispositivo.

As fotos são reduzidas no navegador antes do envio. Aguarde aparecer **Foto salva**. O envio de cada foto é salvo imediatamente; use **Salvar rascunho** para guardar também os campos e continuar depois.

Confirme a declaração e envie a vistoria. O sistema exige as cinco fotos e bloqueia a reutilização do mesmo arquivo em vários ângulos ou entre retirada e devolução.

A retirada é permitida a partir de 30 minutos antes do início previsto e antes do fim da reserva. Também exige que o veículo esteja disponível, sem outra utilização ou conferência pendente. Ao concluir, o veículo fica **Em operação**, em amarelo.

### 3. Checkout de devolução

Ao entregar o veículo, o motorista abre a mesma reserva e escolhe **Checkout · devolução**. Registra KM final, combustível, avarias e as cinco fotos dos mesmos ângulos.

O KM final não pode ser menor que o inicial ou que a quilometragem atual. Ao enviar, a reserva fica **Aguardando conferência**. O pátio mantém o amarelo e mostra essa identificação; o carro ainda não está liberado para nova retirada.

### 4. Conferência do responsável

O responsável abre a reserva e compara retirada e devolução lado a lado. Pode ampliar cada foto e consultar os campos e o histórico.

- **Aprovar devolução:** escolhe Disponível ou Indisponível conforme a condição do veículo. A liberação com avarias exige justificativa.
- **Solicitar correção:** informa o que precisa ser corrigido. O motorista recebe essa orientação na reserva e envia outra versão do checkout.

A versão enviada anteriormente continua guardada. Na correção, o novo rascunho reaproveita as fotos já enviadas e permite substituir as que precisam melhorar, preservando a origem e o horário das imagens reaproveitadas.

Reservas futuras afetadas por indisponibilidade e utilizações que ultrapassam o prazo recebem avisos nas telas. A próxima retirada continua bloqueada enquanto houver utilização, conferência ou indisponibilidade. Os avisos são internos ao sistema; esta versão não envia notificações por e-mail ou push.

## Armazenamento e histórico

Nesta versão, as fotos ficam no PostgreSQL existente, em tabelas separadas dos cadastros. Isso mantém os arquivos após reinícios/deploys e evita colocar todas as fotos no carregamento do dashboard. Não use pastas locais do Render para guardar evidências.

Cada foto exige autenticação. O motorista/solicitante acessa as evidências de suas próprias reservas; Administrador e Responsável acessam as da empresa. Os registros guardam conta, horário do envio, ângulo e hash do arquivo. O horário é o do envio ao sistema, não uma certificação do instante em que a câmera foi acionada.

- Foto recebida pelo servidor: até 700 KB, em JPEG, PNG ou WebP.
- Redução automática no navegador: até 1600 pixels e alvo de até 650 KB.
- Limite inicial das fotos por empresa: **250 MB**. É um limite da aplicação, não uma informação sobre a capacidade contratada do banco.
- Para mudar o limite, configure `PHOTO_QUOTA_MB` no Render, conforme a capacidade disponível do seu PostgreSQL. Não é necessário para iniciar os testes.
- O limite considera também as versões preservadas após correções. Ao atingir o limite, o envio é interrompido com uma mensagem, sem apagar evidências.

Em cada reserva, **Exportar dossiê com fotos** gera um **PDF** com os dados da reserva, motorista, horários, KM, combustível, avarias, fotos comparativas e histórico. Inclui todas as versões de correção e imagens adicionais. É um relatório de consulta, não um arquivo de importação ou uma assinatura digital. A exportação não apaga registros.

O backup JSON em Configurações cobre os cadastros anteriores, não as novas tabelas de reservas/fotos. Para uma recuperação integral, é necessário o backup do PostgreSQL; os dossiês permitem guardar uma cópia das evidências de cada reserva. A aplicação não configura automaticamente os backups do serviço de hospedagem.

## Ilustrações e celular

A vista do pátio usa uma nova coleção de ilustrações para os 24 modelos do catálogo inicial, com o estilo visual aprovado e os destaques de status. São representações ilustrativas, não reproduções técnicas exatas de cada ano ou versão. Fotos de vistoria são evidências separadas e não substituem a figura do carro. Ao adicionar um modelo em Configurações, é possível enviar uma ilustração na vista superior para todos os veículos desse modelo. Sem esse arquivo, o modelo adicional usa uma ilustração da categoria. O sistema não gera novas imagens automaticamente. Imagens PNG enviadas preservam transparência. Os guias de fotos usam exemplos em 3D de frente, traseira, laterais, painel e avaria; são referências de enquadramento, não fotos do veículo reservado.

As telas de retirada e devolução foram adaptadas para o navegador do celular: campos grandes, fotos guiadas, câmera/galeria, rascunho e progressão de envio. Esta entrega é a versão web; o aplicativo mobile simplificado será definido posteriormente.

Não há modo offline nesta versão. Os envios exigem internet; um arquivo só está guardado quando o sistema confirma o envio. Campos preenchidos sem salvar o rascunho podem ser perdidos ao fechar a página.

## Teste recomendado após a publicação

1. Crie uma conta de Colaborador para o motorista e uma conta de Responsável.
2. Cadastre/vincule o motorista à conta e preencha CNH, categoria e validade. Em uma janela anônima ou outro dispositivo, entre como Colaborador e solicite um veículo disponível.
3. Como Responsável, aprove a reserva.
4. No celular, entre como motorista e faça o check-in com as cinco fotos.
5. Confira o amarelo no pátio e a persistência após atualizar a página.
6. Faça o checkout e confirme que o carro continua aguardando conferência.
7. Como Responsável, compare as fotos, solicite uma correção e confira a preservação da primeira versão.
8. Aprove a nova devolução e escolha a condição final.
9. Exporte o dossiê e confirme que outro colaborador não acessa a reserva/fotos desse motorista.

Use uma placa e fotos controladas para este primeiro teste operacional. As prévias incluídas no pacote usam imagens e contas de teste.

## CNH e inativação na versão 4

A CNH é considerada válida até o final da data cadastrada, no fuso de Brasília. Os avisos aparecem a 60, 30 e 7 dias, no dia do vencimento e após vencer. A página de Alertas mostra todas as ocorrências; o card inicial mostra as cinco primeiras não lidas. Entre os avisos de CNH, os vencimentos mais próximos aparecem primeiro. Alertas de CNH ficam presentes até a regularização, sem a opção de escondê-los como eventos lidos. As telas de Início, Motoristas e Alertas recalculam os avisos a cada minuto enquanto estiverem abertas e sem formulário em edição.

CNH vencida, incompleta, categoria incompatível com veículos leves ou falta de vínculo entre conta e motorista impede novas reservas, aprovação e retirada. Uma reserva aprovada também é novamente verificada ao iniciar a vistoria e ao confirmar a retirada. A devolução e suas correções continuam permitidas se a CNH vencer durante o uso. O responsável pode reservar para outro motorista, desde que o cadastro desse motorista esteja regularizado.

A verificação utiliza os dados cadastrados: **não há integração com DETRAN/Senatran**, nem consulta a suspensão/cassação nesta versão. Avisos são internos ao site; não são enviados por e-mail ou push.

- Frota: abra Detalhes e escolha **Inativar**; o cadastro fica consultável na lista, fora do pátio, dos indicadores de frota ativa e de novas reservas. Use **Reativar** para voltar.
- Motoristas: escolha **Inativar** no card. Seu histórico permanece; novos usos e avisos de CNH deixam de ser oferecidos.
- Usuários: Administrador acessa **Configurações → Gerenciar contas → Inativar**. A próxima requisição da conta inativa exige novo acesso e será recusada; não é necessário esperar as oito horas da sessão. Usuário e motorista são situações independentes: inative ambos quando houver desligamento. A conta inativa também suprime os avisos de CNH do motorista vinculado.

Resolva reservas pendentes/aprovadas e devoluções em andamento antes de inativar. Operações registradas manualmente também precisam ser encerradas. O sistema não cancela reservas nem apaga evidências automaticamente. Não é permitido inativar a própria conta ou remover o último administrador ativo.
