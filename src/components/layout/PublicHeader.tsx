import React from 'react';

interface PublicHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isAuthenticated: boolean;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  currentPath,
  onNavigate,
  isAuthenticated,
}) => {
  const isLandingActive = currentPath === '/' || currentPath === 'landing' || currentPath === '/landing';
  const isOnboardingActive = currentPath === '/onboarding' || currentPath === 'onboarding';
  const isLoginActive = currentPath === '/login' || currentPath === 'login';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#ffffff]/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e1e8ff]">
      <div className="h-16 max-w-[1200px] mx-auto px-6 flex items-center justify-between gap-6">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onNavigate('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-[#0650cc] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            L
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-[#0650cc] tracking-tight leading-none">LinguaNext</span>
            <span className="text-xs text-[#434654] font-medium hidden sm:inline-block leading-tight mt-0.5">
              Tiến bộ tiếng Anh, từng bước cùng AI
            </span>
          </div>
        </div>

        {/* Public Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onNavigate('/')}
            className={`text-sm transition-colors cursor-pointer ${
              isLandingActive
                ? 'text-[#0650cc] font-semibold underline decoration-2 underline-offset-8'
                : 'text-[#434654] hover:text-[#0f1b34] font-medium'
            }`}
          >
            Trang chủ
          </button>
          <a
            href="/#core-features"
            className="text-sm font-medium text-[#434654] hover:text-[#0f1b34] transition-colors"
          >
            Tính năng
          </a>
          <a
            href="/#learning-path"
            className="text-sm font-medium text-[#434654] hover:text-[#0f1b34] transition-colors"
          >
            Phương pháp học
          </a>
          <a
            href="/#about-team"
            className="text-sm font-medium text-[#434654] hover:text-[#0f1b34] transition-colors"
          >
            Giới thiệu
          </a>
          <button
            onClick={() => onNavigate('/onboarding')}
            className={`text-sm transition-colors cursor-pointer ${
              isOnboardingActive
                ? 'text-[#0650cc] font-bold underline decoration-2 underline-offset-8'
                : 'text-[#434654] hover:text-[#0f1b34] font-medium'
            }`}
          >
            Mục tiêu học
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('/dashboard')}
              className="px-4 py-2 font-semibold text-sm text-white bg-[#0650cc] rounded-xl hover:bg-[#003ea8] shadow-[0_1px_3px_0_rgba(23,35,60,0.04)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Vào học</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('/login')}
                className={`px-4 py-2 font-semibold text-sm rounded-xl transition-all cursor-pointer ${
                  isLoginActive
                    ? 'bg-[#e9edff] text-[#0650cc]'
                    : 'text-[#0f1b34] hover:bg-[#f1f3ff]'
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => onNavigate('/register')}
                className="px-4 py-2 font-semibold text-sm text-white bg-[#0650cc] rounded-xl hover:bg-[#003ea8] shadow-[0_1px_3px_0_rgba(23,35,60,0.04)] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                <span>Bắt đầu học</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onNavigate(isAuthenticated ? '/profile' : '/login')}
            className="w-8 h-8 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0650cc] flex items-center justify-center ring-2 ring-[#e1e8ff] ml-1 cursor-pointer transition-colors"
            title={isAuthenticated ? 'Tài khoản học viên' : 'Đăng nhập'}
          >
            <span className="material-symbols-outlined text-base">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};
