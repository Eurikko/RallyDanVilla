import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { PasswordInput } from '../components/PasswordInput';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Card } from '../components/Card';
import { User, LogIn, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const REMEMBER_USERNAME_KEY = 'rallynavila_remembered_username';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(false);

  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load remembered username if present on mount
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_USERNAME_KEY);
    if (saved) {
      setUsername(saved);
      setRememberUser(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;
    setUsernameError('');
    setPasswordError('');
    setGlobalError(null);

    const trimmedUser = username.trim();

    if (!trimmedUser) {
      setUsernameError('Informe o nome de usuário');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Informe a senha');
      isValid = false;
    }

    if (!isValid) return;

    setIsSubmitting(true);

    try {
      await login(trimmedUser, password);

      // Handle "Lembrar meu usuário" (strictly stores username string, NEVER password)
      if (rememberUser) {
        localStorage.setItem(REMEMBER_USERNAME_KEY, trimmedUser);
      } else {
        localStorage.removeItem(REMEMBER_USERNAME_KEY);
      }

      // Navigate to destination route or /inicio
      const destination = location.state?.from?.pathname || '/inicio';
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error('[LoginPage] Login error:', err);
      setGlobalError(err.message || 'Nome de usuário ou senha incorretos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] flex flex-col justify-between pb-8">
      <Header title="Entrar no RallyNaVila" showBack={true} backTo="/" />

      <main className="max-w-md mx-auto w-full px-4 py-6 my-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#0B192C]">Acesse sua conta</h1>
          <p className="text-xs text-slate-500">
            Digite seu nome de usuário e senha para entrar na vila
          </p>
        </div>

        <Card accentBar accentColor="red" className="shadow-lg">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {globalError && (
              <Alert type="danger" title="Acesso Negado">
                {globalError}
              </Alert>
            )}

            <Input
              label="Nome de usuário"
              placeholder="ex: volei_marcos"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) setUsernameError('');
                if (globalError) setGlobalError(null);
              }}
              error={usernameError}
              required
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="username"
              disabled={isSubmitting}
            />

            <PasswordInput
              label="Senha"
              placeholder="Sua senha de acesso"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
                if (globalError) setGlobalError(null);
              }}
              error={passwordError}
              required
              autoComplete="current-password"
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberUser}
                  onChange={(e) => setRememberUser(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A] cursor-pointer"
                />
                Lembrar meu usuário
              </label>

              <span className="text-slate-400 text-[11px]" title="Armazena somente o nome de usuário localmente">
                (salva apenas username)
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              icon={<LogIn className="w-5 h-5" />}
              className="mt-2"
            >
              Entrar
            </Button>
          </form>
        </Card>

        {/* Quick Demo Access */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block text-center">
            Acesso Rápido de Teste
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('euriko');
                setPassword('rallynavila');
                setUsernameError('');
                setPasswordError('');
                setGlobalError(null);
              }}
              className="px-3 py-2 text-xs font-bold bg-white hover:bg-slate-100 text-[#0B192C] border border-slate-200 rounded-xl shadow-2xs transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <span>Euriko</span>
              <span className="text-[9px] text-[#E63946] font-extrabold uppercase">Proprietário</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('jogadordemo');
                setPassword('rallynavila');
                setUsernameError('');
                setPasswordError('');
                setGlobalError(null);
              }}
              className="px-3 py-2 text-xs font-bold bg-white hover:bg-slate-100 text-[#0B192C] border border-slate-200 rounded-xl shadow-2xs transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <span>Jogador Demo</span>
              <span className="text-[9px] text-blue-600 font-extrabold uppercase">Jogador</span>
            </button>
          </div>
        </div>

        {/* Quick Links & Info */}
        <div className="space-y-4 text-center">
          <p className="text-xs text-slate-600">
            Ainda não possui uma conta?{' '}
            <Link to="/cadastro" className="font-bold text-[#1E3A8A] hover:underline">
              Criar conta
            </Link>
          </p>
        </div>

        <Alert type="info" className="text-xs">
          <div className="flex items-start gap-1.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-[11px] text-slate-700">
              <strong>Nota sobre Recuperação:</strong> Por utilizar login simplificado por username sem e-mail público, a recuperação automática de senha não está disponível.
            </p>
          </div>
        </Alert>
      </main>

      <footer className="text-center text-[11px] text-slate-400 max-w-md mx-auto px-4">
        RallyNaVila &copy; 2026 — Organização de Vôlei Comunitário
      </footer>
    </div>
  );
};
