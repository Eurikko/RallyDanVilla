import React, { Component, ErrorInfo, ReactNode } from 'react';
import { VolleyballLogo } from './VolleyballLogo';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B192C] text-white flex flex-col items-center justify-center p-6 text-center">
          <VolleyballLogo size="lg" className="mb-6" />
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 max-w-sm w-full space-y-4">
            <h1 className="text-xl font-bold text-white">Algo deu errado na partida!</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Encontramos um erro inesperado na interface. Não se preocupe, seus dados estão seguros.
            </p>
            <Button variant="primary" fullWidth onClick={this.handleReload}>
              Recarregar Aplicativo
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
