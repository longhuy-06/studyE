import React, { useState } from 'react';
import { User, LearningProfile } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface ShellProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: User | null;
  profile: LearningProfile | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentPath,
  onNavigate,
  user,
  profile,
  onLogout,
  children,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      path: '/dashboard',
      label: 'Tổng quan',
      icon: 'dashboard',
      aliases: ['/dashboard', '/overview', 'overview', 'dashboard'],
    },
    {
      path: '/vocabulary',
      label: 'Từ vựng',
      icon: 'menu_book',
      aliases: ['/vocabulary', 'vocabulary'],
    },
    {
      path: '/listening',
      label: 'Luyện nghe',
      icon: 'headphones',
      aliases: ['/listening', 'listening'],
    },
    {
      path: '/writing',
      label: 'Luyện viết',
      icon: 'edit_note',
      aliases: ['/writing', 'writing'],
    },
    {
      path: '/conversation',
      label: 'Hội thoại AI',
      icon: 'forum',
      aliases: ['/conversation', 'conversation', '/chat', 'chat'],
    },
    {
      path: '/progress',
      label: 'Tiến độ',
      icon: 'insights',
      aliases: ['/progress', 'progress'],
    },
    {
      path: '/profile',
      label: 'Hồ sơ',
      icon: 'person',
      aliases: ['/profile', 'profile'],
    },
    {
      path: '/settings',
      label: 'Cài đặt',
      icon: 'settings',
      aliases: ['/settings', 'settings'],
    },
  ];

  const todayMinutes = profile?.todayMinutesSpent ?? profile?.todayMinutesStudied ?? 18;
  const targetMinutes = profile?.dailyCommitmentMinutes ?? profile?.dailyGoalMinutes ?? 30;
  const progressPercent = Math.min(100, Math.round((todayMinutes / Math.max(1, targetMinutes)) * 100));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('nghe') || q.includes('listen')) onNavigate('/listening');
    else if (q.includes('viết') || q.includes('writ')) onNavigate('/writing');
    else if (q.includes('chat') || q.includes('nói') || q.includes('hội thoại') || q.includes('alex')) onNavigate('/conversation');
    else if (q.includes('tiến độ') || q.includes('báo cáo') || q.includes('radar')) onNavigate('/progress');
    else if (q.includes('hồ sơ') || q.includes('profile')) onNavigate('/profile');
    else if (q.includes('cài đặt') || q.includes('setting')) onNavigate('/settings');
    else onNavigate('/vocabulary');
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] text-[#0f1b34] antialiased">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#ffffff]/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 px-4 flex items-center justify-between border-b border-[#e1e8ff]">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#434654] hover:text-[#0f1b34] rounded-lg cursor-pointer"
          aria-label="Menu"
        >
          <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            onNavigate('/dashboard');
            setMobileMenuOpen(false);
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#0650cc] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            L
          </div>
          <span className="font-bold text-[#0650cc] text-lg tracking-tight">LinguaNext</span>
        </div>

        <button
          onClick={() => {
            onNavigate('/profile');
            setMobileMenuOpen(false);
          }}
          className="cursor-pointer"
          title="Hồ sơ cá nhân"
        >
          <UserAvatar name={user?.fullName || 'Người dùng'} avatarUrl={user?.avatar} size="sm" />
        </button>
      </div>

      {/* Sidebar Desktop & Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-[260px] bg-[#ffffff] z-50 flex flex-col justify-between py-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-[#e1e8ff] transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Branding */}
          <div
            className="px-4 pb-4 mb-2 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              onNavigate('/dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-[#0650cc] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              L
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-[#0650cc] tracking-tight leading-tight">LinguaNext</span>
              <span className="text-xs text-[#737685] font-medium leading-tight">Luyện tiếng Anh cùng AI</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = item.path === currentPath || item.aliases?.includes(currentPath);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 h-10 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#e9edff] text-[#0650cc] font-semibold'
                      : 'text-[#434654] hover:bg-[#f1f3ff] hover:text-[#0f1b34]'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Daily Goal Mini Card inside Sidebar */}
        <div className="px-4 space-y-3">
          <div className="bg-[#f8fafc] p-3.5 rounded-xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#475569]">Mục tiêu hôm nay</span>
              <span className="text-xs text-[#0650cc] font-semibold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0650cc] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#64748b]">
              Đã học {todayMinutes}/{targetMinutes} phút hôm nay
            </p>
          </div>

          <button
            onClick={() => {
              onNavigate('/');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#737685] hover:text-[#0650cc] hover:bg-[#f1f3ff] rounded-xl transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">home</span>
            <span>Về Trang chủ</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-[260px] pt-16 lg:pt-0">
        {/* Desktop Fixed Header */}
        <header className="hidden lg:flex fixed top-0 left-[260px] right-0 h-16 bg-[#ffffff]/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-6 items-center justify-between gap-6 border-b border-[#e1e8ff]">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#737685] text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học, từ vựng..."
                className="w-full h-9 pl-9 pr-4 bg-[#f8fafc] rounded-lg text-[#0f1b34] placeholder:text-[#94a3b8] text-xs focus:outline-none focus:bg-[#ffffff] focus:ring-1 focus:ring-[#0650cc] transition-all border border-[#e2e8f0]"
              />
            </div>
          </form>

          {/* Quick Metrics & User Action */}
          <div className="flex items-center gap-3">
            {/* Streak Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-800 bg-amber-50 rounded-lg border border-amber-200/60 font-medium">
              <span
                className="material-symbols-outlined text-amber-600 text-base leading-none"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <span>Chuỗi {profile?.streakDays || 7} ngày</span>
            </div>

            {/* Time Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 bg-slate-100 rounded-lg font-medium">
              <span className="material-symbols-outlined text-[#0650cc] text-base leading-none">timer</span>
              <span>
                {todayMinutes}/{targetMinutes} phút
              </span>
            </div>

            {/* Notification button */}
            <button
              onClick={() => onNavigate('/progress')}
              className="relative p-2 rounded-xl text-[#434654] hover:bg-[#f1f3ff] hover:text-[#0f1b34] transition-all cursor-pointer"
              title="Thông báo học tập"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-[#ffffff]" />
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 py-1 rounded-xl hover:bg-[#f1f3ff] transition-colors cursor-pointer"
              >
                <UserAvatar name={user?.fullName || 'Người dùng'} avatarUrl={user?.avatar} size="sm" />
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#0f1b34] leading-tight">
                    {user?.fullName || 'Học viên'}
                  </span>
                  <span className="text-[11px] text-[#0650cc] font-bold leading-tight">
                    {profile?.levelLabel || 'B1 Intermediate'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-sm text-[#737685]">expand_more</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#e1e8ff] py-1.5 z-50 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-[#f1f3ff]">
                    <p className="text-xs font-bold text-[#0f1b34]">{user?.fullName || 'Học viên'}</p>
                    <p className="text-[11px] text-[#737685] truncate">{user?.email || 'learner@linguanext.edu.vn'}</p>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#434654] hover:bg-[#f1f3ff] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-[#0650cc]">person</span>
                    Hồ sơ cá nhân & Mục tiêu
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#434654] hover:bg-[#f1f3ff] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-[#0650cc]">settings</span>
                    Cài đặt giọng đọc & Thông báo
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#434654] hover:bg-[#f1f3ff] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">home</span>
                    Về Trang chủ
                  </button>
                  <div className="border-t border-[#f1f3ff] my-1" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="lg:pt-16 min-h-screen bg-[#faf9ff] px-4 sm:px-6 py-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
