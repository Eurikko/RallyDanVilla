import React from 'react';
import { RULE_CATEGORIES, RuleCategory } from '../../data/rulesData';
import { 
  BookOpen, 
  Volleyball, 
  LayoutGrid, 
  Trophy, 
  RotateCw, 
  Hand, 
  ShieldAlert, 
  UserCheck, 
  Target, 
  AlertTriangle, 
  Users, 
  HelpCircle 
} from 'lucide-react';

interface RuleCategoryFilterProps {
  selectedCategory: RuleCategory | 'todas';
  onSelectCategory: (category: RuleCategory | 'todas') => void;
  categoryCounts: Record<string, number>;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  BookOpen,
  Volleyball,
  LayoutGrid,
  Trophy,
  RotateCw,
  Hand,
  ShieldAlert,
  UserCheck,
  Target,
  AlertTriangle,
  Users,
  HelpCircle,
};

export const RuleCategoryFilter: React.FC<RuleCategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
          Categorias de Regras
        </label>
        <span className="text-[10px] text-slate-400 font-medium">
          {RULE_CATEGORIES.length - 1} temas disponíveis
        </span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth -mx-1 px-1">
        {RULE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] ?? 0;
          const IconComponent = ICON_MAP[cat.iconName] || BookOpen;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] ${
                isSelected
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm scale-102'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-200'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
