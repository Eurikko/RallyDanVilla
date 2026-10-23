# PROJECT CONTEXT — RallyNaVila

## Visão do Produto
O **RallyNaVila** foi idealizado para transformar a experiência de grupos comunitários que jogam vôlei semanalmente, eliminando a bagunça de listas em aplicativos de mensagem instantânea e garantindo partidas equilibradas.

---

## Funcionalidades Implementadas (Dia 1 ao Dia 12)

1. **Identidade Visual Esportiva Literal (`BrandMark`):** Ícone exclusivo de bola de vôlei branca com divisões curvas características e vinco vermelho, passando sobre a rede em azul-marinho com traço diagonal de velocidade e trajetória.
2. **Autenticação Firebase Native:** Login e cadastro de jogadores utilizando apenas username e senha (sem solicitar e-mail na interface).
3. **Mapeamento Técnico para Firebase Auth:** E-mail técnico interno gerado via `${usernameNormalized}@rallynavila.internal`.
4. **Perfis no Firestore (`profiles/{uid}`):** Registro automático com papéis (`owner`, `admin`, `player`), nível técnico inicial (`null`) e contagem de presenças (`0`).
5. **Atribuição Única do Primeiro Owner:** Atribuição do papel `owner` à conta com username exato `Euriko` sem hardcode em componentes frontend ou regras de autorização do bundle.
6. **Central Administrativa (`/admin`):** Rota autenticada protegida para `owner` e `admin`, bloqueando acesso de `player` com aviso de permissão.
7. **Gerenciamento de Administradores:** Interface exclusiva do `owner` para busca debounced de jogadores ativos e alteração segura de papéis (`player` ↔ `admin`) com confirmação em modal.
8. **Criação e Gestão de Jogos (`/admin/jogos`):** Criação, edição e cancelamento de partidas por `owner` e `admin` com validações no cliente/servidor (título 3-80, local 2-120, limite de 4-30 atletas, observações até 500 caracteres, datas no futuro).
9. **Confirmação e Cancelamento Atômico de Presença (`/jogos/:id`):** Transação atômica no Firestore (`runTransaction`) para reservar ou cancelar vagas sem risco de overbooking/condições de corrida.
10. **Integração do Próximo Jogo (`/inicio` e `/jogos`):** Consulta dinâmica do próximo jogo agendado na página inicial e listagem completa de jogos com status de vagas ("Vagas Disponíveis", "Última Vaga!", "Lotado", "Presença Confirmada", "Jogo Cancelado").
11. **Níveis Técnicos e Gestão Administrativa de Níveis (`/admin/niveis`):** Classificação técnica dos atletas em Níveis 1, 2 e 3 por administradores e owner, com alteração local sincronizada no perfil do próprio usuário.
12. **Livro de Regras do Vôlei e Guia da Comunidade (`/regras`):** Módulo estático, estruturado e tipado em frontend contendo 11 categorias de regras baseadas no regulamento oficial FIVB 2025–2028 e diretrizes operacionais do RallyNaVila.
13. **Central de Avisos e Notificações Internas (`/avisos`):** Sistema de notificações internas persistentes gravadas no Firestore (`notifications`) disparadas por eventos reais do backend (publicação de jogo, atualização, cancelamento, vaga confirmada, escalação, encerramento de partida e registro de presença).
14. **Auditoria de Segurança e Políticas RLS (Dia 11):** Cobertura completa de 12 coleções Firestore com controle de acesso RBAC de 8 pilares, prevenindo elevação de privilégios e bypass via browser.
15. **Piloto Comunitário Controlado com 24 Jogadores (Dia 12):** Validação técnica completa dos fluxos de inscrição com 12 vagas, lista de espera, promoção automática, sorteio equilibrado de times, placar ao vivo e registro de presenciais com atualização do histórico.

---

## Princípios de Segurança & Decisões Arquiteturais

- **Sem Hardcode no Bundle:** Autorização é baseada no atributo de perfil `role` retornado do Firestore backend.
- **Transações Atômicas:** Operações críticas de contagem de presença usam `runTransaction` garantindo consistência estrita no banco de dados.
- **Divisão Modular:** Estrutura limpa em `/src/components`, `/src/context`, `/src/lib`, `/src/pages` e `/src/types`.
- **Mobile First por Padrão:** Layout responsivo otimizado para celulares com barra de navegação segura.
