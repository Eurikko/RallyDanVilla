import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VolleyballLogo } from '../components/VolleyballLogo';
import { Button } from '../components/Button';
import { ArrowRight, ShieldCheck, Users, Trophy, CalendarDays, Sparkles, ChevronDown } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B192C] via-[#0F223D] to-[#0B192C] text-white flex flex-col justify-between p-4 sm:p-6 overflow-x-hidden">
      {/* Header Badge */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <VolleyballLogo size="sm" showText={true} className="[&_span]:text-white" />
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
          Comunidade Ativa
        </span>
      </div>

      {/* Hero Content */}
      <main className="max-w-md mx-auto w-full my-auto py-8 flex flex-col items-center text-center space-y-6">
        {/* Emblem Illustration */}
        <div className="relative my-2">
          <VolleyballLogo size="xl" showText={false} />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Rally<span className="text-[#E63946]">NaVila</span>
          </h1>
          <p className="text-sm sm:text-base font-bold text-slate-300 tracking-wide">
            Organize a turma. Monte os times. Jogue.
          </p>
        </div>

        {/* Short App Explanation */}
        <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
          O aplicativo de gerenciamento de partidas de vôlei da nossa vila.
          Cadastre seu nome de jogador, garanta sua presença nos jogos, acompanhe o placar ao vivo e consulte o regulamento.
        </p>

        {/* Main Action Buttons */}
        <div className="w-full space-y-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/entrar')}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Entrar
          </Button>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => navigate('/cadastro')}
            className="border-white/30 text-white hover:bg-white/10"
          >
            Criar conta de jogador
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={scrollToFeatures}
            icon={<ChevronDown className="w-4 h-4" />}
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            Conhecer os recursos
          </Button>
        </div>

        {/* Feature Showcase Section */}
        <div ref={featuresRef} className="w-full pt-8 space-y-3 text-left">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 text-center">
            Recursos da Plataforma
          </h2>

          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center flex flex-col items-center space-y-1">
              <Users className="w-5 h-5 text-[#2563EB]" />
              <span className="text-[11px] font-bold text-white">Lista de Presença</span>
              <span className="text-[9px] text-slate-400">Vagas e confirmação</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center flex flex-col items-center space-y-1">
              <Trophy className="w-5 h-5 text-[#E63946]" />
              <span className="text-[11px] font-bold text-white">Sorteio Nivelado</span>
              <span className="text-[9px] text-slate-400">Times equilibrados</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center flex flex-col items-center space-y-1">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
              <span className="text-[11px] font-bold text-white">Placar Vivo</span>
              <span className="text-[9px] text-slate-400">Pontuação dos sets</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="max-w-md mx-auto w-full text-center py-4 border-t border-white/10 space-y-1">
        <p className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#E63946]" />
          RallyNaVila &copy; 2026 — Plataforma de Vôlei Comunitário
        </p>
      </footer>
    </div>
  );
};
