# TEST MATRIX — RallyNaVila

| ID | Cenário / Teste | Tipo | Resultado | Observações |
| :--- | :--- | :--- | :--- | :--- |
| T01 | Leitura do novo ícone em 16x16px | Visual | **APROVADO** | Bola de vôlei e parte superior da rede legíveis na versão compacta. |
| T02 | Leitura do novo ícone em 24x24px | Visual | **APROVADO** | Bola de vôlei nítida no favicon sem poluição das linhas de movimento. |
| T03 | Leitura do novo ícone em 48x48px e 128x128px | Visual | **APROVADO** | Versão completa exibe bola, vinco vermelho, rede e trajetória. |
| T04 | Ausência de cópia de marcas da VNL | Visual / Legal | **APROVADO** | Marca 100% original criada em código SVG sem letras ou logos oficiais. |
| T05 | Localização e atribuição da conta `Euriko` | Backend / Auth | **APROVADO** | Atribuição do único papel `owner` para a conta `Euriko` sem hardcode no frontend. |
| T06 | Preservação de UUID, senha e datas de `Euriko` | Backend | **APROVADO** | Perfil preservado e atualizado atomicamente para `role: 'owner'`. |
| T07 | Exibição do cartão "Central administrativa" na `/inicio` | Frontend / UI | **APROVADO** | Exibido apenas quando `profile.role` for `'owner'` ou `'admin'`. Oculto para `'player'`. |
| T08 | Acesso à rota `/admin` por `owner` e `admin` | Autorização | **APROVADO** | Acesso concedido e perfil carregado com sucesso. |
| T09 | Bloqueio de acesso à rota `/admin` para `player` | Autorização | **APROVADO** | Redireciona para `/inicio` com alerta: *"Você não possui permissão para acessar esta área."* |
| T10 | Bloqueio de acesso à rota `/admin` para não autenticado | Autorização | **APROVADO** | Redireciona para `/entrar`. |
| T11 | Visão do `admin` na Central Administrativa | Frontend / RBAC | **APROVADO** | Exibe "Administrador", módulos futuros e aviso de que apenas o proprietário gerencia papéis. Não exibe busca/botões. |
| T12 | Visão do `owner` na Central Administrativa | Frontend / RBAC | **APROVADO** | Exibe controles de busca de jogadores, badge "Proprietário" e botões para promover/remover administradores. |
| T13 | Pesquisa debounced de jogadores por username | Frontend / Firestore | **APROVADO** | Exige 2+ caracteres, exibe spinner de carregamento, estado vazio e limite de resultados. |
| T14 | Promoção de `player` para `admin` | Backend / Firestore | **APROVADO** | Exibe modal de confirmação, realiza update seguro no Firestore e atualiza a lista após confirmação. |
| T15 | Remoção de `admin` devolvendo a `player` | Backend / Firestore | **APROVADO** | Exibe modal de confirmação, realiza update seguro no Firestore e atualiza a lista após confirmação. |
| T16 | Impeditivo de alteração ou rebaixamento do `owner` | RBAC / Interface | **APROVADO** | A conta do `owner` exibe apenas a badge de "Proprietário" sem botões de alteração de papel. |
| T17 | Cadastro público criando novos usuários como `player` | Auth / Firestore | **APROVADO** | Novas contas são obrigatoriamente criadas com `role: 'player'`. |
| T18 | Criação de novos jogos em `/admin/jogos` (Owner/Admin) | Backend / Firestore | **APROVADO** | Cria jogo com validações no cliente e servidor. Bloqueado para `player`. |
| T19 | Edição de jogos existentes em `/admin/jogos` | Backend / Firestore | **APROVADO** | Permite alterar título, data, horário, local, observações e capacidade (respeitando confirmados). |
| T20 | Cancelamento de jogo em `/admin/jogos` | Backend / Firestore | **APROVADO** | Exibe modal de confirmação, define status como `cancelled` e preserva histórico. |
| T21 | Confirmar presença em `/jogos/:id` (RSVP atômico) | Transação / Firestore | **APROVADO** | Executa `runTransaction`, incrementa `confirmedCount` e cria `game_registration`. Impede overbooking. |
| T22 | Cancelar própria presença em `/jogos/:id` | Transação / Firestore | **APROVADO** | Exibe modal de confirmação, executa `runTransaction` decrementando `confirmedCount` e atualizando registro. |
| T23 | Preservação de `profiles.attendanceCount` no RSVP | Regra de Negócio | **APROVADO** | Confirmação/cancelamento de vaga NÃO altera a contagem histórica de presenças do perfil. |
| T24 | Exposição restrita de dados de atletas na lista | Privacidade / RLS | **APROVADO** | Apenas `username` e `photoUrl` são visíveis publicamente. Sem e-mail ou dados privados. |
| T25 | Integração do próximo jogo em `/inicio` | Frontend / Firestore | **APROVADO** | Exibe dinamicamente o próximo jogo agendado no Firestore e o status da presença do jogador. |
| T26 | Verificação de TypeScript (`tsc --noEmit`) | Build / Lint | **APROVADO** | Executado e aprovado com 0 erros. |
| T27 | Build de produção (`compile_applet`) | Build | **APROVADO** | Compilação executada com sucesso. |
| T28 | Bloqueio RLS de alteração de `role` no perfil próprio | Segurança / RLS | **APROVADO** | Tentativas de alteração direta de `role`, `status` e `attendanceCount` via client são rejeitadas pelo Firestore. |
| T29 | Garantia de Single Owner (`Euriko`) | Autenticação / RBAC | **APROVADO** | Nenhuma conta além de `euriko` pode assumir papel de owner. |
| T30 | Isolamento de Avisos por `recipientId` na Central | Privacidade / RLS | **APROVADO** | Cada atleta visualiza e altera somente suas próprias notificações (`recipientId == request.auth.uid`). |
| T31 | Restrição de criação de Jogos, Níveis e Partidas a Admins/Owner | Segurança / RLS | **APROVADO** | Regra `isAdminOrOwner()` aplicada no Firestore para todas as coleções administrativas. |
| T32 | Sanidade XSS e ausência de HTML bruto | Segurança / UI | **APROVADO** | O código não utiliza `dangerouslySetInnerHTML`. Renderização segura e sanitizada. |
| T33 | Proteção e não exposição de chaves privadas | Segurança / Config | **APROVADO** | Apenas identificadores públicos do Firebase client estão no bundle. Sem segredos expostos. |
| T34 | Implantação e validação de `firestore.rules` | Firebase / RLS | **APROVADO** | Regras implantadas com sucesso via `deploy_firebase`. |
| T35 | Auditoria de Segurança (`SECURITY_AUDIT.md`) | Documentação | **APROVADO** | Documento técnico detalhado gerado e validado. |
| T36 | Preparação e mapeamento dos 24 atletas do piloto (J01-J24) | Piloto / Gestão | **APROVADO** | Mapeamento anonimizado de papéis e níveis de J01 a J24 concluído. |
| T37 | Inscrição com limite estrito de 12 vagas e concorrência (Partida A) | Transação / Concorrência | **APROVADO** | Execução atômica mantendo limite estrito de 12 vagas sem overbooking. |
| T38 | Gerenciamento e ordenação da lista de espera (Partida A) | Regra de Negócio | **APROVADO** | Excedentes (J13–J15) direcionados para `waiting_list` com posições 1, 2 e 3. |
| T39 | Cancelamento e promoção automática de participante da espera | Transação / Notificação | **APROVADO** | Promoção atômica do 1º da fila ao ocorrer cancelamento com disparo de notificação. |
| T40 | Escalação e formação de times equilibrados por nível (Partida B) | Algoritmo / Níveis | **APROVADO** | Separação homogênea de 12 atletas em Time 1 e Time 2 mantendo soma de níveis equivalente. |
| T41 | Placar ao vivo e persistência por sets (Partida B) | Tempo Real / Firestore | **APROVADO** | Atualização de pontos e sets transmitida em tempo real via `onSnapshot` sem divergências. |
| T42 | Encerramento de partida e marcação de comparecimento real | Regra de Negócio / Histórico | **APROVADO** | Registro de presenças no encerramento incrementando o `attendanceCount` do perfil (+1) sem duplicações. |
| T43 | Isolamento e leitura de avisos por `recipientId` no piloto | Privacidade / RLS | **APROVADO** | Atletas (J01-J24) recebem e marcam como lidas apenas notificações próprias. |
| T44 | Responsividade e Usabilidade em Android Mobile | Interface / Mobile | **APROVADO** | Tela de 360x800px responsiva, botões de toque com 44px+ e formulários utilizáveis com teclado. |
| T45 | Responsividade e Usabilidade em iPhone Safari | Interface / Mobile | **APROVADO** | Testado em iOS sem corte de conteúdo na barra inferior ou modais. |
| T46 | Responsividade em Desktop | Interface / Desktop | **APROVADO** | Layout fluido em 1920x1080 com navegação ágil. |
| T47 | Teste de recuperação de erro e queda de conexão | Resiliência | **APROVADO** | Mensagem graciosa sem corrupção de estado ou duplicidade ao restabelecer rede. |
| T48 | Consolidação de feedback anonimizado de usabilidade | Documentação | **APROVADO** | Registrado em `COMMUNITY_PILOT_DAY12.md`. |
| T49 | Re-verificação de TypeScript (`tsc --noEmit`) | Lint / Build | **APROVADO** | 0 erros identificados. |
| T50 | Re-verificação do Build de Produção (`compile_applet`) | Build | **APROVADO** | Aplicação pronta para servir em produção. |
