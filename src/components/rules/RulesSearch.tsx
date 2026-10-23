import React from 'react';
import { Search, X } from 'lucide-react';

interface RulesSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

export const RulesSearch: React.FC<RulesSearchProps> = ({
  searchTerm,
  onSearchChange,
  resultCount,
  totalCount,
}) => {
  return (
    <div className="space-y-1">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Ex.: saque, rotação, líbero ou comparecimento"
          aria-label="Pesquisar uma regra"
          className="w-full pl-9 pr-8 py-2.5 text-xs font-medium bg-white text-[#0B192C] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all placeholder:text-slate-400 shadow-xs"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="Limpar pesquisa"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
        {searchTerm ? (
          <span>
            Exibindo <strong>{resultCount}</strong> {resultCount === 1 ? 'resultado' : 'resultados'} para "{searchTerm.trim()}"
          </span>
        ) : (
          <span>{totalCount} regras catalogadas no sistema</span>
        )}

        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="text-[#1E3A8A] font-bold hover:underline cursor-pointer"
          >
            Limpar busca
          </button>
        )}
      </div>
    </div>
  );
};
