import React, { useState } from 'react';
import { Card } from '../Card';
import { QUICK_SUMMARY_ITEMS } from '../../data/rulesData';
import { Zap, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export const QuickRulesSummary: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card accentBar accentColor="red" className="bg-gradient-to-br from-white to-red-50/30 border-red-200/80 shadow-sm">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="quick-rules-summary-content"
          className="w-full flex items-center justify-between text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] rounded-lg p-0.5"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#E63946]/10 text-[#E63946] rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-[#0B192C] uppercase tracking-wider">
                O essencial para começar
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                6 pontos fundamentais para jogar na comunidade
              </p>
            </div>
          </div>

          <div className="text-slate-400 p-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isOpen && (
          <div id="quick-rules-summary-content" className="space-y-2.5 pt-1 border-t border-slate-200/60 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {QUICK_SUMMARY_ITEMS.map((item, idx) => (
                <div key={idx} className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="text-[11px] font-bold text-[#0B192C] block leading-snug">
                      {item.title}
                    </strong>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[10px] text-amber-900 leading-relaxed font-medium">
              💡 <strong>Regra Oficial vs. Formato Comunitário:</strong> O regulamento oficial da FIVB serve de base educativa. Partidas recreativas do RallyNaVila podem adotar adaptações de pontuação ou número de atletas conforme o número de confirmados no dia.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
