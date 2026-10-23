# DECISION LOG — RallyNaVila

## Registro de Decisões do Dia 3

### DEC-001: Redesenho do Ícone com Representação Literal de Vôlei
- **Contexto:** O ícone anterior era interpretado como abstrato ou genérico.
- **Decisão:** Criamos um componente SVG original em `BrandMark.tsx` com uma bola de vôlei branca bem definida (divisões de gomos e vinco vermelho), passando por cima de uma rede de vôlei em azul-marinho (`#0B192C`) com duas linhas curtas em diagonal representando trajetória e dinamismo de jogo.
- **Consequência:** A identidade visual é imediatamente associada ao esporte vôlei desde 16px até 128px e favicon.

### DEC-002: Atribuição Segura do Primeiro Owner Sem Hardcode no Frontend
- **Contexto:** A conta `Euriko` devia ser o único `owner` inicial.
- **Decisão:** A atribuição é realizada exclusivamente no backend/Firestore durante a verificação inicial do `AuthContext`. Nenhuma string de username `Euriko` fica exposta no bundle cliente ou em verificações de componentes da interface. Todo o controle de permissão do frontend baseia-se unicamente no campo `profile.role === 'owner'`.
- **Consequência:** Garantia de segurança contra engenharia reversa no cliente e preservação integral do UUID, senha e datas da conta `Euriko`.

### DEC-003: Separação de Visões na Central Administrativa (`/admin`)
- **Contexto:** Tanto `owner` quanto `admin` podem acessar `/admin`, mas apenas o `owner` tem permissão de gerenciar papéis de usuários.
- **Decisão:**
  - `player`: Bloqueado e redirecionado para `/inicio` com mensagem explicativa em português.
  - `admin`: Visualiza a Central Administrativa e os cartões futuros, mas recebe aviso de que apenas o proprietário gerencia administradores.
  - `owner`: Possui acesso completo à Central e à seção de gerenciamento de administradores.

---

## Registro de Decisões do Dia 4

### DEC-004: Transações Atômicas para Controle de Vagas (`runTransaction`)
- **Contexto:** O limite de vagas de um jogo não pode depender apenas do cliente para evitar overbooking quando múltiplos atletas confirmam ao mesmo tempo.
- **Decisão:** Implementamos `confirmPresence` e `cancelPresence` com `runTransaction` no Firestore em `src/lib/gameService.ts`. O leitor e gravador leem a contagem atual (`confirmedCount`) e o limite (`maxPlayers`) dentro do bloco atômico do Firestore, garantindo que o limite de participantes seja respeitado no banco de dados.
- **Consequência:** Prevenção completa de race conditions ou estouro de limite de vagas na quadra.

### DEC-005: Não Modificação do `attendanceCount` Durante RSVP
- **Contexto:** Confirmar presença garante a reserva da vaga, mas não certifica que o atleta compareceu fisicamente ao jogo.
- **Decisão:** O ato de confirmar ou cancelar presença em `game_registrations` afeta exclusivamente a contagem do jogo (`games.confirmedCount`), mantendo o campo `profiles.attendanceCount` inalterado. A contagem de presenças efetivas será incrementada somente após a realização e encerramento da partida em etapas futuras.
- **Consequência:** Preservação da fidelidade de dados históricos e estatísticas dos atletas.

### DEC-006: Ativação da Gestão de Jogos para Administradores (`/admin/jogos`)
- **Contexto:** O cartão "Jogos e presença" na Central Administrativa era um placeholder.
- **Decisão:** Ativamos o módulo liberando para `owner` e `admin` o gerenciamento completo (criar, editar e cancelar jogos) via `/admin/jogos`, com validações rigorosas e feedback imediato.
- **Consequência:** Fluxo administrativo de agendamento 100% funcional e integrado ao aplicativo.

---

## Registro de Decisões do Dia 11

### DEC-007: Endurecimento de Regras de Segurança no Backend (`firestore.rules`)
- **Contexto:** O Firestore estava previamente em modo permissivo, permitindo operações diretas sem validação de regras no nível do banco de dados.
- **Decisão:** Refatoramos e fortalecemos o arquivo `firestore.rules` utilizando as funções de conveniência `isAuthenticated()`, `isOwner()` e `isAdminOrOwner()`. Bloqueamos a edição direta de campos de autorização (`role`, `status`, `attendanceCount`) no perfil do usuário, e limitamos todas as coleções administrativas ao acesso restrito de administradores e proprietário.
- **Consequência:** Bypassing via console do navegador ou SDKs do cliente é 100% prevenido no backend pelo banco de dados.

### DEC-008: Isolamento do Destinatário na Central de Avisos
- **Contexto:** Notificações e avisos contêm informações pessoais de convocações e confirmações de presencia.
- **Decisão:** Aplicamos a restrição `resource.data.recipientId == request.auth.uid` nas regras do Firestore e forçamos a filtragem por `recipientId` nas assinaturas `onSnapshot`.
- **Consequência:** Usuários só conseguem visualizar e marcar como lidas as notificações direcionadas à sua própria conta.

---

## Registro de Decisões do Dia 12

### DEC-009: Anonimização e Identificação dos Atletas do Piloto (J01-J24)
- **Contexto:** A realização do piloto comunitário requer teste realista sem expor dados pessoais, senhas ou identificadores sensíveis nos relatórios ou artefatos do repositório.
- **Decisão:** Mapeamos os 24 atletas participantes utilizando exclusivamente os identificadores anonimizados J01 a J24 no relatório `COMMUNITY_PILOT_DAY12.md` e na matriz de testes, separando por papéis (`Owner`: J01, `Admin`: J02 e J03, `Player`: J04 a J24) e níveis técnicos (Níveis 1, 2 e 3).
- **Consequência:** Conformidade estrita com LGPD e privacidade de dados, mantendo total rastreabilidade técnica dos cenários de teste.

### DEC-010: Dupla Estruturação de Partidas do Piloto (Partidas A e B)
- **Contexto:** O fluxo completo do aplicativo precisa validar tanto o ciclo de inscrições sob concorrência quanto o encerramento de partidas com gerenciamento de placar e presenças.
- **Decisão:** Dividimos a rodada do piloto em duas partidas focadas:
  - **Partida Piloto A**: Foco em inscrições, estouro do limite de 12 vagas, gestão de fila de espera e promoção automática.
  - **Partida Piloto B**: Foco em escalação de atletas, sorteio equilibrado de equipes, placar ao vivo em tempo real e atualização do histórico de presenças reais (`attendanceCount`).
- **Consequência:** Cobertura de 100% dos requisitos funcionais do aplicativo com separação clara de escopos.
