import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Game } from '../types';
import { getUpcomingGames, formatGameDateTime } from '../lib/gameService';
import { Trophy, Sparkles, Calendar, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ScoreboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await getUpcomingGames();
        setGames(list);
      } catch (err) {
        console.error('Error loading games for scoreboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] pb-24">
      <Header title="Placar das Partidas" />

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#0B192C]">Placar ao Vivo</h1>
            <p className="text-xs text-slate-500">Selecione uma partida para acompanhar a pontuação</p>
          </div>
          <Badge variant="info" size="md">
            Ao Vivo
          </Badge>
        </div>

        {/* Games List */}
        {loading ? (
          <div className="p-8 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin text-[#0B192C] mx-auto" />
            <p className="text-xs text-slate-500">Buscando partidas disponíveis...</p>
          </div>
        ) : games.length === 0 ? (
          <Card className="p-6 text-center text-xs text-slate-500 space-y-3">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Nenhum jogo agendado no momento.</p>
            <Button variant="outline" onClick={() => navigate('/jogos')} icon={<ArrowLeft className="w-4 h-4" />}>
              Ver Lista de Jogos
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {games.map((g) => {
              const dt = formatGameDateTime(g.scheduledAt);
              return (
                <Card key={g.id} accentBar accentColor="navy" className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-[#0B192C]">{g.title}</h3>
                      <p className="text-xs text-slate-500">{g.location} • {dt.fullStr}</p>
                    </div>
                    <Badge variant="success" size="sm">
                      {g.confirmedCount} confirmados
                    </Badge>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {(profile?.role === 'owner' || profile?.role === 'admin') && (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => navigate(`/admin/jogos/${g.id}/partida`)}
                        className="bg-[#0B192C] text-xs py-2"
                        icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      >
                        Preparar Partida
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => navigate(`/partidas/match_${g.id}`)}
                      className="text-xs py-2"
                      icon={<Trophy className="w-3.5 h-3.5 text-amber-500" />}
                    >
                      Abrir Placar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
