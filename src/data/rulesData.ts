/**
 * RallyNaVila - Official Volleyball & Community Rules Data Module
 * Static structured dataset following FIVB Official Volleyball Rules 2025-2028
 * and RallyNaVila Community Participation Guidelines.
 */

export type RuleCategory =
  | 'fundamentos'
  | 'quadra-equipes'
  | 'pontuacao'
  | 'saque-rotacao'
  | 'toques'
  | 'ataque-bloqueio'
  | 'libero'
  | 'bola-dentro-fora'
  | 'faltas'
  | 'rally-na-vila'
  | 'faq';

export interface RuleCategoryInfo {
  id: RuleCategory | 'todas';
  label: string;
  iconName: string;
  description: string;
}

export interface RuleEntry {
  id: string;
  category: RuleCategory;
  title: string;
  summary: string;
  details: string[];
  keywords: string[];
  officialReference?: string;
  isCommunityRule?: boolean;
}

export const RULE_CATEGORIES: RuleCategoryInfo[] = [
  {
    id: 'todas',
    label: 'Todas as regras',
    iconName: 'BookOpen',
    description: 'Visualizar todo o regulamento do voleibol e orientações do RallyNaVila',
  },
  {
    id: 'fundamentos',
    label: 'Fundamentos do jogo',
    iconName: 'Volleyball',
    description: 'Objetivos principais, estrutura de rallies, pontos e sets',
  },
  {
    id: 'quadra-equipes',
    label: 'Quadra e equipes',
    iconName: 'LayoutGrid',
    description: 'Dimensões oficiais, marcações e quantidade de jogadores',
  },
  {
    id: 'pontuacao',
    label: 'Pontuação e sets',
    iconName: 'Trophy',
    description: 'Sistema de pontos por rally (Rally Point System) e vantagem',
  },
  {
    id: 'saque-rotacao',
    label: 'Saque e rotação',
    iconName: 'RotateCw',
    description: 'Execução do saque, rodízio no sentido horário e faltas',
  },
  {
    id: 'toques',
    label: 'Toques na bola',
    iconName: 'Hand',
    description: 'Limite de 3 toques, contatos permitidos e condução',
  },
  {
    id: 'ataque-bloqueio',
    label: 'Ataque e bloqueio',
    iconName: 'ShieldAlert',
    description: 'Regras de cortada, bloqueio de frente e restrição do saque',
  },
  {
    id: 'libero',
    label: 'Líbero',
    iconName: 'UserCheck',
    description: 'Especialista defensivo, restrições de ataque e regra de saque',
  },
  {
    id: 'bola-dentro-fora',
    label: 'Bola dentro e fora',
    iconName: 'Target',
    description: 'Linhas da quadra, antenas e toque no chão',
  },
  {
    id: 'faltas',
    label: 'Faltas comuns',
    iconName: 'AlertTriangle',
    description: 'Invasão, toque na rede, 4 toques e carregada',
  },
  {
    id: 'rally-na-vila',
    label: 'RallyNaVila',
    iconName: 'Users',
    description: 'Confirmação, lista de espera, escalação e comparecimento real',
  },
  {
    id: 'faq',
    label: 'Dúvidas frequentes',
    iconName: 'HelpCircle',
    description: 'Respostas rápidas para as principais dúvidas de arbitragem',
  },
];

export const FIVB_OFFICIAL_SOURCE = {
  edition: 'Regras Oficiais de Voleibol FIVB 2025–2028',
  url: 'https://www.fivb.com/volleyball/the-game/official-volleyball-rules/',
  notice: 'Este guia apresenta um resumo educativo baseado nas Regras Oficiais de Voleibol FIVB 2025–2028. Jogos comunitários podem adotar formatos específicos definidos pela organização.',
};

export const QUICK_SUMMARY_ITEMS = [
  {
    title: '6 jogadores por equipe',
    desc: 'No formato oficial, cada time atua com 6 atletas em quadra.',
  },
  {
    title: 'Máximo de 3 toques',
    desc: 'A equipe possui até 3 toques para devolver a bola (o bloqueio não conta).',
  },
  {
    title: 'Bola na linha é dentro',
    desc: 'Se a bola tocar qualquer parte da linha de marcação, ela é considerada dentro.',
  },
  {
    title: 'Rotação no sentido horário',
    desc: 'Ao conquistar o direito de sacar, os jogadores rodam uma posição no sentido horário.',
  },
  {
    title: 'Sets de 25 pontos',
    desc: 'Sets oficiais exigem 25 pontos e vantagem mínima de 2 pontos para vitória.',
  },
  {
    title: 'Proibido segurar a bola',
    desc: 'A bola deve ser golpeada limpa, sendo falta a retenção ou condução.',
  },
];

export const RULES_DATA: RuleEntry[] = [
  // --- FUNDAMENTOS ---
  {
    id: 'fund_01',
    category: 'fundamentos',
    title: 'Objetivo Principal do Voleibol',
    summary: 'Enviar a bola por cima da rede e fazê-la tocar o chão no campo adversário.',
    details: [
      'O voleibol é um esporte jogado por duas equipes em uma quadra dividida por uma rede.',
      'O objetivo é enviar a bola por cima da rede para que ela toque o chão da quadra adversária e evitar que o adversário faça o mesmo no seu campo.',
      'A bola é colocada em jogo pelo sacador, que golpeia a bola enviando-a para o campo adversário.',
      'A disputa (rally) continua até que a bola toque o chão, vá para fora ou uma equipe cometa uma falta ao devolvê-la.'
    ],
    keywords: ['objetivo', 'fundamento', 'rally', 'rede', 'campo', 'voleibol'],
    officialReference: 'Regra FIVB 1.0 - Instalações e Equipamentos / Regra 6.1',
  },
  {
    id: 'fund_02',
    category: 'fundamentos',
    title: 'Conquista de Pontos e Rallies',
    summary: 'Cada jogada (rally) disputada vale 1 ponto para a equipe vencedora.',
    details: [
      'Cada jogada no voleibol é chamada de rally.',
      'A equipe que vence o rally marca um ponto, independentemente de ter sacado ou recebido.',
      'Se a equipe receptora vence o rally, ela ganha 1 ponto e conquistas o direito de sacar, realizando a rotação obrigatória.',
      'Se a equipe sacadora vence o rally, ela ganha 1 ponto e o mesmo sacador continua sacando.'
    ],
    keywords: ['ponto', 'rally', 'pontuação', 'saque', 'receptora', 'sacadora'],
    officialReference: 'Regra FIVB 6.1 - Para marcar um ponto',
  },
  {
    id: 'fund_03',
    category: 'fundamentos',
    title: 'Estrutura da Partida (Rally, Set e Jogo)',
    summary: 'Diferença conceitual entre jogada (rally), ponto, set e partida completa.',
    details: [
      'Rally: A sequência de ações desde o golpe do saque até a bola ficar fora de jogo.',
      'Ponto: A unidade conquistada ao vencer um rally.',
      'Set: Uma divisão da partida vencida pela equipe que alcançar a pontuação estipulada com margem de 2 pontos.',
      'Partida: A disputa total composta por um número estipulado de sets (ex.: melhor de 3 ou melhor de 5).'
    ],
    keywords: ['estrutura', 'set', 'partida', 'jogo', 'rally', 'conceito'],
    officialReference: 'Regra FIVB 6.2 - Para vencer um set',
  },

  // --- QUADRA E EQUIPES ---
  {
    id: 'quadra_01',
    category: 'quadra-equipes',
    title: 'Dimensões Oficiais da Quadra e da Rede',
    summary: 'Quadra retangular de 18 x 9 metros com rede central ajustada por categoria.',
    details: [
      'A quadra oficial de jogo é um retângulo medindo 18 x 9 m, cercada por uma zona livre.',
      'A rede é instalada verticalmente sobre a linha central, com altura de 2,43 m para homens e 2,24 m para mulheres.',
      'A quadra é dividida em duas metades de 9 x 9 m pela linha central.',
      'Em cada metade, a linha de ataque situa-se a 3 metros de distância da linha central, delimitando a zona de ataque e a zona de defesa.'
    ],
    keywords: ['dimensao', 'quadra', 'medida', 'rede', 'altura', 'linha de ataque', '3 metros'],
    officialReference: 'Regra FIVB 1.1 - Dimensões / Regra 2.1 - Altura da rede',
  },
  {
    id: 'quadra_02',
    category: 'quadra-equipes',
    title: 'Composição de Atletas em Quadra',
    summary: 'Seis jogadores ativos por equipe no formato oficial da FIVB.',
    details: [
      'No formato oficial, cada equipe deve ter sempre 6 jogadores em quadra durante a partida.',
      'A formação inicial da equipe indica a ordem de rotação dos jogadores na quadra.',
      'Essa ordem deve ser mantida ao longo do set completo.',
      'Três jogadores atuam na linha da frente (posições 4, 3 e 2) e três na linha de defesa (posições 5, 6 e 1).'
    ],
    keywords: ['jogadores', 'atletas', '6 jogadores', 'posicoes', 'formacao', 'linha de frente', 'linha de defesa'],
    officialReference: 'Regra FIVB 4.1 - Composição da equipe / Regra 7.3',
  },
  {
    id: 'quadra_03',
    category: 'quadra-equipes',
    title: 'Adaptações em Jogos Comunitários do RallyNaVila',
    summary: 'Jogos de lazer e comunitários podem adaptar o espaço ou número de atletas.',
    details: [
      'Para promover a inclusão e a prática comunitária no RallyNaVila, partidas festivas podem adotar adaptações organizacionais.',
      'Exemplos de adaptação incluem jogar com 4 ou 5 atletas por time se o grupo for menor, ou ajustar a altura da rede.',
      'Essas adaptações comunitárias visam a diversão e a integração, sem alterar os princípios fundamentais do voleibol.'
    ],
    keywords: ['adaptacao', 'comunitaria', 'lazer', 'rallynavila', 'inclusao', 'quadra'],
    isCommunityRule: true,
  },

  // --- PONTUAÇÃO E SETS ---
  {
    id: 'pont_01',
    category: 'pontuacao',
    title: 'Sistema de Pontuação por Rally (Rally Point System)',
    summary: 'Todas as jogadas resultam em ponto direto para a equipe vencedora do rally.',
    details: [
      'O voleibol moderno utiliza o sistema Rally Point System.',
      'Não existe mais a necessidade de ter a "vantagem do saque" para pontuar.',
      'Qualquer erro do adversário (bola fora, falta na rede, 4 toques) resulta em ponto imediato para sua equipe.'
    ],
    keywords: ['pontuacao', 'rally point', 'ponto direto', 'sistema', 'placar'],
    officialReference: 'Regra FIVB 6.1 - Sistema de pontuação',
  },
  {
    id: 'pont_02',
    category: 'pontuacao',
    title: 'Pontuação Oficiais do Set e Vantagem de 2 Pontos',
    summary: 'O set é vencido ao atingir 25 pontos com margem mínima de 2 pontos.',
    details: [
      'Um set (exceto o 5º set decisivo) é vencido pela equipe que marcar primeiro 25 pontos.',
      'É obrigatória a vantagem mínima de 2 pontos (exemplo: 25x23, 26x24, 28x26).',
      'Não há limite teto de pontos: o set continua indefinidamente até que uma equipe abra 2 pontos de vantagem.'
    ],
    keywords: ['set', '25 pontos', 'vantagem', 'diferenca de 2', 'placar oficial'],
    officialReference: 'Regra FIVB 6.2 - Para vencer um set',
  },
  {
    id: 'pont_03',
    category: 'pontuacao',
    title: 'Set Decisivo (Tie-break)',
    summary: 'Em caso de empate em sets, o set desempate é jogado até 15 pontos.',
    details: [
      'Em partidas de melhor de 5 sets, se houver empate em 2x2, o 5º set é o tie-break.',
      'O tie-break é disputado até 15 pontos, também com a exigência de vantagem mínima de 2 pontos.',
      'As equipes trocam de quadra quando uma delas alcançar 8 pontos.'
    ],
    keywords: ['tiebreak', 'set decisivo', '15 pontos', 'desempate', 'troca de quadra'],
    officialReference: 'Regra FIVB 6.3 - Para vencer a partida',
  },

  // --- SAQUE E ROTAÇÃO ---
  {
    id: 'saque_01',
    category: 'saque-rotacao',
    title: 'Execução do Saque e Zona de Saque',
    summary: 'O saque é efetuado atrás da linha de fundo dentro da largura da quadra.',
    details: [
      'O saque é a ação de colocar a bola em jogo pelo jogador da posição 1 (fundo direito).',
      'Deve ser executado na zona de saque, atrás da linha de fundo e entre os prolongamentos das linhas laterais (9m).',
      'O sacador tem 8 segundos após o apito do árbitro para golpear a bola.',
      'Não é permitido pisar na linha de fundo nem dentro da quadra antes de golpear a bola.'
    ],
    keywords: ['saque', 'execucao', 'linha de fundo', '8 segundos', 'zona de saque'],
    officialReference: 'Regra FIVB 12.1 - Execução do saque',
  },
  {
    id: 'saque_02',
    category: 'saque-rotacao',
    title: 'Toque na Rede Durante o Saque',
    summary: 'A bola sacada que toca a fita da rede e passa continua em jogo.',
    details: [
      'Se a bola sacada tocar a fita superior da rede e passar para o campo adversário dentro do espaço de cruzamento, o jogo prossegue normalmente.',
      'Se a bola tocar na rede e não passar, é falta de saque e ponto do adversário.'
    ],
    keywords: ['saque', 'rede', 'fita', 'toque na rede', 'jogo continua'],
    officialReference: 'Regra FIVB 12.6 - Faltas no saque / Regra 10.1',
  },
  {
    id: 'saque_03',
    category: 'saque-rotacao',
    title: 'Rodízio e Rotação das Posições',
    summary: 'Ao recuperar o saque, a equipe roda obrigatoriamente no sentido horário.',
    details: [
      'Quando a equipe receptora ganha o rally, ela ganha o direito de sacar e seus jogadores DEVEM rodar uma posição no sentido horário.',
      'O jogador da posição 2 vai para a posição 1 e será o novo sacador.',
      'O jogador da posição 1 vai para a posição 6, o da 6 para a 5, o da 5 para a 4, o da 4 para a 3, e o da 3 para a 2.',
      'A ordem de rotação declarada no início do set deve ser respeitada rigorosamente.'
    ],
    keywords: ['rotacao', 'rodizio', 'sentido horario', 'posicoes', 'ordem de saque'],
    officialReference: 'Regra FIVB 7.6 - Rotação',
  },

  // --- TOQUES NA BOLA ---
  {
    id: 'toq_01',
    category: 'toques',
    title: 'Limite de Três Toques por Equipe',
    summary: 'A equipe possui no máximo 3 toques para devolver a bola ao campo adversário.',
    details: [
      'Cada equipe tem direito a no máximo 3 toques na bola para enviá-la de volta por cima da rede.',
      'Se uma equipe realizar 4 toques antes de devolver a bola, comete a falta de "quatro toques".',
      'O contato acidental com a bola também conta como um toque da equipe.'
    ],
    keywords: ['tres toques', 'limite', 'toques', 'quatro toques', 'devolucao'],
    officialReference: 'Regra FIVB 9.1 - Toques da equipe',
  },
  {
    id: 'toq_02',
    category: 'toques',
    title: 'Toque no Bloqueio Não Conta como Toque da Equipe',
    summary: 'O contato do bloqueio é neutro e não reduz os 3 toques da equipe.',
    details: [
      'O toque realizado durante o bloqueio NÃO é contado como um dos 3 toques da equipe.',
      'Consequentemente, após um toque de bloqueio, a equipe ainda tem direito a realizar 3 toques completos.',
      'O primeiro toque após o bloqueio pode ser executado por qualquer jogador, inclusive por quem tocou na bola no bloqueio.'
    ],
    keywords: ['bloqueio', 'toque no bloqueio', 'tres toques', 'primeiro toque', 'excecao'],
    officialReference: 'Regra FIVB 14.4 - Toque de bloqueio',
  },
  {
    id: 'toq_03',
    category: 'toques',
    title: 'Proibição de Dois Contatos Consecutivos (Dois Toques)',
    summary: 'Um jogador não pode tocar a bola duas vezes seguidas, salvo exceções.',
    details: [
      'Um atleta não pode golpear a bola duas vezes consecutivas.',
      'Exceção 1: O toque no bloqueio não impede que o mesmo bloqueador faça o toque subsequente.',
      'Exceção 2: Na primeira ação de defesa da equipe (desde que em um único movimento), a bola pode tocar várias partes do corpo sucessivamente.'
    ],
    keywords: ['dois toques', 'dois contatos', 'consecutivos', 'defesa', 'excecao'],
    officialReference: 'Regra FIVB 9.2.3 - Contatos sucessivos',
  },
  {
    id: 'toq_04',
    category: 'toques',
    title: 'Condução, Retenção e Partes do Corpo',
    summary: 'A bola deve ser golpeada limpa e pode tocar qualquer parte do corpo.',
    details: [
      'A bola pode tocar qualquer parte do corpo do jogador (mãos, braços, peito, pernas e pés).',
      'A bola deve ser GOLPEADA, não podendo ser segurada, retida, carregada, empurrada ou lançada.',
      'Se a bola descansar momentaneamente na mão ou braço do jogador, o árbitro marcará a falta de condução (carregada).'
    ],
    keywords: ['conducao', 'carregada', 'partes do corpo', 'golpeada', 'pes', 'pernas'],
    officialReference: 'Regra FIVB 9.2 - Características do toque / Regra 9.3.3',
  },

  // --- ATAQUE E BLOQUEIO ---
  {
    id: 'atq_01',
    category: 'ataque-bloqueio',
    title: 'Definição de Golpe de Ataque e Restrições da Defesa',
    summary: 'Ações de ataque e limites para jogadores das posições de defesa.',
    details: [
      'Qualquer ação que envie a bola para o campo adversário (exceto saque e bloqueio) é considerada golpe de ataque.',
      'Jogadores da linha da frente (posições 2, 3 e 4) podem completar um ataque a qualquer altura.',
      'Jogadores da linha de defesa (posições 5, 6 e 1) só podem atacar acima da borda superior da rede se o salto for realizado ATRÁS da linha de ataque (3 metros).'
    ],
    keywords: ['ataque', 'cortada', 'linha de defesa', '3 metros', 'zona de ataque'],
    officialReference: 'Regra FIVB 13.1 - Golpe de ataque / Regra 13.2.2',
  },
  {
    id: 'atq_02',
    category: 'ataque-bloqueio',
    title: 'Regras e Restrições do Bloqueio',
    summary: 'Apenas jogadores da frente bloqueiam e é proibido bloquear o saque.',
    details: [
      'O bloqueio é a ação de interceptar a bola vinda do adversário junto à rede.',
      'Apenas jogadores da linha da frente (posições 2, 3 e 4) podem completar um bloqueio.',
      'É ESTRITAMENTE PROIBIDO bloquear ou atacar o saque adversário dentro da zona de ataque enquanto a bola estiver totalmente acima da rede.'
    ],
    keywords: ['bloqueio', 'bloquear saque', 'linha da frente', 'interceptacao'],
    officialReference: 'Regra FIVB 14.1 - Bloqueio / Regra 13.2.4',
  },

  // --- LÍBERO ---
  {
    id: 'lib_01',
    category: 'libero',
    title: 'Função e Uniforme do Líbero',
    summary: 'Especialista defensivo com uniforme contrastante e substituições ilimitadas.',
    details: [
      'O líbero é um jogador especializado em recepção e defesa.',
      'O líbero deve vestir um uniforme de cor diferente e bem contrastante com o restante da equipe.',
      'Atua exclusivamente nas posições da linha de defesa (1, 6 e 5).',
      'Suas trocas em quadra são chamadas de "substituições de líbero" e não contam no limite regular de substituições da equipe.'
    ],
    keywords: ['libero', 'defesa', 'uniforme', 'substituicao', 'especialista'],
    officialReference: 'Regra FIVB 19.1 - Designação do Líbero / Regra 19.3',
  },
  {
    id: 'lib_02',
    category: 'libero',
    title: 'Restrições do Líbero (Ataque, Bloqueio e Levantamento)',
    summary: 'O líbero não pode atacar acima da rede, bloquear ou fazer levantamento de toque na zona de ataque.',
    details: [
      'O líbero não pode completar um golpe de ataque de qualquer lugar se no momento do contato a bola estiver totalmente acima do topo da rede.',
      'O líbero não pode bloquear nem tentar bloquear.',
      'Se o líbero realizar um levantamento de toque estando DENTRO da zona de ataque (frente da linha de 3m), nenhum jogador poderá atacar a bola acima da borda da rede.',
      'Se o levantamento do líbero for de manchete ou realizado atrás da linha de 3m, o ataque é liberado.'
    ],
    keywords: ['libero', 'restricoes', 'levantamento', 'toque', 'bloqueio', 'ataque'],
    officialReference: 'Regra FIVB 19.3.1 - Ações envolvendo o Líbero',
  },
  {
    id: 'lib_03',
    category: 'libero',
    title: 'Regra Oficial FIVB: O Líbero NÃO pode sacar',
    summary: 'Segundo a regra oficial internacional FIVB, o líbero é proibido de sacar.',
    details: [
      'De acordo com as Regras Oficiais de Voleibol FIVB 2025–2028, o líbero NÃO tem permissão para sacar.',
      'Nota de esclarecimento: Embora algumas ligas escolares ou comunitárias americanas (ex.: NCAA/NFHS) permitam o saque do líbero em uma rotação, no regulamento internacional oficial da FIVB isso é considerado falta.',
      'No RallyNaVila, seguimos a norma da FIVB onde o líbero atua estritamente na recepção e defesa.'
    ],
    keywords: ['libero', 'saque', 'fivb', 'proibido sacar', 'regra oficial'],
    officialReference: 'Regra FIVB 19.3.1 - Ações proibidas ao Líbero',
  },

  // --- BOLA DENTRO E FORA ---
  {
    id: 'bola_01',
    category: 'bola-dentro-fora',
    title: 'Critério de Bola Dentro (Linhas da Quadra)',
    summary: 'A bola é dentro se qualquer parte dela tocar as linhas de marcação.',
    details: [
      'A bola é considerada DENTRO quando qualquer parte do seu contorno tocar o piso da quadra de jogo, incluindo as linhas delimitadoras.',
      'Basta um milímetro de contato da bola com a linha lateral ou de fundo para ser validada como bola dentro.'
    ],
    keywords: ['bola dentro', 'linha', 'quadra', 'toque no chão', 'valida'],
    officialReference: 'Regra FIVB 8.3 - Bola "dentro"',
  },
  {
    id: 'bola_02',
    category: 'bola-dentro-fora',
    title: 'Critério de Bola Fora e Antenas',
    summary: 'Bola completamente fora das linhas, toque na antena ou objeto externo.',
    details: [
      'A bola é considerada FORA quando:',
      '1. A parte do seu contato com o chão estiver completamente fora das linhas de limitação;',
      '2. Tocar um objeto fora da quadra, o teto ou uma pessoa fora de jogo;',
      '3. Tocar as antenas, cabos, postes ou a própria rede fora das faixas laterais;',
      '4. Cruzar completamente o plano vertical da rede por fora do espaço de passagem.'
    ],
    keywords: ['bola fora', 'antena', 'fora das linhas', 'teto', 'poste'],
    officialReference: 'Regra FIVB 8.4 - Bola "fora"',
  },

  // --- FALTAS COMUNS ---
  {
    id: 'falt_01',
    category: 'faltas',
    title: 'Faltas de Toque e Conduta na Bola',
    summary: 'Quatro toques, dois contatos seguidos e condução.',
    details: [
      'Quatro toques: Uma equipe toca a bola 4 vezes antes de enviá-la ao adversário.',
      'Dois toques: Um jogador toca a bola duas vezes consecutivas.',
      'Condução (Carregada): A bola é segurada, empurrada ou lançada ao invés de ser golpeada limpa.'
    ],
    keywords: ['faltas', 'quatro toques', 'dois toques', 'conducao', 'carregada'],
    officialReference: 'Regra FIVB 9.3 - Faltas no toque de bola',
  },
  {
    id: 'falt_02',
    category: 'faltas',
    title: 'Toque na Rede e Invasão',
    summary: 'Tocar a rede durante a jogada e invasão que interfira no jogo.',
    details: [
      'Toque na rede: É falta quando o jogador toca a rede entre as antenas DURANTE a ação de jogar a bola.',
      'Nota: O contato acidental de cabelos ou um toque irrelevante fora da ação de jogo não é automaticamente falta.',
      'Invasão por baixo da rede: É permitido tocar o campo adversário com o pé/mão desde que parte do membro permaneça sobre a linha central e não interfira no jogo adversário.'
    ],
    keywords: ['toque na rede', 'rede', 'invasao', 'linha central', 'interferencia'],
    officialReference: 'Regra FIVB 11.3 - Contato com a rede / Regra 11.2 - Invasão',
  },

  // --- RALLYNAVILA (COMUNIDADE) ---
  {
    id: 'rnv_01',
    category: 'rally-na-vila',
    title: 'Confirmação de Presença em Jogos',
    summary: 'Indica a intenção do jogador e garante vaga na partida agendada.',
    details: [
      'A confirmação pelo aplicativo é o ato em que o jogador declara sua intenção de comparecer à partida.',
      'Garante sua vaga respeitando o limite máximo de jogadores do jogo.',
      'IMPORTANTE: A confirmação prévia NÃO contabiliza automaticamente uma participação no seu perfil.'
    ],
    keywords: ['confirmacao', 'vaga', 'intencao', 'presenca', 'rallynavila'],
    isCommunityRule: true,
  },
  {
    id: 'rnv_02',
    category: 'rally-na-vila',
    title: 'Prazo de Cancelamento e Fila de Espera',
    summary: 'Desistências devem ser feitas no prazo para liberar vagas na fila.',
    details: [
      'Caso não possa comparecer, você deve cancelar sua confirmação o quanto antes.',
      'Ao cancelar dentro do prazo, sua vaga é liberada automaticamente para o 1º jogador da lista de espera.',
      'A lista de espera promove jogadores por ordem estrita de chegada.'
    ],
    keywords: ['cancelamento', 'desistência', 'lista de espera', 'fila', 'prazo'],
    isCommunityRule: true,
  },
  {
    id: 'rnv_03',
    category: 'rally-na-vila',
    title: 'Escalação e Formação de Times',
    summary: 'Sorteio de times e definição de partidas pelos organizadores.',
    details: [
      'A escalação indica que seu nome foi selecionado e distribuído em um dos times sorteados.',
      'O algoritmo de sorteio utiliza os níveis técnicos dos jogadores para equilibrar as partidas.',
      'Estar escalado indica que você vai jogar na rodada, mas a presença final ainda depende do comparecimento presencial.'
    ],
    keywords: ['escalacao', 'times', 'sorteio', 'equilíbrio', 'nivelamento'],
    isCommunityRule: true,
  },
  {
    id: 'rnv_04',
    category: 'rally-na-vila',
    title: 'Comparecimento Real e Contador de Participações',
    summary: 'Apenas o comparecimento confirmado após a partida incrementa o perfil.',
    details: [
      'Após o encerramento do jogo, os organizadores registram o comparecimento presencial real de cada atleta.',
      'Somente o status "Presente" marcado após o jogo adiciona +1 ao seu contador "attendance_count" no perfil.',
      'Jogadores ausentes ou convidados sem cadastro não acumulam participações em perfis.'
    ],
    keywords: ['comparecimento', 'presenca real', 'attendance_count', 'contador', 'historico'],
    isCommunityRule: true,
  },

  // --- DÚVIDAS FREQUENTES (FAQ) ---
  {
    id: 'faq_01',
    category: 'faq',
    title: 'A bola que toca a linha está dentro?',
    summary: 'Sim, se qualquer parte da bola tocar a linha, é bola dentro.',
    details: [
      'Sim! No voleibol, as linhas delimitadoras fazem parte integrante da quadra de jogo.',
      'Se qualquer parte do contorno da bola tocar a linha de fundo ou lateral, a bola é válida ("dentro").'
    ],
    keywords: ['linha', 'dentro', 'valida', 'chao', 'faq'],
    officialReference: 'Regra FIVB 8.3',
  },
  {
    id: 'faq_02',
    category: 'faq',
    title: 'O toque no bloqueio conta como um dos três toques do time?',
    summary: 'Não, o bloqueio é neutro e a equipe mantém os 3 toques.',
    details: [
      'Não! O contato da bola no bloqueio não é considerado para a contagem dos 3 toques da equipe.',
      'Após o toque no bloqueio, a equipe ainda dispõe de 3 toques completos para organizar o ataque.'
    ],
    keywords: ['bloqueio', 'tres toques', 'faq', 'neutro'],
    officialReference: 'Regra FIVB 14.4',
  },
  {
    id: 'faq_03',
    category: 'faq',
    title: 'A bola pode tocar a rede durante o saque?',
    summary: 'Sim, desde que atravesse por cima da rede para o campo adversário.',
    details: [
      'Sim! Se a bola sacada tocar a fita superior da rede e passar para a quadra adversária dentro do espaço de cruzamento, o jogo continua normalmente.'
    ],
    keywords: ['saque', 'rede', 'fita', 'faq'],
    officialReference: 'Regra FIVB 12.6 / 10.1',
  },
  {
    id: 'faq_04',
    category: 'faq',
    title: 'O jogador pode tocar a bola com o pé?',
    summary: 'Sim, é permitido tocar a bola com qualquer parte do corpo.',
    details: [
      'Sim! A bola pode tocar qualquer parte do corpo do atleta, desde o topo da cabeça até a ponta dos pés.',
      'O toque deve ser limpo e sem condução ou retenção.'
    ],
    keywords: ['pe', 'perna', 'corpo', 'faq', 'toque'],
    officialReference: 'Regra FIVB 9.2.1',
  },
  {
    id: 'faq_05',
    category: 'faq',
    title: 'Confirmar presença no app já conta como participação no perfil?',
    summary: 'Não. Somente o comparecimento presencial confirmado após o jogo pontua.',
    details: [
      'Não! A confirmação é um pré-agendamento de vaga.',
      'O contador de participações do seu perfil só é incrementado quando os organizadores registram seu comparecimento real presencial após a finalização da partida.'
    ],
    keywords: ['confirmacao', 'comparecimento', 'contador', 'perfil', 'faq'],
    isCommunityRule: true,
  },
  {
    id: 'faq_06',
    category: 'faq',
    title: 'Estar escalado nos times já garante presença no histórico?',
    summary: 'Não. A escalação sorteia os times, mas o registro presencial é feito depois.',
    details: [
      'Não! A escalação é a formação tática das equipes.',
      'Se um jogador for escalado mas não comparecer, o comparecimento final será marcado como ausente e o contador não subirá.'
    ],
    keywords: ['escalacao', 'presenca', 'historico', 'faq'],
    isCommunityRule: true,
  },
  {
    id: 'faq_07',
    category: 'faq',
    title: 'Os jogos da vila precisam seguir rigidamente o formato oficial de 5 sets?',
    summary: 'Não. Organizadores podem configurar partidas em set único ou melhor de 3.',
    details: [
      'Os jogos comunitários do RallyNaVila respeitam as regras oficiais do voleibol, mas adotam formatos de partida flexíveis (ex.: set único de 25 pontos) adaptados ao tempo disponível e número de participantes.'
    ],
    keywords: ['formato', 'sets', 'adaptacao', 'vila', 'faq'],
    isCommunityRule: true,
  },
  {
    id: 'faq_08',
    category: 'faq',
    title: 'O líbero pode sacar na regra oficial da FIVB?',
    summary: 'Não. Segundo o regulamento oficial internacional FIVB, o líbero não pode sacar.',
    details: [
      'Não. Pelas regras internacionais da FIVB 2025–2028, o líbero não tem permissão para sacar.',
      'Sua atuação é restrita à recepção de saque e cobertura de defesa nas posições do fundo de quadra.'
    ],
    keywords: ['libero', 'saque', 'fivb', 'faq'],
    officialReference: 'Regra FIVB 19.3.1',
  }
];
