import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { QuickRulesSummary } from '../components/rules/QuickRulesSummary';
import { RuleCategoryFilter } from '../components/rules/RuleCategoryFilter';
import { RulesSearch } from '../components/rules/RulesSearch';
import { RuleAccordionItem } from '../components/rules/RuleAccordionItem';
import { CommunityRulesSection } from '../components/rules/CommunityRulesSection';
import { RulesSource } from '../components/rules/RulesSource';
import { RULES_DATA, RuleCategory, RULE_CATEGORIES, FIVB_OFFICIAL_SOURCE } from '../data/rulesData';
import { BookOpen, Home, Shield, AlertCircle } from 'lucide-react';

/**
 * Normalizes text by converting to lowercase and stripping accents for flexible search.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const RulesPage: React.FC = () => {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RuleCategory | 'todas'>('todas');

  // Expanded Accordions State (Set allows multiple or single expanded items)
  const [expandedRuleIds, setExpandedRuleIds] = useState<Set<string>>(
    new Set(['fund_01', 'rnv_01']) // Expand first official and first community rule by default
  );

  // Toggle Accordion Item
  const handleToggleRule = (ruleId: string) => {
    setExpandedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  // Category counts calculation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todas: RULES_DATA.length };
    
    RULE_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'todas') {
        counts[cat.id] = RULES_DATA.filter((r) => r.category === cat.id).length;
      }
    });

    return counts;
  }, []);

  // Filtered Rules Logic
  const filteredRules = useMemo(() => {
    const normSearch = normalizeText(searchTerm.trim());

    return RULES_DATA.filter((rule) => {
      // 1. Category filter
      if (selectedCategory !== 'todas' && rule.category !== selectedCategory) {
        return false;
      }

      // 2. Search query filter
      if (!normSearch) {
        return true;
      }

      const normTitle = normalizeText(rule.title);
      const normSummary = normalizeText(rule.summary);
      const normCategory = normalizeText(rule.category);
      const normDetails = normalizeText(rule.details.join(' '));
      const normKeywords = normalizeText(rule.keywords.join(' '));

      return (
        normTitle.includes(normSearch) ||
        normSummary.includes(normSearch) ||
        normCategory.includes(normSearch) ||
        normDetails.includes(normSearch) ||
        normKeywords.includes(normSearch)
      );
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
      {/* Header */}
      <Header
        title="Livro de regras"
        rightAction={
          <button
            onClick={() => navigate('/inicio')}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Página Inicial"
            aria-label="Voltar para o início"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Início</span>
          </button>
        }
      />

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Title & Official FIVB Edition Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-black text-[#0B192C]">Livro de Regras</h1>
            <span className="text-[9px] font-extrabold bg-[#1E3A8A] text-white px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Shield className="w-3 h-3 text-amber-300" />
              FIVB 2025–2028
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Consulte fundamentos, pontuação, posições, faltas e orientações para os jogos da comunidade.
          </p>
        </div>

        {/* Local Search Component */}
        <RulesSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          resultCount={filteredRules.length}
          totalCount={RULES_DATA.length}
        />

        {/* Quick Summary Section ("O essencial para começar") */}
        <QuickRulesSummary />

        {/* Category Pills Filter */}
        <RuleCategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
        />

        {/* Rules Accordion Items List */}
        <div className="space-y-3 pt-1">
          {filteredRules.length > 0 ? (
            filteredRules.map((rule) => (
              <RuleAccordionItem
                key={rule.id}
                rule={rule}
                isExpanded={expandedRuleIds.has(rule.id)}
                onToggle={() => handleToggleRule(rule.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5 shadow-sm">
              <div className="p-3 bg-slate-100 text-slate-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0B192C]">Nenhuma regra encontrada</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tente pesquisar por outro termo ou selecione a categoria "Todas as regras".
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('todas');
                }}
                className="text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer pt-1 inline-block"
              >
                Limpar filtros de busca
              </button>
            </div>
          )}
        </div>

        {/* Community Specific Rules Section ("Como funcionam os jogos no RallyNaVila") */}
        <CommunityRulesSection />

        {/* Source Citation & Official Reference ("Fonte e atualização") */}
        <RulesSource />
      </main>
    </div>
  );
};
