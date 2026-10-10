import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeStorage } from '../../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    safeStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf9ff] text-[#0f1b34] flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#e1e8ff] p-6 text-center space-y-5">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#0f1b34]">Đã xảy ra lỗi tải trang</h1>
              <p className="text-sm text-[#5a5d6c] leading-relaxed">
                Ứng dụng gặp sự cố khi xử lý dữ liệu. Bạn có thể tải lại trang hoặc khôi phục về màn hình chính.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-mono overflow-x-auto max-h-36">
                <p className="font-semibold text-red-600 mb-1">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-500 whitespace-pre-wrap">{this.state.error.stack.slice(0, 300)}...</pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#0650cc] hover:bg-[#003ea8] text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Tải lại trang</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-[#0f1b34] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
              >
                <span className="material-symbols-outlined text-base">home</span>
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
