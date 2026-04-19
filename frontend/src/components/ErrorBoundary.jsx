import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 inline-flex rounded-full bg-red-50 p-4">
              <AlertTriangle className="h-12 w-12 text-[var(--danger)]" />
            </div>
            
            <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
              Something went wrong
            </h1>
            
            <p className="mb-6 text-[var(--text-secondary)]">
              We're sorry for the inconvenience. The error has been logged and we'll look into it.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
                <summary className="cursor-pointer text-sm font-bold text-[var(--text-primary)]">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-[var(--danger)]">
                  {this.state.error.toString()}
                  {"\n\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button onClick={this.handleReset} className="btn-primary">
              <Home className="h-4 w-4" />
              Go to Homepage
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;