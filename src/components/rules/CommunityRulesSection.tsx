import React from 'react';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { CheckCircle2, Clock, Users, Calendar, AlertCircle } from 'lucide-react';

export const CommunityRulesSection: React.FC = () => {
  return (
    <Card accentBar accentColor="navy" className="bg-gradient-to-br from-slate-900 to-[#0B192C] text-white shadow-md space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white">Como funcionam os jogos no RallyNaVila</h2>
          <p className="text-[11px] text-slate-300">Regras operacionais e rotinas do sistema comunitário</p>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {/* Highlight Callout Box */}
        <div className="p-3 bg-[#1E3A8A]/60 rounded-xl border border-blue-400/30 text-blue-100 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Regra Fundamental de Participação</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-200">
            Confirmar presença ou entrar na escalação não contabiliza automaticamente uma participação. Somente o comparecimento real registrado após a partida aumenta o total do jogador.
          </p>
        </div>

        {/* Step-by-Step System Flow */}
        <div className="space-y-2.5">
          {/* Confirmação */}
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                1. Confirmação de Presença
              </span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                Intenção de Jogo
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Representa o desejo do atleta em participar da partida. Reserva uma vaga principal respeitando o limite máximo definido no jogo.
            </p>
          </div>

          {/* Cancelamento & Lista de Espera */}
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                2. Cancelamento e Lista de Espera
              </span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                Fila Automática
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Desistências devem respeitar o prazo do jogo. Ao cancelar, a vaga é liberada automaticamente para o primeiro participante da lista de espera.
            </p>
          </div>

          {/* Escalação de Times */}
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                3. Escalação dos Times
              </span>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                Sorteio Nivelado
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Indica a formação dos times sorteados pelos organizadores para a partida. A escalação garante seu nome nos confrontos, mas ainda exige presença no local.
            </p>
          </div>

          {/* Comparecimento Real */}
          <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                4. Comparecimento Real Finalizado
              </span>
              <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                +1 no Perfil
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Após o fim do jogo, a organização confirma a lista presencial real. Somente quem compareceu ganha +1 no contador de participações do perfil. Convidados registrados não possuem perfil acumulativo.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
