import React from 'react';
import { Card } from '../Card';
import { FIVB_OFFICIAL_SOURCE } from '../../data/rulesData';
import { ExternalLink, ShieldCheck, BookMarked } from 'lucide-react';

export const RulesSource: React.FC = () => {
  return (
    <Card className="bg-slate-50 border-slate-200 text-xs space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <BookMarked className="w-4 h-4 text-[#1E3A8A]" />
        <h3 className="font-black text-[#0B192C]">Fonte e Atualização Oficial</h3>
      </div>

      <div className="space-y-2 text-slate-600 leading-relaxed">
        <p className="font-semibold text-[#0B192C]">
          {FIVB_OFFICIAL_SOURCE.edition}
        </p>

        <p className="text-[11px] text-slate-500">
          {FIVB_OFFICIAL_SOURCE.notice}
        </p>

        <div className="pt-1">
          <a
            href={FIVB_OFFICIAL_SOURCE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:text-[#0B192C] hover:underline bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Acessar Regulamento Oficial na FIVB</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>
    </Card>
  );
};
