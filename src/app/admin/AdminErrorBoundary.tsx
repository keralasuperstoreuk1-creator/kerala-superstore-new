"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("[AdminErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-8 md:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#0b2416] mb-2">
            Something tripped.
          </h2>
          <p className="text-stone-600 mb-6">
            This admin panel hit an unexpected error. Your data is safe — only the view crashed.
          </p>
          <pre className="text-left bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs font-mono text-stone-700 overflow-x-auto mb-6 max-h-40">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-[#0b2416] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-900 transition"
            >
              <RefreshCw className="w-4 h-4" /> Reload page
            </button>
            <a
              href="/admin"
              className="inline-flex items-center gap-2 bg-stone-100 text-stone-800 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-200 transition"
            >
              <Home className="w-4 h-4" /> Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
}
