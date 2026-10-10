import React, { useState } from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { api } from '../services/api';
import { User, LearningProfile } from '../types';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: (user: User, profile: LearningProfile) => void;
  isAuthenticated?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLoginSuccess, isAuthenticated }) => {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('linguanext_remembered_email') || '';
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('linguanext_remembered_password') || '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem('linguanext_remember_me');
    return saved !== null ? saved === 'true' : true;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.login(email.trim(), password);
      if (rememberMe) {
        localStorage.setItem('linguanext_remember_me', 'true');
        localStorage.setItem('linguanext_remembered_email', email.trim());
        localStorage.setItem('linguanext_remembered_password', password);
      } else {
        localStorage.removeItem('linguanext_remember_me');
        localStorage.removeItem('linguanext_remembered_email');
        localStorage.removeItem('linguanext_remembered_password');
      }
      onLoginSuccess(data.user, data.profile);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const hasRememberedAccount = Boolean(localStorage.getItem('linguanext_remembered_email'));

  const handleClearRemembered = () => {
    setEmail('');
    setPassword('');
    setRememberMe(false);
    localStorage.removeItem('linguanext_remember_me');
    localStorage.removeItem('linguanext_remembered_email');
    localStorage.removeItem('linguanext_remembered_password');
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] text-[#0f1b34] flex flex-col justify-between selection:bg-[#dbe1ff] selection:text-[#00174a]">
      <PublicHeader currentPath="/login" onNavigate={onNavigate} isAuthenticated={false} />

      <main className="w-full flex-1 pt-16 flex flex-col justify-center py-10 lg:py-16">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-white shadow-md border border-[#e1e8ff] overflow-hidden">
            {/* Left Column: Primary Login Flow */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
              <div>
                {/* Header Tag */}
                <div className="mb-2">
                  <span className="text-xs font-semibold text-[#0650cc] uppercase tracking-wider">
                    Đăng nhập tài khoản
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-[#0f1b34] tracking-tight mb-2">
                  Chào mừng bạn quay lại
                </h1>
                <p className="text-xs sm:text-sm text-[#475569] mb-5 max-w-lg">
                  Đăng nhập để tiếp tục lộ trình học tiếng Anh của bạn.
                </p>

                {/* Remembered Account Notice if saved */}
                {hasRememberedAccount && (
                  <div className="mb-6 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#0650cc]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#0650cc]">history</span>
                      <span>Đang điền thông tin tài khoản đã ghi nhớ trên thiết bị này.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearRemembered}
                      className="font-bold underline hover:text-[#003ea8] cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      Xóa ghi nhớ
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3.5 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Email Field */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#0f1b34]" htmlFor="emailInput">
                        Email học tập
                      </label>
                      {isValidEmail && (
                        <span className="text-xs text-[#006c49] font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Định dạng hợp lệ
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center rounded-xl bg-[#faf9ff] border border-[#e1e8ff] hover:border-[#0650cc]/40 transition-colors">
                      <span className="material-symbols-outlined absolute left-3.5 text-lg text-[#737685] pointer-events-none">
                        mail
                      </span>
                      <input
                        id="emailInput"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        className="w-full h-11 pl-11 pr-4 bg-transparent text-sm text-[#0f1b34] placeholder:text-[#737685]/70 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#0f1b34]" htmlFor="passwordInput">
                        Mật khẩu
                      </label>
                      <span className="text-xs text-[#737685]">Tối thiểu 8 ký tự</span>
                    </div>
                    <div className="relative flex items-center rounded-xl bg-[#faf9ff] border border-[#e1e8ff] hover:border-[#0650cc]/40 transition-colors">
                      <span className="material-symbols-outlined absolute left-3.5 text-lg text-[#737685] pointer-events-none">
                        lock
                      </span>
                      <input
                        id="passwordInput"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full h-11 pl-11 pr-11 bg-transparent text-sm text-[#0f1b34] placeholder:text-[#737685]/70 focus:outline-none tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-[#737685] hover:text-[#0f1b34] p-1"
                        aria-label="Hiện mật khẩu"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot Password Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0650cc] accent-[#0650cc] cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[#0f1b34]">
                        Ghi nhớ đăng nhập trên thiết bị này
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('Vui lòng liên hệ quản trị viên hoặc tạo tài khoản mới nếu bạn quên thông tin đăng nhập.')}
                      className="text-xs font-semibold text-[#0650cc] hover:underline self-start sm:self-auto"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-3 w-full h-11 rounded-xl bg-[#0650cc] hover:bg-[#003ea8] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                        <span>Đang xác thực...</span>
                      </>
                    ) : (
                      <>
                        <span>Đăng nhập</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="w-full h-px bg-[#e1e8ff]"></div>
                  <span className="absolute px-3 bg-white text-xs text-[#737685]">
                    Chưa có tài khoản?
                  </span>
                </div>

                {/* Register Link */}
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className="w-full h-11 rounded-xl bg-[#f1f3ff] text-[#0f1b34] hover:bg-[#e9edff] hover:text-[#0650cc] font-medium text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>Tạo tài khoản</span>
                </button>
              </div>

              {/* Footnote */}
              <div className="mt-8 pt-4 flex items-center justify-center gap-1.5 text-xs text-[#737685] border-t border-[#f1f3ff]">
                <span className="material-symbols-outlined text-sm text-[#006c49]">verified_user</span>
                <p>Dữ liệu học tập được đồng bộ và bảo mật an toàn.</p>
              </div>
            </div>

            {/* Right Column: Student Journey & Sync Showcase */}
            <div className="lg:col-span-5 bg-[#f1f3ff] p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden border-t lg:border-t-0 lg:border-l border-[#e1e8ff]">
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#0650cc] text-xl">sync_saved_locally</span>
                    <span className="text-xs text-[#0650cc] uppercase tracking-wider font-bold">Cloud Sync AI</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#434654] text-xs font-semibold">
                    Phiên bản 2.4
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#0f1b34] mb-1">
                    Đồng bộ tiến độ học tập đa nền tảng
                  </h2>
                  <p className="text-xs text-[#434654] leading-relaxed">
                    Tất cả từ vựng, đoạn hội thoại phản xạ và kết quả AI sửa lỗi luôn sẵn sàng trên điện thoại, máy tính bảng và web.
                  </p>
                </div>

                {/* Streak Card */}
                <div className="p-4 rounded-xl bg-white shadow-sm border border-[#e1e8ff] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ffddb8] flex items-center justify-center text-[#7f4f00]">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_fire_department
                      </span>
                    </div>
                    <div>
                      <span className="text-base font-bold text-[#0f1b34] block">Chuỗi 7 ngày</span>
                      <span className="text-xs text-[#7f4f00] font-semibold">Giữ vững phong độ hàng tuần</span>
                    </div>
                  </div>
                  {/* Dots */}
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-6 rounded-full bg-[#006c49]"></span>
                    <span className="w-2.5 h-6 rounded-full bg-[#006c49]"></span>
                    <span className="w-2.5 h-6 rounded-full bg-[#006c49]"></span>
                    <span className="w-2.5 h-6 rounded-full bg-[#006c49]"></span>
                    <span className="w-2.5 h-6 rounded-full bg-[#006c49]"></span>
                    <span className="w-2.5 h-6 rounded-full bg-[#006c49]"></span>
                    <span className="w-2.5 h-7 rounded-full bg-[#0650cc]"></span>
                  </div>
                </div>

                {/* Snapshot Bento */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-white shadow-sm border border-[#e1e8ff] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#434654] mb-2">
                      <span className="text-xs font-medium">Từ vựng đã nhớ</span>
                      <span className="material-symbols-outlined text-[#0650cc] text-base">psychology</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#0f1b34]">342</span>
                      <span className="text-xs text-[#006c49] font-bold">+18 tuần này</span>
                    </div>
                    <div className="w-full bg-[#e1e8ff] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-[#0650cc] h-full rounded-full w-[78%]"></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white shadow-sm border border-[#e1e8ff] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#434654] mb-2">
                      <span className="text-xs font-medium">Độ chuẩn nghe/phát âm</span>
                      <span className="material-symbols-outlined text-[#006c49] text-base">record_voice_over</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#0f1b34]">88%</span>
                      <span className="text-xs text-[#0650cc] font-bold">Chuẩn IPA</span>
                    </div>
                    <div className="w-full bg-[#e1e8ff] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-[#006c49] h-full rounded-full w-[88%]"></div>
                    </div>
                  </div>
                </div>

                {/* Wisdom Quote */}
                <div className="p-4 rounded-xl bg-white shadow-sm border border-[#e1e8ff] flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#0650cc] text-lg mt-0.5">tips_and_updates</span>
                  <p className="text-xs text-[#0f1b34] italic leading-relaxed">
                    “Học 15 phút mỗi ngày với phương pháp ngắt quãng (Spaced Repetition) hiệu quả hơn học dồn 2 tiếng cuối tuần.”
                  </p>
                </div>
              </div>

              {/* Student Spotlight */}
              <div className="mt-6 pt-4 bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-xs border border-[#e1e8ff] flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-[#0650cc] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#dbe1ff]">
                    MT
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#006c49] text-white rounded-full flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0f1b34]">Minh Thảo</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#dbe1ff] text-[#00174a]">
                      B1 → B2
                    </span>
                  </div>
                  <span className="text-xs text-[#434654] truncate">
                    Đạt B2 VSTEP sau 3 tháng luyện phản xạ AI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-white/60 backdrop-blur-md border-t border-[#e1e8ff] py-4">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#737685]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#0650cc]">language</span>
            <span className="font-semibold text-[#0f1b34]">Tiếng Việt</span>
            <span>• © 2026 LinguaNext. Bản quyền thuộc về dự án.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#0f1b34] cursor-pointer">Chính sách bảo mật</span>
            <span className="hover:text-[#0f1b34] cursor-pointer">Điều khoản dịch vụ</span>
            <span className="hover:text-[#0f1b34] cursor-pointer">Trợ giúp</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
