import React, { useState, useEffect } from 'react';
import { User, LearningProfile, UserSettings } from '../types';
import { api } from '../services/api';
import { UserAvatar } from '../components/common/UserAvatar';

interface SettingsPageProps {
  user: User | null;
  profile: LearningProfile | null;
  onProfileUpdated: (profile: LearningProfile) => void;
  onUserUpdated?: (user: User) => void;
  activeTab?: 'profile' | 'settings';
  onTabChange?: (tab: 'profile' | 'settings') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  profile,
  onProfileUpdated,
  onUserUpdated,
  activeTab = 'settings',
  onTabChange,
}) => {
  const [currentTab, setCurrentTab] = useState<'profile' | 'settings'>(activeTab);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(profile?.dailyGoalMinutes || 30);
  const [targetCertificate, setTargetCertificate] = useState(profile?.targetCertificate || 'IELTS 7.0');
  const [targetLevel, setTargetLevel] = useState(profile?.targetLevel || 'B2');
  const [currentLevel, setCurrentLevel] = useState(profile?.currentLevel || 'B1');

  useEffect(() => {
    if (user?.avatar !== undefined) {
      setAvatar(user.avatar || '');
    }
  }, [user?.avatar]);

  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    dailyReminderTime: '20:00',
    audioAccent: 'US',
    speechRate: 1.0,
    soundEffects: true,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    isConnected: boolean;
    readyState: number;
    databaseName: string | null;
    hasConfiguredUri: boolean;
    error: string | null;
    localCacheCounts?: {
      users: number;
      vocabularies: number;
      vocabProgress: number;
      listeningExercises: number;
      writingSubmissions: number;
      activities: number;
    };
  } | null>(null);
  const [loadingDbStatus, setLoadingDbStatus] = useState(false);

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    loadSettings();
    loadDbStatus();
  }, []);

  const loadDbStatus = async () => {
    setLoadingDbStatus(true);
    try {
      const res = await api.getDatabaseStatus();
      setDbStatus(res);
    } catch (e) {
      console.warn('Failed to fetch db status', e);
    } finally {
      setLoadingDbStatus(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTabClick = (tab: 'profile' | 'settings') => {
    setCurrentTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      // 1. Update Profile
      const updatedProfile = await api.updateProfile({
        dailyGoalMinutes,
        targetCertificate,
        targetLevel,
        currentLevel,
      });
      onProfileUpdated(updatedProfile);

      // 2. Update User Account (fullName, avatar)
      if (fullName !== user?.fullName || avatar !== user?.avatar) {
        const updatedUser = await api.updateUser({
          fullName: fullName.trim() || user?.fullName,
          avatar: avatar.trim(),
        });
        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }
      }

      // 3. Update Settings
      await api.saveSettings(settings);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#e1e2ec] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0650cc] text-xs font-bold mb-2">
            <span className="material-symbols-outlined text-sm">
              {currentTab === 'profile' ? 'account_circle' : 'manage_accounts'}
            </span>
            {currentTab === 'profile' ? 'Quản lý Hồ sơ học viên' : 'Cài đặt Tài khoản & Hệ thống'}
          </div>
          <h1 className="text-2xl font-black text-[#1b1b1f]">
            {currentTab === 'profile' ? 'Hồ Sơ Cá Nhân & Mục Tiêu Học' : 'Cài Đặt Ứng Dụng & Giọng Đọc'}
          </h1>
          <p className="text-xs text-[#44474f] mt-1">
            Điều chỉnh mục tiêu trình độ CEFR, cấu hình giọng đọc bản ngữ AI và thông báo nhắc nhở hàng ngày
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="flex items-center gap-1 bg-[#f1f3ff] p-1.5 rounded-2xl self-start sm:self-auto border border-[#e1e8ff]">
          <button
            type="button"
            onClick={() => handleTabClick('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'profile'
                ? 'bg-white text-[#0650cc] shadow-sm'
                : 'text-[#44474f] hover:text-[#1b1b1f]'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            Hồ sơ & Mục tiêu
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-white text-[#0650cc] shadow-sm'
                : 'text-[#44474f] hover:text-[#1b1b1f]'
            }`}
          >
            <span className="material-symbols-outlined text-base">settings</span>
            Giọng đọc & Thông báo
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          Đã lưu tất cả thay đổi thành công!
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Profile & Learning Objectives */}
        <div className="lg:col-span-7 space-y-6">
          {/* User Account Info */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2ec] shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#1b1b1f] flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#0650cc]">badge</span>
              Thông tin người học
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-2">
              <UserAvatar
                name={fullName || user?.fullName || 'Học viên'}
                avatarUrl={avatar}
                size="xl"
                className="rounded-2xl ring-2 ring-[#0650cc]"
              />
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-bold text-sm text-[#1b1b1f]">{fullName || user?.fullName || 'Học viên'}</h4>
                  <p className="text-xs text-[#74777f]">{user?.email || 'learner@linguanext.edu.vn'}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#c4c6d0] bg-white hover:bg-[#f1f3ff] text-xs font-semibold text-[#0650cc] cursor-pointer transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    <span>Tải ảnh lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          setAvatarUploadError('Kích thước ảnh tối đa là 2MB.');
                          return;
                        }
                        setAvatarUploadError(null);
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setAvatar(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {avatar && avatar.trim() !== '' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatar('');
                        setAvatarUploadError(null);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>Dùng chữ viết tắt</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#74777f]">
                  Mặc định hiển thị chữ cái viết tắt của tên bạn. Chỉ hiển thị ảnh khi bạn chủ động tải lên.
                </p>
                {avatarUploadError && (
                  <p className="text-[11px] text-red-600 font-medium">{avatarUploadError}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1.5">
                  Họ và tên hiển thị
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c4c6d0] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0650cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1.5">
                  Địa chỉ Email (Đăng nhập)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'user@example.com'}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Learning Objectives Configuration */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2ec] shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#1b1b1f] flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#0650cc]">flag</span>
              Mục tiêu & Lộ trình CEFR
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1.5">
                  Trình độ hiện tại (CEFR)
                </label>
                <select
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c4c6d0] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0650cc]"
                >
                  <option value="A1">A1 - Beginner (Mất gốc)</option>
                  <option value="A2">A2 - Elementary (Sơ cấp)</option>
                  <option value="B1">B1 - Intermediate (Trung cấp)</option>
                  <option value="B2">B2 - Upper-Intermediate (Trung cao)</option>
                  <option value="C1">C1 - Advanced (Nâng cao)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1.5">
                  Trình độ mục tiêu
                </label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c4c6d0] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0650cc]"
                >
                  <option value="B1">B1 - Giao tiếp độc lập</option>
                  <option value="B2">B2 - Làm việc quốc tế</option>
                  <option value="C1">C1 - Học thuật & Chuyên sâu</option>
                  <option value="C2">C2 - Thành thạo bản xứ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1.5">
                  Chứng chỉ hướng tới
                </label>
                <select
                  value={targetCertificate}
                  onChange={(e) => setTargetCertificate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c4c6d0] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0650cc]"
                >
                  <option value="IELTS 6.5">IELTS 6.5</option>
                  <option value="IELTS 7.0">IELTS 7.0</option>
                  <option value="IELTS 7.5+">IELTS 7.5+</option>
                  <option value="TOEIC 750">TOEIC 750</option>
                  <option value="TOEIC 850+">TOEIC 850+</option>
                  <option value="Business English B2">Tiếng Anh thương mại B2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1.5">
                  Thời lượng học mỗi ngày
                </label>
                <select
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c4c6d0] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0650cc]"
                >
                  <option value={15}>15 phút/ngày (Nhẹ nhàng)</option>
                  <option value={30}>30 phút/ngày (Tiêu chuẩn vàng)</option>
                  <option value={45}>45 phút/ngày (Tăng tốc)</option>
                  <option value={60}>60 phút/ngày (Chuyên sâu)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right (5 cols): AI Audio & Notification Preferences */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Voice & Audio Settings */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2ec] shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#1b1b1f] flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#0650cc]">record_voice_over</span>
              Giọng đọc & Phát âm AI
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1.5">
                Chất giọng tiếng Anh (Accent)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['US', 'UK', 'AU'].map((acc) => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => setSettings({ ...settings, audioAccent: acc as any })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      settings.audioAccent === acc
                        ? 'border-[#0650cc] bg-blue-50 text-[#0650cc]'
                        : 'border-[#c4c6d0] text-[#44474f] hover:bg-gray-50'
                    }`}
                  >
                    {acc === 'US' ? 'Mỹ (US)' : acc === 'UK' ? 'Anh (UK)' : 'Úc (AU)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1.5">
                Tốc độ phát âm: {settings.speechRate}x
              </label>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.25"
                value={settings.speechRate}
                onChange={(e) =>
                  setSettings({ ...settings, speechRate: parseFloat(e.target.value) })
                }
                className="w-full accent-[#0650cc]"
              />
              <div className="flex justify-between text-[10px] text-[#74777f] font-mono mt-1">
                <span>0.75x (Chậm)</span>
                <span>1.0x (Tự nhiên)</span>
                <span>1.25x</span>
                <span>1.5x</span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2ec] shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#1b1b1f] flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#0650cc]">notifications_active</span>
              Thông báo nhắc học & Âm thanh
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-[#1b1b1f]">Email nhắc học mỗi ngày</div>
                  <div className="text-[11px] text-[#74777f]">Nhắc ôn từ vựng SRS theo chu kỳ não bộ</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, emailNotifications: e.target.checked })
                  }
                  className="rounded text-[#0650cc] focus:ring-[#0650cc] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-[#1b1b1f]">Hiệu ứng âm thanh chúc mừng</div>
                  <div className="text-[11px] text-[#74777f]">Phát chuông chúc mừng khi trả lời đúng</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) =>
                    setSettings({ ...settings, soundEffects: e.target.checked })
                  }
                  className="rounded text-[#0650cc] focus:ring-[#0650cc] w-4 h-4 cursor-pointer"
                />
              </label>

              <div className="pt-2">
                <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-1.5">
                  Khung giờ nhắc học yêu thích
                </label>
                <input
                  type="time"
                  value={settings.dailyReminderTime}
                  onChange={(e) =>
                    setSettings({ ...settings, dailyReminderTime: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#c4c6d0] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0650cc]"
                />
              </div>
            </div>
          </div>

          {/* MongoDB Connection Status Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2ec] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1b1b1f] flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#006c49]">database</span>
                Cơ sở dữ liệu MongoDB
              </h3>
              <button
                type="button"
                onClick={loadDbStatus}
                disabled={loadingDbStatus}
                className="text-[11px] font-bold text-[#0650cc] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-xs ${loadingDbStatus ? 'animate-spin' : ''}`}>
                  sync
                </span>
                {loadingDbStatus ? 'Đang kiểm tra...' : 'Làm mới'}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b] font-medium">Trạng thái kết nối</span>
                {dbStatus?.isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đã kết nối MongoDB Atlas
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Đang dùng bộ nhớ cục bộ
                  </span>
                )}
              </div>

              {dbStatus?.isConnected && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748b]">Tên Database:</span>
                    <span className="font-mono font-bold text-[#0f172a]">{dbStatus.databaseName || 'linguanext'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748b]">Hạ tầng lưu trữ:</span>
                    <span className="font-semibold text-emerald-800">MongoDB Atlas Cloud</span>
                  </div>
                </>
              )}

              {dbStatus?.localCacheCounts && (
                <div className="pt-2 border-t border-[#e2e8f0]">
                  <div className="text-[11px] font-bold text-[#64748b] mb-1.5 flex items-center justify-between">
                    <span>Dữ liệu lưu trữ trong Database:</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Tự động đồng bộ</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 rounded-lg bg-white border border-[#e2e8f0]">
                      <div className="font-bold text-[#0f172a]">{dbStatus.localCacheCounts.users}</div>
                      <div className="text-[#64748b]">Tài khoản</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-[#e2e8f0]">
                      <div className="font-bold text-[#0f172a]">{dbStatus.localCacheCounts.vocabularies}</div>
                      <div className="text-[#64748b]">Từ vựng</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-[#e2e8f0]">
                      <div className="font-bold text-[#0f172a]">{dbStatus.localCacheCounts.listeningExercises}</div>
                      <div className="text-[#64748b]">Bài nghe</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-[#e2e8f0]">
                      <div className="font-bold text-[#0f172a]">{dbStatus.localCacheCounts.writingSubmissions}</div>
                      <div className="text-[#64748b]">Bài viết AI</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-[#e2e8f0]">
                      <div className="font-bold text-[#0f172a]">{dbStatus.localCacheCounts.activities}</div>
                      <div className="text-[#64748b]">Hoạt động</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-[#e2e8f0]">
                      <div className="font-bold text-[#0f172a]">{dbStatus.localCacheCounts.vocabProgress}</div>
                      <div className="text-[#64748b]">Tiến độ SRS</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0650cc] hover:bg-[#003ea8] text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang lưu cài đặt...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                Lưu tất cả thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
