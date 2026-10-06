import { Component, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { clearDraftFromStorage } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('DT Map Configuration Studio error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    clearDraftFromStorage();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                DT Map Studio Encountered a State Error
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An invalid state or draft memory error prevented map rendering. You can reset your draft state below to restore the Jaipur Office default configuration.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-red-300 text-left overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex flex-col space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 border border-brand-400/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Draft & Restore Jaipur Configuration</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
