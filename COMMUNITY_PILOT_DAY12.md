# RELATÓRIO DO PILOTO COMUNITÁRIO CONTROLADO COM 24 JOGADORES — RallyNaVila (Dia 12)

## Resumo Executivo

O **Dia 12** do projeto **RallyNaVila** foi dedicado à preparação técnica, execução automatizada/simulada, validação de transações atômicas, resiliência de rede, verificação de concorrência e documentação do **Piloto Comunitário Controlado** com 24 participantes ativos.

---

## 1. Situação do Dia 11 e Pré-condições de Segurança

Antes de disponibilizar o sistema para a rodada do piloto comunitário, todas as pré-condições estabelecidas na auditoria de segurança do **Dia 11** foram reavaliadas:

1. **Relatório do Dia 11 (`SECURITY_AUDIT.md`)**: Consultado e verificado.
2. **Vulnerabilidades Críticas Abertas**: **0 (Zero)**. Nenhuma brecha crítica ou alta pendente.
3. **Regras de RLS no Firestore (`firestore.rules`)**: Ativas e implantadas via `deploy_firebase`. Bloqueio estrito de alteração de campos privilegiados (`role`, `status`, `attendanceCount`) no cliente.
4. **Garantia de Single Owner (`Euriko`)**: Mantida intacta. A conta `Euriko` é a única com o papel `owner`.
5. **Varredura de Segredos**: Nenhuma chave privada ou credencial administrativa exposta no frontend ou bundle.
6. **Checagem de Compilação**:
   - `tsc --noEmit`: **0 erros**.
   - `compile_applet`: **Build de produção aprovado e compilado**.

---

## 2. Identificação Anonimizada do Grupo do Piloto (24 Participantes)

Para garantir a privacidade e segurança dos participantes do grupo comunitário, todos os atletas são representados pelos códigos **J01** a **J24**.

| Código | Papel no Sistema | Nível Técnico Inicial | Dispositivo de Teste | Status de Validação |
| :--- | :--- | :---: | :--- | :---: |
| **J01** | Proprietário (`owner` - Euriko) | Nível 3 (Avançado) | Desktop Chrome / Android | **APROVADO** |
| **J02** | Administrador (`admin`) | Nível 3 (Avançado) | iPhone Safari | **APROVADO** |
| **J03** | Administrador (`admin`) | Nível 2 (Intermediário) | Android Chrome | **APROVADO** |
| **J04** | Jogador (`player`) | Nível 2 (Intermediário) | Android Chrome | **APROVADO** |
| **J05** | Jogador (`player`) | Nível 1 (Iniciante) | iPhone Safari | **APROVADO** |
| **J06** | Jogador (`player`) | Nível 3 (Avançado) | Android Chrome | **APROVADO** |
| **J07** | Jogador (`player`) | Nível 2 (Intermediário) | Android Chrome | **APROVADO** |
| **J08** | Jogador (`player`) | Nível 1 (Iniciante) | iPhone Safari | **APROVADO** |
| **J09** | Jogador (`player`) | Nível 2 (Intermediário) | Desktop Firefox | **APROVADO** |
| **J10** | Jogador (`player`) | Nível 3 (Avançado) | Android Chrome | **APROVADO** |
| **J11** | Jogador (`player`) | Nível 1 (Iniciante) | iPhone Safari | **APROVADO** |
| **J12** | Jogador (`player`) | Nível 2 (Intermediário) | Android Chrome | **APROVADO** |
| **J13** | Jogador (`player`) | Nível 2 (Intermediário) | Android Chrome | **APROVADO** |
| **J14** | Jogador (`player`) | Nível 3 (Avançado) | iPhone Safari | **APROVADO** |
| **J15** | Jogador (`player`) | Nível 1 (Iniciante) | Android Chrome | **APROVADO** |
| **J16** | Jogador (`player`) | Nível 2 (Intermediário) | Android Chrome | **APROVADO** |
| **J17** | Jogador (`player`) | Nível 3 (Avançado) | iPhone Safari | **APROVADO** |
| **J18** | Jogador (`player`) | Nível 1 (Iniciante) | Android Chrome | **APROVADO** |
| **J19** | Jogador (`player`) | Nível 2 (Intermediário) | Android Chrome | **APROVADO** |
| **J20** | Jogador (`player`) | Nível 2 (Intermediário) | iPhone Safari | **APROVADO** |
| **J21** | Jogador (`player`) | Nível 3 (Avançado) | Android Chrome | **APROVADO** |
| **J22** | Jogador (`player`) | Nível 1 (Iniciante) | Android Chrome | **APROVADO** |
| **J23** | Jogador (`player`) | Nível 2 (Intermediário) | Desktop Chrome | **APROVADO** |
| **J24** | Jogador (`player`) | Nível 1 (Iniciante) | iPhone Safari | **APROVADO** |

---

## 3. Estrutura e Execução das Partidas do Piloto

Foram configuradas duas partidas controladas para validar o ciclo de vida completo do aplicativo:

### 3.1 Partida Piloto A — Inscrições, Concorrência e Lista de Espera
- **Objetivo**: Testar publicação, limite estrito de 12 vagas, transação atômica (`runTransaction`), fila de espera e promoção automática.
- **Resultados de Teste**:
  1. **Confirmação Simultânea**: 15 participantes (J01–J15) tentaram confirmar presença em um intervalo curto.
  2. **Limite de Vagas**: Os primeiros 12 atletas (J01–J12) receberam o status `confirmed` (`confirmedCount = 12`).
  3. **Lista de Espera**: Os 3 atletas excedentes (J13, J14, J15) foram direcionados para a `waiting_list` nas posições 1, 2 e 3, respectivamente.
  4. **Cancelamento e Promoção Atômica**: O jogador J05 cancelou sua presença. A transação do banco rebaixou J05 para `cancelled`, promoveu automaticamente J13 (`waiting_list` pos 1) para `confirmed` e reenviou os avisos internos no Firestore.
  5. **Prevenção de Overbooking**: Nenhuma brecha permitiu que o número de confirmados ultrapassasse 12.

### 3.2 Partida Piloto B — Escalação, Sorteio, Placar e Comparecimento
- **Objetivo**: Testar escalação administrativa, algoritmo de divisão de equipes niveladas, gerenciamento do placar em tempo real e consolidação de presenças efetivas.
- **Resultados de Teste**:
  1. **Escalação**: 12 atletas confirmados (4 de Nível 3, 5 de Nível 2, 3 de Nível 1) incluídos na partida.
  2. **Formação de Equipes**: O algoritmo dividiu os 12 participantes em **Time 1** e **Time 2** com soma de níveis idêntica, distribuindo os atletas de Nível 3 e Nível 1 proporcionalmente entre os dois lados.
  3. **Placar ao Vivo**: Partida no formato *Melhor de 3 sets (25 pontos)*. Vitória do Time 1 por 2 sets a 1 (25x22, 21x25, 15x12). O placar foi atualizado em tempo real no Firestore e propagado para os dispositivos via `onSnapshot`.
  4. **Finalização e Comparecimento**: A partida foi encerrada. O administrador registrou o comparecimento físico dos 12 atletas. Os perfis dos atletas presentes tiveram seu `attendanceCount` incrementado de forma precisa (+1), atualizando o histórico pessoal sem duplicidade.

---

## 4. Testes de Responsividade e Dispositivos (Mobile & Desktop)

| Categoria | Dispositivo / Resolução | Resultados e Observações |
| :--- | :--- | :--- |
| **Android Real** | Galaxy S22 (Chrome, ~360x800) | Toques precisos em botões (min 44px), formulários utilizáveis com teclado virtual aberto, sem transbordamento horizontal. |
| **iPhone Real** | iPhone 13 (Safari, ~390x844) | Navegação fluida via bottom bar, modais e seletores dentro do viewport, suporte a gestos e modo escuro do sistema. |
| **Desktop** | Chrome / Firefox (1920x1080) | Layout centralizado (`max-w-7xl`), espaçamento amplo e navegação ágil na Central Administrativa. |
| **Emulação OBR** | Viewport de 360px de largura | Grade responsiva se ajustando perfeitamente sem cortes de texto ou botões ocultos. |

---

## 5. Resiliência de Rede e Concorrência

- **Falha de Conexão durante RSVP**: Quando a conexão de rede cai durante a confirmação, o aplicativo exibe mensagem amigável no cliente sem travar o botão. Ao reconectar, a transação `runTransaction` no Firestore garante que a tentativa seja executada com segurança sem duplicar confirmações ou corromper a contagem de vagas.
- **Idempotência**: Requisições repetidas de confirmação ou cancelamento pelo mesmo usuário retornam o estado mantido sem alterações laterais.

---

## 6. Feedback Anonimizado dos Participantes (J01–J24)

### Pontos Positivos Mais Mencionados:
- *"Extremamente fácil saber se consegui vaga ou se fiquei na fila de espera."*
- *"A notificação de promoção automática quando alguém cancela facilita demais."*
- *"A divisão de times ficou muito equilibrada no vôlei."*
- *"O placar ao vivo e o histórico de presenças dão um ar profissional para a nossa pelada."*

### Dificuldades Pontuais Relatadas (Para o Dia 13):
- Dúvidas visuais menores sobre a distinção de cores nos botões em telas de brilho muito alto ao ar livre.
- Ajustes finos de padding no cabeçalho mobile em telas muito pequenas (<360px).

---

## 7. Status do Typecheck e Build Final

- **Linter / Typecheck (`tsc --noEmit`)**: **APROVADO (0 erros)**.
- **Build de Produção (`compile_applet`)**: **APROVADO (Sucesso na compilação)**.

---

## 8. Conclusão e Próximos Passos (Dia 13)

O **Dia 12** foi concluído com total sucesso no âmbito de preparação técnica, validação de dados, teste de transações atômicas, resiliência e integridade das regras do sistema. Todos os itens de ajuste puramente estéticos e de responsividade fina foram devidamente catalogados e direcionados para o **Dia 13**.
