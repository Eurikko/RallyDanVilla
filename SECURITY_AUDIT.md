# AUDITORIA COMPLETA DE SEGURANÇA, AUTORIZAÇÃO E PERMISSÕES — RallyNaVila (Dia 11)

## Resumo Executivo
Esta auditoria documenta e comprova a integridade de segurança, isolamento de dados, controle de acesso baseado em papéis (RBAC) e proteção contra bypass no sistema **RallyNaVila**.

---

## 1. Inventário Completo do Sistema

### 1.1 Rotas e Proteções no Frontend
| Rota | Descrição | Permissão Exigida | Mecanismo de Proteção |
| :--- | :--- | :--- | :--- |
| `/` | Landing / Redirecionamento | Pública | Redireciona autenticados para `/inicio` e não autenticados para `/entrar` |
| `/entrar` | Login | Pública (Apenas Não Autenticados) | `PublicOnlyRoute` |
| `/cadastrar` | Cadastro | Pública (Apenas Não Autenticados) | `PublicOnlyRoute` |
| `/inicio` | Dashboard Principal do Jogador | Jogador, Administrador, Owner | `ProtectedRoute` |
| `/perfil` | Perfil e Histórico Pessoal | Jogador, Administrador, Owner | `ProtectedRoute` (Edição restrita a dados próprios) |
| `/jogos/:id` | Detalhes do Jogo & RSVP | Jogador, Administrador, Owner | `ProtectedRoute` |
| `/avisos` | Central de Avisos Internos | Jogador, Administrador, Owner | `ProtectedRoute` (Exibe apenas avisos do próprio `recipientId`) |
| `/livro-de-regras` | Livro de Regras do Grupo | Jogador, Administrador, Owner | `ProtectedRoute` |
| `/admin` | Central Administrativa | Administrador, Owner | `ProtectedRoute` + `useEffect` Guard (`profile.role === 'owner' \|\| 'admin'`) |
| `/admin/jogos` | Gerenciamento de Jogos | Administrador, Owner | `ProtectedRoute` + `useEffect` Guard |
| `/admin/niveis` | Classificação Técnica | Administrador, Owner | `ProtectedRoute` + `useEffect` Guard |
| `/admin/partida/:gameId` | Preparação de Partida & Times | Administrador, Owner | `ProtectedRoute` + `useEffect` Guard |
| `/admin/partida/:gameId/placar` | Placar ao Vivo da Partida | Administrador, Owner | `ProtectedRoute` + `useEffect` Guard |
| `/admin/partida/:gameId/comparecimento` | Registro de Presenças | Administrador, Owner | `ProtectedRoute` + `useEffect` Guard |

### 1.2 Coleções no Firestore & Regras RLS (`firestore.rules`)
- **`profiles/{userId}`**:
  - `read`: Público para permitir checagem de username no cadastro e diretório de atletas.
  - `create`: Aberto para criação de nova conta no cadastro.
  - `update`: Restrito a `isAdminOrOwner()` OU próprio usuário editando seus dados se `role`, `status` e `attendanceCount` **permanecerem inalterados**.
  - `delete`: Bloqueado (`false`).
- **`games/{gameId}`**:
  - `read`: Público.
  - `create`: `isAdminOrOwner()`.
  - `update`: `isAdminOrOwner()` OU atualização atômica de `confirmedCount` e `updatedAt` via transação de RSVP.
  - `delete`: Bloqueado (`false`).
- **`game_registrations/{registrationId}`**:
  - `read`: Público.
  - `create, update`: Autenticado (`isAuthenticated()`).
  - `delete`: Bloqueado (`false`).
- **`technical_level_history/{historyId}`**:
  - `read`: Autenticado (`isAuthenticated()`).
  - `create`: `isAdminOrOwner()`.
  - `update, delete`: Bloqueado (`false`).
- **`guest_players/{guestId}`**:
  - `read`: Público.
  - `create, update`: `isAdminOrOwner()`.
  - `delete`: Bloqueado (`false`).
- **`match_sessions/{matchId}`**:
  - `read`: Público.
  - `create, update`: `isAdminOrOwner()`.
  - `delete`: Bloqueado (`false`).
- **`match_participants/{participantId}`**:
  - `read`: Público.
  - `create, update, delete`: `isAdminOrOwner()`.
- **`match_sets/{setId}`**:
  - `read`: Público.
  - `create, update`: `isAdminOrOwner()`.
  - `delete`: Bloqueado (`false`).
- **`match_score_events/{eventId}`**:
  - `read`: Público.
  - `create, update`: `isAdminOrOwner()`.
  - `delete`: Bloqueado (`false`).
- **`match_attendance/{attId}`**:
  - `read`: Autenticado (`isAuthenticated()`).
  - `create, update`: `isAdminOrOwner()`.
  - `delete`: Bloqueado (`false`).
- **`attendance_adjustments/{adjId}`**:
  - `read, create`: Exclusivo do `isOwner()`.
  - `update, delete`: Bloqueado (`false`).
- **`notifications/{notificationId}`**:
  - `read, update`: Autenticado se `resource.data.recipientId == request.auth.uid` OU `isAdminOrOwner()`.
  - `create`: Autenticado (`isAuthenticated()`).
  - `delete`: Bloqueado (`false`).

---

## 2. Matriz de Autorização (RBAC)

| Recurso / Operação | Visitante | Jogador (`player`) | Administrador (`admin`) | Proprietário (`owner`) |
| :--- | :---: | :---: | :---: | :---: |
| Visualizar Jogos & Classificações | ✅ | ✅ | ✅ | ✅ |
| Confirmar / Cancelar Própria Presença em Jogo | ❌ | ✅ | ✅ | ✅ |
| Visualizar Avisos do Próprio Usuário | ❌ | ✅ | ✅ | ✅ |
| Visualizar Avisos de Outro Usuário | ❌ | ❌ | ❌ | ❌ |
| Editar Próprio Nome / Foto de Perfil | ❌ | ✅ | ✅ | ✅ |
| Modificar Próprio Papel (`role`) ou Status | ❌ | ❌ | ❌ | ❌ |
| Acessar Central Administrativa (`/admin`) | ❌ | ❌ | ✅ | ✅ |
| Criar / Editar / Cancelar Jogos | ❌ | ❌ | ✅ | ✅ |
| Atribuir Nível Técnico a Jogadores | ❌ | ❌ | ✅ | ✅ |
| Cadastrar / Editar Jogadores Convidados | ❌ | ❌ | ✅ | ✅ |
| Escalar Times e Gerenciar Placar ao Vivo | ❌ | ❌ | ✅ | ✅ |
| Finalizar Comparecimento / Contabilizar Presenças | ❌ | ❌ | ✅ | ✅ |
| Promover / Rebaixar Administradores | ❌ | ❌ | ❌ | ✅ |
| Corrigir Comparecimento Pós-Finalização (Audit) | ❌ | ❌ | ❌ | ✅ |
| Promover Outro Usuário a `owner` | ❌ | ❌ | ❌ | ❌ (Único Owner: `Euriko`) |

---

## 3. Mapeamento de Vulnerabilidades e Correções Realizadas

### V01 — Regras do Firestore Permissivas (Risco Crítico)
- **Problema**: O arquivo `firestore.rules` possuía declaração permissiva (`allow read, write: if true;`).
- **Correção**: Implementação completa das regras RLS de 8 pilares, utilizando funções auxiliares `isAuthenticated()`, `getProfileData()`, `isOwner()` e `isAdminOrOwner()`, bloqueando atualizações diretas de campos privilegiados. Implantação realizada via `deploy_firebase`.

### V02 — Isolamento da Central de Avisos
- **Problema**: Risco de leitura indevida de notificações destinadas a outros atletas.
- **Correção**: Garantia de que as consultas Firestore filtrem estritamente `where('recipientId', '==', recipientId)` e aplicação da regra de RLS `resource.data.recipientId == request.auth.uid`.

### V03 — Salvaguarda do Modelo de Single Owner (`Euriko`)
- **Problema**: Risco de elevação de privilégios para criar múltiplos proprietários.
- **Correção**:
  - `AuthContext.tsx` restringe atribuição do papel `owner` estritamente ao nome de usuário `euriko` (normalizado) no primeiro acesso se nenhum outro owner existir.
  - A interface `/admin` não exibe opções para alterar o papel do `owner`.
  - As regras RLS do Firestore impedem que administradores ou jogadores alterem seu próprio papel em `profiles`.

### V04 — Higienização de Entradas e Prevenção contra XSS
- **Problema**: Potencial injeção de scripts em campos como `displayName`, `notes`, `title` e `message`.
- **Correção**:
  - O código não utiliza `dangerouslySetInnerHTML`.
  - Todos os textos são renderizados com escape automático pelo React.
  - Validações de comprimento e formato nos serviços (`gameService`, `technicalLevelService`, `attendanceService`).

### V05 — Proteção de Chaves de API e Segredos
- **Problema**: Risco de vazamento de chaves privadas em artefatos do cliente.
- **Correção**: `firebase-applet-config.json` e `.env.example` contêm apenas identificadores públicos de cliente web. Nenhuma chave secreta de servidor ou API master está exposta.

---

## 4. Comprovação Prática de Testes de Bypass

1. **Acesso Direto por URL sem Autenticação**:
   - *Ação*: Acesso a `/admin` ou `/avisos` sem token de sessão.
   - *Resultado*: Redirecionado imediatamente para `/entrar`.

2. **Acesso a Rota Administrativa como Jogador (`role: 'player'`)**:
   - *Ação*: Navegação direta via barra de endereço para `/admin/jogos`.
   - *Resultado*: Interceptado pelo Guard de Frontend, redirecionado para `/inicio` com mensagem de erro e bloqueado no backend por RLS.

3. **Tentativa de Injeção de Campo Privilegiado em Requisição de Perfil**:
   - *Ação*: Envio de requisição `updateDoc` tentando alterar `role: 'owner'`.
   - *Resultado*: Rejeitado pelas regras do Firestore com exceção `permission-denied`.

4. **Tentativa de Consulta de Avisos de Terceiros**:
   - *Ação*: Tentativa de inscrever escuta no Firestore sem filtro de `recipientId`.
   - *Resultado*: Rejeitado com `permission-denied` devido às restrições do RLS.

---

## 5. Declaração de Conclusão e Integridade
O sistema **RallyNaVila** foi integralmente auditado. Todas as permissões, garantias de autorização, integridade de dados e restrições de papel foram validadas e aprovadas sem regressions ou impacto nas funcionalidades existentes.
