import React from "react";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  showDetails: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, showDetails: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const { error, showDetails } = this.state;
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0a0a24",
          padding: "24px",
        }}>
          <div style={{ textAlign: "center", color: "#ccc", maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 20, marginBottom: 8, color: "#E8731A" }}>
              {this.props.fallbackTitle || "Algo deu errado"}
            </h1>
            <p style={{ fontSize: 14, marginBottom: 24, color: "#999" }}>
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#E8731A",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 32px",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                Recarregar
              </button>
              {this.props.onReset && (
                <button
                  onClick={this.handleReset}
                  style={{
                    background: "transparent",
                    color: "#E8731A",
                    border: "1px solid #E8731A",
                    borderRadius: 8,
                    padding: "12px 32px",
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Tentar novamente
                </button>
              )}
            </div>
            <button
              onClick={() => this.setState({ showDetails: !showDetails })}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                fontSize: 12,
                marginTop: 20,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {showDetails ? "Ocultar detalhes" : "Ver detalhes do erro"}
            </button>
            {showDetails && error && (
              <div style={{
                marginTop: 12,
                padding: 12,
                background: "#111",
                borderRadius: 8,
                textAlign: "left",
                fontSize: 11,
                color: "#f88",
                maxHeight: 200,
                overflow: "auto",
                wordBreak: "break-word",
              }}>
                <strong>{error.message}</strong>
                {error.stack && (
                  <pre style={{ marginTop: 8, fontSize: 10, color: "#888", whiteSpace: "pre-wrap" }}>
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
