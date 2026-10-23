import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VolleyballLogo } from '../components/VolleyballLogo';
import { Button } from '../components/Button';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B192C] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-6">
        <VolleyballLogo size="lg" className="justify-center" />

        <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-black bg-[#E63946] text-white uppercase tracking-widest">
            Erro 404 — Bola Fora!
          </div>

          <h1 className="text-2xl font-black text-white">Página não encontrada</h1>

          <p className="text-xs text-slate-300 leading-relaxed">
            A rota digitada não existe ou foi movida. Volte para a página inicial ou acesse a área de demonstração.
          </p>

          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate('/inicio')}
              icon={<Home className="w-4 h-4" />}
            >
              Ir para o Início (Modo Demo)
            </Button>

            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/')}
              icon={<ArrowLeft className="w-4 h-4" />}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Voltar à Apresentação
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          RallyNaVila — Sistema de Vôlei Comunitário
        </p>
      </div>
    </div>
  );
};
