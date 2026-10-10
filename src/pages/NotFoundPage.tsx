import React from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { PublicFooter } from '../components/layout/PublicFooter';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  isAuthenticated: boolean;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  isAuthenticated,
}) => {
  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col font-sans text-[#1b1b1f]">
      {!isAuthenticated && (
        <PublicHeader currentPath="/404" onNavigate={onNavigate} isAuthenticated={isAuthenticated} />
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-16 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e1e2ec] shadow-sm text-center max-w-lg w-full space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 text-[#0650cc] flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-4xl">explore_off</span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-[#0650cc]">
              Mã lỗi 404 • Không tìm thấy trang
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1b1b1f] tracking-tight pt-2">
              Trang bạn tìm kiếm không tồn tại
            </h1>
            <p className="text-xs sm:text-sm text-[#44474f] leading-relaxed max-w-md mx-auto">
              Đường dẫn này có thể đã được cập nhật hoặc không hợp lệ. Hãy quay lại bảng điều khiển để tiếp tục lộ trình học tập của bạn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onNavigate(isAuthenticated ? '/dashboard' : '/')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0650cc] hover:bg-[#003ea8] text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>{isAuthenticated ? 'Về Bảng điều khiển' : 'Về Trang chủ'}</span>
            </button>
            <button
              onClick={() => onNavigate('/vocabulary')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#c4c6d0] hover:bg-gray-50 text-[#44474f] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">style</span>
              <span>Ôn từ vựng SRS</span>
            </button>
          </div>
        </div>
      </main>

      {!isAuthenticated && <PublicFooter onNavigate={onNavigate} />}
    </div>
  );
};
