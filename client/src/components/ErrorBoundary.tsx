import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 w-full">
          <div className="bg-white rounded-3xl border border-red-200 shadow-xl p-8 max-w-lg w-full text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-gray-900">
                {this.props.fallbackTitle || "Ops! Ocorreu um erro ao carregar esta área"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {this.props.fallbackMessage ||
                  "Os dados continuam salvos com segurança. Clique no botão abaixo para tentar novamente."}
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left">
                  <span className="text-[11px] font-mono text-slate-600 break-words block">
                    {this.state.error.message}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2 flex gap-3 justify-center">
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                variant="outline"
                className="rounded-xl font-bold"
              >
                Tentar Novamente
              </Button>
              <Button
                onClick={this.handleReset}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
              >
                <RefreshCcw className="h-4 w-4" />
                Recarregar Página
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
