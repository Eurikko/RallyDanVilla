# 🏐 RALLY NA VILA — Documentação Completa do Código e Arquitetura

Este documento reúne a documentação técnica, estrutura de arquivos, modelo de dados do Firestore, configurações e o mapeamento detalhado de todos os componentes e serviços que compõem o sistema **Rally na Vila**.

---

## 📥 1. Como Exportar Todo o Código Fonte

Você pode baixar ou exportar o código completo a qualquer momento diretamente pelo Google AI Studio:
1. No menu superior da interface, clique no menu de configurações (**Settings** / **Export**).
2. Escolha **"Download as ZIP"** para baixar uma cópia completa de todos os arquivos ou **"Export to GitHub"** para enviar a um repositório seu.
3. Para rodar em qualquer máquina local:
   ```bash
   npm install
   npm run dev
   ```

---

## 🏗️ 2. Stack Tecnológica e Arquitetura

- **Frontend**: React 18+ com TypeScript
- **Bundler & Dev Server**: Vite (porta 3000)
- **Estilização**: Tailwind CSS com tema personalizado esportivo
- **Ícones**: Lucide React
- **Banco de Dados & Autenticação**: Firebase Firestore & Firebase Auth
- **Roteamento**: React Router DOM (v6)

---

## 📁 3. Mapa da Estrutura de Arquivos

```text
├── .env.example                  # Variáveis de ambiente
├── firebase-applet-config.json   # Configuração do projeto Firebase
├── firestore.rules               # Regras de segurança do Firestore
├── index.html                    # Ponto de entrada HTML
├── metadata.json                 # Metadados da aplicação
├── package.json                  # Dependências e scripts npm
├── tsconfig.json                 # Configuração TypeScript
├── vite.config.ts                # Configuração do Vite e Tailwind
└── src/
    ├── App.tsx                   # Roteamento principal e provedores
    ├── main.tsx                  # Ponto de inicialização do React
    ├── index.css                 # Estilos globais e Tailwind
    ├── components/               # Componentes visuais reutilizáveis
    │   ├── Alert.tsx             # Alertas informativos/erro/sucesso
    │   ├── Avatar.tsx            # Foto ou iniciais do usuário
    │   ├── Badge.tsx             # Etiquetas de status e nível
    │   ├── BottomNav.tsx         # Barra de navegação inferior mobile
    │   ├── BrandMark.tsx         # Logotipo Rally na Vila
    │   ├── Button.tsx            # Botões padronizados com estados de loading
    │   ├── Card.tsx              # Cartões de conteúdo
    │   ├── EmptyState.tsx        # Telas de estado vazio
    │   ├── ErrorBoundary.tsx     # Tratamento de erros de runtime
    │   ├── Header.tsx            # Cabeçalho com navegação e perfil
    │   ├── Input.tsx             # Campos de texto padronizados
    │   ├── Loader.tsx            # Spinners e indicadores de carregamento
    │   ├── NotificationBadgeButton.tsx # Botão de sino com contador de avisos
    │   ├── PasswordInput.tsx     # Campo de senha com alternância de visibilidade
    │   ├── PlayerAvatar.tsx      # Avatar de jogador nas listas
    │   ├── ProtectedRoute.tsx    # Guarda de rotas autenticadas
    │   ├── PublicOnlyRoute.tsx   # Guarda de rotas públicas (Login/Cadastro)
    │   ├── VolleyballLogo.tsx    # Ícone vetorial da bola de vôlei
    │   └── rules/                # Componentes do manual de regras do grupo
    ├── context/
    │   └── AuthContext.tsx       # Provedor global de autenticação e sessão
    ├── lib/                      # Camada de serviços e integração com banco
    │   ├── attendanceService.ts  # Registro e histórico de presenças nos jogos
    │   ├── firebase.ts           # Inicialização do app Firebase e Firestore
    │   ├── gameService.ts        # CRUD de jogos, confirmação de vagas e filas
    │   ├── guestPlayerService.ts # Gerenciamento de convidados nas partidas
    │   ├── matchService.ts       # Gestão de sets, pontos e placar ao vivo
    │   ├── notificationService.ts# Notificações e avisos no sistema
    │   ├── profileService.ts     # Gerenciamento de perfis e fotos dos jogadores
    │   ├── technicalLevel.ts     # Lógica de cálculo e pesos dos níveis técnicos
    │   ├── technicalLevelService.ts # Histórico de avaliações de nível técnico
    │   └── usernameUtils.ts      # Normalização e validação de nomes de usuário
    ├── pages/                    # Telas da aplicação
    │   ├── AdminAttendancePage.tsx # Chamada e presença dos jogadores (Admin)
    │   ├── AdminGamesPage.tsx    # Criação e gestão de jogos (Admin)
    │   ├── AdminLevelsPage.tsx   # Classificação técnica dos atletas (Admin)
    │   ├── AdminMatchSetupPage.tsx # Montagem de times e confrontos (Admin)
    │   ├── AdminPage.tsx         # Painel geral administrativo
    │   ├── GameDetailPage.tsx    # Detalhes do jogo, lista de confirmados e fila
    │   ├── GamesPage.tsx         # Lista geral de jogos programados
    │   ├── HomePage.tsx          # Painel principal do jogador logado
    │   ├── LandingPage.tsx       # Página inicial pública com chamada de entrada
    │   ├── LiveScoreboardPage.tsx# Placar ao vivo em tela cheia para a quadra
    │   ├── LoginPage.tsx         # Tela de login com atalhos rápidos
    │   ├── NotFoundPage.tsx      # Tela de erro 404
    │   ├── NotificationsPage.tsx # Central de notificações do atleta
    │   ├── ProfilePage.tsx       # Edição de perfil e histórico do jogador
    │   ├── RegisterPage.tsx      # Tela de cadastro de novos participantes
    │   ├── RulesPage.tsx         # Regulamento oficial do Rally na Vila
    │   └── ScoreboardPage.tsx    # Visualizador de resultados e placar
    └── types/
        └── index.ts              # Interfaces e definições de tipos TypeScript
```

---

## 🗄️ 4. Modelo de Dados do Firestore (Coleções)

1. **`profiles/{userId}`**:
   - `uid`, `username`, `usernameNormalized`, `passwordHash`, `role` (`'owner' | 'admin' | 'player'`), `status`, `technicalLevel` (`1 | 2 | 3 | 4 | 'nao_classificado'`), `attendanceCount`, `photoUrl`, `createdAt`, `updatedAt`.
2. **`games/{gameId}`**:
   - `title`, `date`, `startTime`, `endTime`, `location`, `maxPlayers`, `confirmedCount`, `status` (`'scheduled' | 'in_progress' | 'finished' | 'cancelled'`), `price`, `description`, `createdAt`.
3. **`game_registrations/{registrationId}`**:
   - `gameId`, `userId`, `username`, `status` (`'confirmed' | 'waitlist' | 'cancelled'`), `position`, `registeredAt`.
4. **`match_sessions/{matchId}`**:
   - Dados de partidas ao vivo, times (Time A / Time B), sets jogados, status da partida.
5. **`match_sets/{setId}`**:
   - Pontuação por set (ex: 25 x 21), histórico de rotação e pontos.
6. **`technical_level_history/{historyId}`**:
   - Registro de histórico de evolução do nível dos jogadores feito pela moderação.
7. **`notifications/{notificationId}`**:
   - Avisos aos participantes (abertura de jogos, chamadas da lista de espera, etc.).

---

## 🔐 5. Regras de Segurança (`firestore.rules`)

As regras configuradas garantem:
- Leitura e criação de cadastros e perfis de jogadores.
- Confirmação e cancelamento de vagas em partidas abertas pelos atletas.
- Operações de administração restritas aos organizadores e proprietário (`role == 'owner'` / `role == 'admin'`).

---

## 🚀 6. Fluxos Principais Implementados

1. **Autenticação Direta**:
   - Cadastro sem complicação de e-mail usando nome de usuário único (ex: `carlos_volei`).
   - Sessão persistida em LocalStorage e sincronizada em tempo real com o Firestore.
   - Perfil de proprietário atribuído automaticamente para a conta do organizador (`euriko`).

2. **Gestão de Jogos e Lista de Espera**:
   - Limite automático de vagas (ex: 18 ou 24 vagas).
   - Inscrição em 1 clique: se as vagas esgotarem, o jogador entra automaticamente na fila de espera ordenada por horário.
   - Desistências promovem o primeiro da fila automaticamente.

3. **Placar em Tempo Real & Nível Técnico**:
   - Modo mesa/juiz para pontuação ponto a ponto por set.
   - Painel público de placar ao vivo projetável em telas na quadra.
   - Avaliação técnica e equilíbrio de times por nível.
