import React, { useState } from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { api } from '../services/api';
import { User, LearningProfile } from '../types';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (user: User, profile: LearningProfile | null) => void;
  isAuthenticated: boolean;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigate,
  onLoginSuccess,
  isAuthenticated,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(fullName.trim(), email.trim(), password);
      onLoginSuccess(res.user, null);
      // New user goes straight to onboarding
      onNavigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col font-sans text-[#1b1b1f]">
      <PublicHeader currentPath="/register" onNavigate={onNavigate} isAuthenticated={isAuthenticated} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-[#e1e2ec] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* Left Hero Panel (Visual Branding) */}
          <div className="lg:col-span-5 bg-[#0650cc] p-8 sm:p-10 text-white flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider block mb-3">
                Tài khoản học tập
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 leading-tight">
                Luyện tập tiếng Anh đều đặn mỗi ngày
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed mb-6">
                Xây dựng thói quen học tập với flashcard ngắt quãng, bài luyện nghe chọn lọc và chấm bài viết chi tiết.
              </p>

              {/* Feature Highlights */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">auto_stories</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Ôn từ vựng ngắt quãng (SRS)</h4>
                    <p className="text-xs text-blue-100">Flashcard kèm phiên âm IPA và ví dụ ngữ cảnh</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">headphones</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Luyện nghe & chép chính tả</h4>
                    <p className="text-xs text-blue-100">Audio chuẩn bản ngữ kết hợp bài tập đục lỗ</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Chữa bài viết & Gợi ý từ vựng</h4>
                    <p className="text-xs text-blue-100">Chỉ ra lỗi ngữ pháp và đề xuất cách diễn đạt tự nhiên</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 text-xs text-blue-100">
              Thiết lập mục tiêu và đánh giá trình độ sau khi tạo tài khoản.
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b1b1f] tracking-tight">
                  Tạo tài khoản mới
                </h1>
                <p className="text-sm text-[#44474f] mt-2">
                  Đã có tài khoản?{' '}
                  <button
                    onClick={() => onNavigate('/login')}
                    className="text-[#0650cc] font-semibold hover:underline"
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-600 shrink-0 mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#44474f] uppercase tracking-wider mb-1.5">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#c4c6d0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0650cc] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#44474f] uppercase tracking-wider mb-1.5">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#c4c6d0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0650cc] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#44474f] uppercase tracking-wider mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#c4c6d0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0650cc] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#1b1b1f]"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#44474f] uppercase tracking-wider mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777f] text-lg">
                      lock_reset
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#c4c6d0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0650cc] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#1b1b1f] cursor-pointer"
                      title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-[#0650cc] focus:ring-[#0650cc]"
                    />
                    <span className="text-xs text-[#44474f] leading-normal">
                      Tôi đồng ý với{' '}
                      <span className="text-[#0650cc] font-medium hover:underline">Điều khoản sử dụng</span>{' '}
                      và{' '}
                      <span className="text-[#0650cc] font-medium hover:underline">Chính sách bảo mật</span>{' '}
                      của LinguaNext.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 px-6 rounded-xl bg-[#0650cc] hover:bg-[#003ea8] text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang tạo tài khoản...
                    </>
                  ) : (
                    <>
                      <span>Tạo tài khoản</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-[#f1f5f9] flex items-center justify-center gap-1.5 text-xs text-[#64748b]">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified_user</span>
                Dữ liệu cá nhân và tiến độ học tập được bảo mật an toàn.
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
