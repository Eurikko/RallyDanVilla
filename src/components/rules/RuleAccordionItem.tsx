import React from 'react';
import { RuleEntry, RULE_CATEGORIES } from '../../data/rulesData';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { ChevronDown, ChevronUp, ExternalLink, ShieldCheck, Users } from 'lucide-react';

interface RuleAccordionItemProps {
  rule: RuleEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

export const RuleAccordionItem: React.FC<RuleAccordionItemProps> = ({
  rule,
  isExpanded,
  onToggle,
}) => {
  const categoryLabel = RULE_CATEGORIES.find((c) => c.id === rule.category)?.label || rule.category;
  const contentId = `rule-content-${rule.id}`;

  return (
    <Card
      accentBar
      accentColor={rule.isCommunityRule ? 'navy' : 'blue'}
      className={`transition-all bg-white ${
        isExpanded ? 'border-[#1E3A8A] shadow-md ring-1 ring-[#1E3A8A]/30' : 'hover:border-slate-300'
      }`}
    >
      <div className="space-y-2">
        {/* Accordion Toggle Header */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className="w-full text-left flex items-start justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] rounded-lg p-0.5"
        >
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {rule.isCommunityRule ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-black bg-blue-100 text-[#1E3A8A] border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Users className="w-3 h-3" />
                  RallyNaVila
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  Regra Oficial FIVB
                </span>
              )}

              <Badge variant="role" size="sm">
                {categoryLabel}
              </Badge>
            </div>

            <h3 className="text-sm font-black text-[#0B192C] leading-snug break-words pr-2">
              {rule.title}
            </h3>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {rule.summary}
            </p>
          </div>

          <div
            className={`p-1.5 rounded-lg text-slate-400 transition-colors shrink-0 ${
              isExpanded ? 'bg-blue-50 text-[#1E3A8A]' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded Detailed Content */}
        {isExpanded && (
          <div
            id={contentId}
            className="pt-3 mt-2 border-t border-slate-100 space-y-3 animate-fadeIn text-xs text-slate-700"
          >
            <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
              {rule.details.map((paragraph, index) => (
                <p key={index} className="leading-relaxed font-normal text-slate-700">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Official Reference citation if present */}
            {rule.officialReference && (
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-dashed border-slate-200">
                <span className="font-semibold italic text-slate-600">
                  Referência: {rule.officialReference}
                </span>
                <span className="text-blue-700 font-bold">FIVB 2025–2028</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
