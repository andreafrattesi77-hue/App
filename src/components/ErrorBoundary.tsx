import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Applet ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#E5B869] flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            {this.props.fallbackTitle || 'Si è verificato un problema di visualizzazione'}
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mb-4">
            Non preoccuparti, i tuoi dati e il tuo account sono al sicuro. Puoi riaprire il capitolo o tornare alla schermata principale.
          </p>
          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl gold-gradient-btn text-xs font-bold text-[#121622] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Riprova</span>
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                if (this.props.onReset) {
                  this.props.onReset();
                } else {
                  window.location.reload();
                }
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Torna indietro</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
