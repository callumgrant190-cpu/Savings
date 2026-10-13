import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Nest] Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-900 p-8">
          <div className="max-w-lg rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <h1 className="mb-2 text-xl font-bold text-red-400">Something went wrong</h1>
            <p className="mb-4 text-sm text-slate-300">
              An error occurred while rendering the app. Try refreshing the page.
            </p>
            <pre className="mb-4 overflow-x-auto rounded-lg bg-black/40 p-3 text-left text-xs text-slate-400">
              {this.state.error.message}
            </pre>
            <button
              className="btn-ghost"
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
