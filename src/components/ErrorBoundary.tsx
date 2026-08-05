import React, { ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('THIKANA App Error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = window.location.pathname;
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-3xl border border-emerald-500/30">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-black text-white">
              THIKANA Quick Reload
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Something went wrong while filtering homestays or rendering details. We caught it safely! Click below to reset filters and continue browsing.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-xl transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset & Refresh App</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
