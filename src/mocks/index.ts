import { UserProfile, Game, Score, CommunityRule } from '../types';

export const DEMO_USER: UserProfile = {
  uid: 'usr_demo_123',
  username: 'jogadordemo',
  usernameNormalized: 'jogadordemo',
  role: 'player',
  status: 'active',
  technicalLevel: null,
  attendanceCount: 0,
  photoUrl: null,
  createdAt: '2026-07-25',
};

export const DEMO_GAMES: Game[] = [
  {
    id: 'game_001',
    title: 'Partida Semanal da Vila',
    scheduledAt: '2026-08-02T16:00:00.000Z',
    date: 'Sábado, 02 de Agosto',
    time: '16:00 - 18:00',
    location: 'Quadra Poliesportiva Central da Vila',
    status: 'scheduled',
    maxPlayers: 12,
    confirmedCount: 0,
    createdBy: 'usr_admin_demo',
    description: 'Partida recreativa de vôlei para integrar a comunidade. Venha com animação e garrafa de água!',
  },
];

export const DEMO_PAST_GAMES: Game[] = [
  {
    id: 'game_past_001',
    title: 'Rally Festivo de Abertura',
    scheduledAt: '2026-07-15T15:00:00.000Z',
    date: '15 de Julho de 2026',
    time: '15:00 - 17:30',
    location: 'Quadra da Vila - Arena Principal',
    status: 'completed',
    maxPlayers: 12,
    confirmedCount: 12,
    createdBy: 'usr_admin_demo',
    description: 'Jogo inaugural demonstrativo do sistema RallyNaVila.',
  }
];

export const DEMO_SCOREBOARD: Score = {
  id: 'score_demo_01',
  gameId: 'game_001',
  teamA: {
    name: 'Time Azul',
    color: '#1E3A8A',
    sets: 0,
    pointsCurrentSet: 0,
  },
  teamB: {
    name: 'Time Vermelho',
    color: '#E63946',
    sets: 0,
    pointsCurrentSet: 0,
  },
  isFinished: false,
  statusText: 'Placar demonstrativo - Aguardando início do jogo',
};

export const DEMO_RULES: CommunityRule[] = [
  {
    id: 'rule_1',
    title: 'Respeito e Fair Play',
    category: 'Etiqueta',
    summary: 'A convivência saudável e o espírito esportivo são obrigatórios.',
    description: 'Todos os participantes devem promover um ambiente acolhedor. Decisões de arbitragem ou consensos de quadra devem ser respeitados sem ofensas.',
  },
  {
    id: 'rule_2',
    title: 'Formação de Times Equilibrados',
    category: 'Geral',
    summary: 'Sorteio e divisão baseados em classificação técnica justa.',
    description: 'Os times são montados pelos administradores buscando nivelamento técnico para garantir partidas disputadas e divertidas para todos.',
  },
  {
    id: 'rule_3',
    title: 'Pontuação por Sets (Rally System)',
    category: 'Pontuação',
    summary: 'Partidas com sets de 25 pontos com vantagem de 2 pontos.',
    description: 'Toda bola jogada vale ponto (Rally Point System). O set é vencido pela equipe que atingir 25 pontos primeiro com diferença mínima de 2 pontos.',
  },
  {
    id: 'rule_4',
    title: 'Toques no Bloco e na Rede',
    category: 'Faltas',
    summary: 'Qualquer contato com a fita superior da rede é falta.',
    description: 'Toque na rede durante a ação de jogar a bola é considerado falta. O toque no bloqueio não conta como um dos três toques da equipe.',
  },
  {
    id: 'rule_5',
    title: 'Pontualidade e Confirmação',
    category: 'Geral',
    summary: 'Confirmar presença com antecedência e chegar 15 min antes.',
    description: 'A confirmação no aplicativo garante a vaga. Desistências de última hora prejudicam a turma e devem ser evitadas.',
  },
];
