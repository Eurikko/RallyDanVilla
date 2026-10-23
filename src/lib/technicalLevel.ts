import { TechnicalLevel } from '../types';

export type TechnicalLevelNumber = 1 | 2 | 3;

export interface TechnicalLevelInfo {
  level: TechnicalLevelNumber;
  name: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const TECHNICAL_LEVELS: Record<TechnicalLevelNumber, TechnicalLevelInfo> = {
  1: {
    level: 1,
    name: 'Iniciante',
    description: 'Em fase inicial ou desenvolvendo fundamentos básicos',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
  },
  2: {
    level: 2,
    name: 'Intermediário',
    description: 'Executa fundamentos com consistência e entende o jogo',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
  },
  3: {
    level: 3,
    name: 'Avançado',
    description: 'Possui elevada execução, leitura táctica e regularidade',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
  },
};

/**
 * Safely parses any value into a valid 3-level number (1, 2, 3) or null
 * Maps legacy 5-level scale: 1,2 -> 1 | 3 -> 2 | 4,5 -> 3
 */
export function parseTechnicalLevel(value: TechnicalLevel | null | undefined | string | number): TechnicalLevelNumber | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (value === 1 || value === 2) return 1;
    if (value === 3) return 2;
    if (value === 4 || value === 5) return 3;
    return null;
  }

  const str = String(value).trim().toLowerCase();
  if (!str || str === 'nao_classificado' || str === '0' || str === 'null' || str === 'undefined') return null;

  if (str === '1' || str === 'iniciante' || str === '2' || str === 'basico' || str === 'básico') return 1;
  if (str === '3' || str === 'intermediario' || str === 'intermediário') return 2;
  if (str === '4' || str === 'avancado' || str === 'avançado' || str === '5' || str === 'competitivo' || str === 'elite') return 3;

  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    if (num === 1 || num === 2) return 1;
    if (num === 3) return 2;
    if (num === 4 || num === 5) return 3;
  }

  return null;
}

/**
 * Gets full info object for a given level
 */
export function getTechnicalLevelInfo(value: TechnicalLevel | null | undefined | string | number): TechnicalLevelInfo | null {
  const parsed = parseTechnicalLevel(value);
  if (!parsed) return null;
  return TECHNICAL_LEVELS[parsed] || null;
}

/**
 * Returns a clean, formatted display label for any technical level value
 * e.g., "Nível 2 • Intermediário" or "Ainda não classificado"
 */
export function getTechnicalLevelLabel(value: TechnicalLevel | null | undefined | string | number): string {
  const info = getTechnicalLevelInfo(value);
  if (!info) return 'Ainda não classificado';
  return `Nível ${info.level} • ${info.name}`;
}

/**
 * Returns short label e.g. "2 - Intermediário" or "Não classificado"
 */
export function getTechnicalLevelShortLabel(value: TechnicalLevel | null | undefined | string | number): string {
  const info = getTechnicalLevelInfo(value);
  if (!info) return 'Não classificado';
  return `${info.level} - ${info.name}`;
}
