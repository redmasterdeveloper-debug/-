import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'حدث خطأ غير متوقع في التطبيق.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('UR SKY ErrorBoundary caught error:', error, info);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      let friendlyMessage = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage) as { error?: string };
        if (parsed && parsed.error) {
          if (parsed.error.includes('Quota exceeded')) {
            friendlyMessage =
              'تم تجاوز حصة القراءة أو الكتابة اليومية المجانية في قاعدة البيانات. سيتم إعادة تعيين الحصة غداً.';
          } else {
            friendlyMessage = `تعذر إتمام العملية في قاعدة البيانات: ${parsed.error}`;
          }
        }
      } catch {
        // Keep original message if not JSON
      }

      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#24100a] text-[#f6f3db] flex items-center justify-center p-6"
        >
          <div className="glass-surface max-w-lg w-full rounded-2xl p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-[#683424]/60 border border-[#f6f3db]/20 flex items-center justify-center text-[#f6f3db]">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="font-heading text-2xl font-bold mb-3">
              تنبيه تقني في شبكة سماء أور
            </h1>
            <p className="text-sm text-[#f6f3db]/80 leading-relaxed mb-6 break-words">
              {friendlyMessage}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#f6f3db] text-[#683424] font-heading font-bold text-sm hover:bg-[#f6f3db]/90 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
