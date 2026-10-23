import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { PasswordInput } from '../components/PasswordInput';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Card } from '../components/Card';
import { User, UserPlus, Check, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USERNAME_REGEX } from '../lib/usernameUtils';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGlobalError(null);

    const trimmedUser = username.trim().toLowerCase();

    // Username validation: 3-20 chars, letters, numbers, underscore
    if (!trimmedUser) {
      setUsernameError('Informe o nome de usuário');
      isValid = false;
    } else if (!USERNAME_REGEX.test(trimmedUser)) {
      setUsernameError('Use de 3 a 20 caracteres (apenas letras, números e _)');
      isValid = false;
    }

    // Password validation: 8+ chars
    if (!password) {
      setPasswordError('Informe uma senha');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('A senha precisa ter pelo menos 8 caracteres');
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Confirme a senha');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas digitadas não coincidem');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await register(username, password);
      // Navigate directly to /inicio upon successful registration
      navigate('/inicio', { replace: true });
    } catch (err: any) {
      console.error('[RegisterPage] Registration failed:', err);
      setGlobalError(err.message || 'Não foi possível criar sua conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F172A] flex flex-col justify-between pb-8">
      <Header title="Criar Conta" showBack={true} backTo="/" />

      <main className="max-w-md mx-auto w-full px-4 py-6 my-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#0B192C]">Junte-se à vila</h1>
          <p className="text-xs text-slate-500">
            Crie seu perfil simples de jogador para participar dos jogos
          </p>
        </div>

        <Card accentBar accentColor="blue" className="shadow-lg">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {globalError && (
              <Alert type="danger" title="Erro no Cadastro">
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
              helperText="3 a 20 caracteres (apenas letras, números e _)"
              required
              leftIcon={<User className="w-4 h-4" />}
              disabled={isSubmitting}
            />

            <PasswordInput
              label="Senha"
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
                if (globalError) setGlobalError(null);
              }}
              error={passwordError}
              helperText="Pelo menos 8 caracteres"
              required
              disabled={isSubmitting}
            />

            <PasswordInput
              label="Confirmar senha"
              placeholder="Repita a senha criada"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError('');
                if (globalError) setGlobalError(null);
              }}
              error={confirmPasswordError}
              required
              disabled={isSubmitting}
            />

            {/* Password rules box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <span className="font-bold text-[#0B192C] block">Requisitos de cadastro:</span>
              <ul className="space-y-1">
                <li className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${username.trim().length >= 3 && username.trim().length <= 20 && USERNAME_REGEX.test(username.trim().toLowerCase()) ? 'text-emerald-600' : 'text-slate-400'}`} />
                  Username único (3 a 20 caracteres)
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`} />
                  Senha de no mínimo 8 caracteres
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${password && password === confirmPassword ? 'text-emerald-600' : 'text-slate-400'}`} />
                  Confirmação de senha coincidente
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              icon={<UserPlus className="w-5 h-5" />}
              className="mt-2"
            >
              Criar minha conta
            </Button>
          </form>
        </Card>

        <div className="space-y-4 text-center">
          <p className="text-xs text-slate-600">
            Já possui uma conta?{' '}
            <Link to="/entrar" className="font-bold text-[#1E3A8A] hover:underline">
              Entrar
            </Link>
          </p>
        </div>

        <Alert type="info" className="text-xs">
          <div className="flex items-start gap-1.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-[11px] text-slate-700">
              <strong>Cadastro Direto:</strong> Não solicitamos e-mail nem dados sensíveis. Apenas defina seu nome de jogador e senha.
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
