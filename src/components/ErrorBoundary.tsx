import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          minHeight: '100dvh', background: 'var(--bg, #0e0a06)', color: 'var(--cream, #f3e9d2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center', gap: 18,
        }}
      >
        <h1 style={{ fontSize: 22, margin: 0, color: 'var(--gold, #e8a020)' }}>Something went wrong</h1>
        <p style={{ fontSize: 14, opacity: 0.8, maxWidth: 320, margin: 0 }}>
          {this.state.error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={this.reset}
          style={{
            padding: '12px 24px', background: 'var(--gold, #e8a020)', color: '#000',
            border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <button
          onClick={() => location.reload()}
          style={{
            padding: '10px 24px', background: 'transparent', color: 'var(--cream, #f3e9d2)',
            border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, fontSize: 14, cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
