import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, KeyRound, ShieldCheck, X } from 'lucide-react';
import { ADMIN_SECRET_CODE } from '../types/news';
import { UrSkyLogo } from './UrSkyLogo';

interface LoginGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminVerified: (code: string) => void;
}

export const LoginGateModal: React.FC<LoginGateModalProps> = ({
  isOpen,
  onClose,
  onAdminVerified,
}) => {
  const [secretCode, setSecretCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCodeError(false);
      setSecretCode('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = secretCode.trim();
    if (trimmed === ADMIN_SECRET_CODE) {
      setCodeError(false);
      onAdminVerified(trimmed);
    } else {
      setCodeError(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24100a]/75 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secret-code-dialog-title"
      onClick={onClose}
    >
      <div
        className="glass-surface w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق نافذة الكود السري"
          className="absolute top-5 left-5 w-9 h-9 rounded-xl bg-[#683424]/40 hover:bg-[#683424]/75 border border-[#f6f3db]/14 flex items-center justify-center text-[#f6f3db]/80 hover:text-[#f6f3db] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <UrSkyLogo size="md" className="mb-4" />
          <h2
            id="secret-code-dialog-title"
            className="font-heading text-xl sm:text-2xl font-extrabold text-[#f6f3db]"
          >
            ادخل الكود السري
          </h2>
          <p className="text-sm text-[#f6f3db]/75 mt-1.5 leading-relaxed">
            أدخل كود الإدارة للوصول إلى لوحة النشر والتحرير
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="secret-code-input"
              className="block font-heading text-sm font-bold text-[#f6f3db] mb-2"
            >
              الكود السري للإدارة
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="secret-code-input"
                type="password"
                value={secretCode}
                onChange={(e) => {
                  setSecretCode(e.target.value);
                  if (codeError) setCodeError(false);
                }}
                placeholder="أدخل الكود السري..."
                dir="ltr"
                autoComplete="off"
                className="w-full py-3 pr-4 pl-10 rounded-xl bg-[#24100a]/70 border border-[#f6f3db]/20 text-[#f6f3db] placeholder:text-[#f6f3db]/40 text-sm focus:outline-none focus:border-[#f6f3db]/60"
              />
              <KeyRound className="w-4 h-4 text-[#f6f3db]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {codeError && (
              <p
                id="code-error-msg"
                role="alert"
                className="mt-2.5 flex items-center gap-2 text-sm font-heading font-bold text-red-400"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>الكود غلط!</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-5 rounded-xl bg-[#f6f3db] text-[#683424] font-heading font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 hover:bg-[#f6f3db]/90 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>دخول إلى صفحة الإدارة</span>
          </button>
        </form>
      </div>
    </div>
  );
};
