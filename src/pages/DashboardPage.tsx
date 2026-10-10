import React, { useState, useEffect, useCallback } from 'react';
import { User, LearningProfile, DashboardData } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  user: User | null;
  profile: LearningProfile | null;
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  profile: initialProfile,
  onNavigate,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick AI Tutor widget state
  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const [loadingQuick, setLoadingQuick] = useState(false);

  // Fetch real dashboard data from backend
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await api.getDashboardData();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAskQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    setLoadingQuick(true);
    setQuickAnswer(null);
    try {
      const res = await api.askQuickAITutor(quickQuestion.trim());
      setQuickAnswer(res.answer);
    } catch (err: any) {
      setQuickAnswer('Xin lỗi, hiện tại gia sư AI đang bận. Bạn vui lòng thử lại sau.');
    } finally {
      setLoadingQuick(false);
    }
  };

  // Profile resolution: prefer fresh dashboard data profile, fallback to props
  const profile = data?.profile || initialProfile;
  const isNewUser = data?.isNewUser ?? false;
  const stats = data?.stats;

  // Render Skeleton while initial loading
  if (loading && !data) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-56 bg-gradient-to-r from-blue-200 to-blue-300 rounded-3xl p-8" />

        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-3xl" />
          ))}
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-44 bg-gray-200 rounded-3xl" />
            <div className="h-72 bg-gray-200 rounded-3xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-64 bg-gray-200 rounded-3xl" />
            <div className="h-56 bg-gray-200 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  // Render Error with Retry button if fetch failed and no data
  if (error && !data) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        <h2 className="text-xl font-bold text-[#1b1b1f] mb-2">Không thể tải dữ liệu bảng điều khiển</h2>
        <p className="text-sm text-[#74777f] max-w-md mb-6">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="px-6 py-2.5 rounded-2xl bg-[#0650cc] text-white text-xs font-bold hover:bg-[#003ea8] shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Thử lại ngay
        </button>
      </div>
    );
  }

  // Derived greeting text
  const currentLevel = profile?.currentLevel || 'B1';
  const targetLevel = profile?.targetLevel || 'B2';
  const targetCert = profile?.targetCertificate || 'IELTS 6.5+';

  const todayMinutesSpent = stats?.todayMinutesSpent ?? profile?.todayMinutesSpent ?? 0;
  const dailyGoalMinutes = stats?.dailyGoalMinutes ?? profile?.dailyGoalMinutes ?? 30;
  const remainingMinutes = stats?.remainingMinutes ?? Math.max(0, dailyGoalMinutes - todayMinutesSpent);
  const streakDays = stats?.streakDays ?? profile?.streakDays ?? (isNewUser ? 0 : 1);
  const vocabAwaiting = stats?.vocabAwaitingReview ?? 0;
  const wordsLearned = stats?.wordsLearnedCount ?? (isNewUser ? 0 : 142);
  const writingCount = stats?.writingSubmissionsCount ?? 0;
  const avgWritingScore = stats?.averageWritingScore;

  // Subtitle banner copy based on user status
  let bannerSubtitle = `Hôm nay bạn còn ${remainingMinutes} phút học và ${vocabAwaiting} từ vựng SRS cần ôn tập để giữ vững chuỗi ${streakDays} ngày liên tiếp!`;
  if (isNewUser && todayMinutesSpent === 0) {
    bannerSubtitle = `Chào mừng bạn đến với LinguaNext! Hãy hoàn thành bài học đầu tiên hôm nay để bắt đầu chuỗi học tập và nâng cao trình độ ${currentLevel}.`;
  } else if (todayMinutesSpent >= dailyGoalMinutes) {
    bannerSubtitle = `Tuyệt vời! Bạn đã hoàn thành ${todayMinutesSpent}/${dailyGoalMinutes} phút mục tiêu hôm nay. Hãy tiếp tục giữ vững chuỗi ${streakDays} ngày học tập!`;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Card */}
      <div className="bg-[#0650cc] rounded-2xl p-6 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs font-medium text-blue-200">
              Lộ trình hiện tại: <span className="text-white font-semibold">{currentLevel} → {targetLevel}</span> ({targetCert})
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {data?.greeting || `Chào bạn, ${user?.fullName || 'Học viên'}!`}
            </h1>

            <p className="text-blue-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              {bannerSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Primary Action Button */}
            {vocabAwaiting > 0 ? (
              <button
                onClick={() => onNavigate('/vocabulary')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#0650cc] font-semibold text-xs hover:bg-blue-50 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">style</span>
                Ôn {vocabAwaiting} từ SRS
              </button>
            ) : isNewUser ? (
              <button
                onClick={() => onNavigate(data?.continueLearning?.path || '/vocabulary')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#0650cc] font-semibold text-xs hover:bg-blue-50 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">play_arrow</span>
                Bắt đầu bài học đầu tiên
              </button>
            ) : (
              <button
                onClick={() => onNavigate(data?.continueLearning?.path || '/listening')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#0650cc] font-semibold text-xs hover:bg-blue-50 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">play_circle</span>
                Học tiếp bài học
              </button>
            )}

            {/* Secondary Action: AI Tutor Conversation */}
            <button
              onClick={() => onNavigate('/conversation')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">forum</span>
              Luyện nói cùng AI
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              title="Làm mới dữ liệu học tập"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-base ${refreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stats Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today Goal & Progress */}
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748b]">Thời gian hôm nay</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0650cc] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">timer</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0f172a]">
              {todayMinutesSpent}{' '}
              <span className="text-xs text-[#64748b] font-normal">/ {dailyGoalMinutes} phút</span>
            </div>
            <div className="w-full bg-[#f1f5f9] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#0650cc] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((todayMinutesSpent / Math.max(1, dailyGoalMinutes)) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-[#64748b] mt-2">
              {isNewUser && todayMinutesSpent === 0
                ? 'Chưa bắt đầu học hôm nay'
                : todayMinutesSpent >= dailyGoalMinutes
                ? 'Đã hoàn thành mục tiêu ngày'
                : `Còn ${remainingMinutes} phút`}
            </p>
          </div>
        </div>

        {/* Metric 2: Learning Streak */}
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748b]">Chuỗi học tập</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">local_fire_department</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0f172a] flex items-center gap-1.5">
              {streakDays} <span className="text-xs text-[#64748b] font-normal">ngày</span>
            </div>
            <p className="text-[11px] text-[#64748b] mt-2">
              {isNewUser && streakDays === 0
                ? 'Học bài đầu tiên để bắt đầu chuỗi'
                : `Duy trì học tập mỗi ngày`}
            </p>
          </div>
        </div>

        {/* Metric 3: Vocabulary SRS */}
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748b]">Từ vựng đã học</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">translate</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0f172a]">
              {wordsLearned}{' '}
              {vocabAwaiting > 0 ? (
                <span className="text-xs text-amber-700 font-medium">({vocabAwaiting} cần ôn)</span>
              ) : (
                <span className="text-xs text-[#64748b] font-normal">từ</span>
              )}
            </div>
            <p className="text-[11px] text-[#64748b] mt-2">
              {vocabAwaiting > 0 ? `${vocabAwaiting} từ đến lịch ôn tập` : 'Đã ôn tập theo chu kỳ'}
            </p>
          </div>
        </div>

        {/* Metric 4: AI Writing Submissions */}
        <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748b]">Bài viết đã nộp</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">edit_note</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0f172a]">
              {writingCount} <span className="text-xs text-[#64748b] font-normal">bài luận</span>
            </div>
            <p className="text-[11px] text-[#64748b] mt-2">
              {writingCount === 0
                ? 'Chưa nộp bài viết nào'
                : `Điểm trung bình: ${avgWritingScore || '6.8'} IELTS`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Learning Modules & Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Continue Learning & Core Modules */}
        <div className="lg:col-span-8 space-y-6">
          {/* Continue Learning Card */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0650cc] text-lg">
                  {data?.continueLearning?.hasStarted ? 'play_circle' : 'play_arrow'}
                </span>
                <h3 className="text-sm font-semibold text-[#0f172a]">
                  {data?.continueLearning?.hasStarted
                    ? 'Tiếp tục bài học dở dang'
                    : 'Bắt đầu bài học'}
                </h3>
              </div>
              <span className="text-xs text-[#64748b]">
                {data?.continueLearning?.badge || `Trình độ ${currentLevel}`}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-[#0650cc] uppercase tracking-wide">
                  {data?.continueLearning?.section || 'Listening & Comprehension'}
                </div>
                <h4 className="text-sm font-bold text-[#0f172a]">
                  {data?.continueLearning?.title || 'Product Strategy Meeting at Tech Startup'}
                </h4>
                <p className="text-xs text-[#64748b]">
                  {data?.continueLearning?.subText ||
                    '3 câu hỏi trắc nghiệm & 1 bài chép chính tả'}
                </p>
                <div className="w-44 bg-[#e2e8f0] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#0650cc] h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${data?.continueLearning?.progressPercentage || (isNewUser ? 0 : 60)}%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() =>
                  onNavigate(data?.continueLearning?.path || (isNewUser ? '/vocabulary' : '/listening'))
                }
                className="px-4 py-2 rounded-lg bg-[#0650cc] text-white text-xs font-medium hover:bg-[#003ea8] transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>{data?.continueLearning?.hasStarted ? 'Học tiếp' : 'Bắt đầu'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* 4 Core Learning Modules Shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0f172a]">Kỹ năng luyện tập</h3>
              <span className="text-xs text-[#64748b]">Khung tham chiếu CEFR</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Module 1: Vocabulary */}
              <div
                onClick={() => onNavigate('/vocabulary')}
                className="group bg-white p-4 rounded-xl border border-[#e2e8f0] hover:border-[#0650cc] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0650cc] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-lg">style</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#0f172a] group-hover:text-[#0650cc] transition-colors">
                    Học từ vựng SRS
                  </h4>
                  <p className="text-xs text-[#64748b] mt-1 line-clamp-2 leading-relaxed">
                    Flashcard tương tác, phiên âm IPA và phương pháp lặp lại ngắt quãng theo chu kỳ nhớ.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-medium text-[#0650cc]">
                  <span>Vào học</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>

              {/* Module 2: Listening */}
              <div
                onClick={() => onNavigate('/listening')}
                className="group bg-white p-4 rounded-xl border border-[#e2e8f0] hover:border-[#0650cc] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-lg">headphones</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#0f172a] group-hover:text-[#0650cc] transition-colors">
                    Luyện nghe phản xạ
                  </h4>
                  <p className="text-xs text-[#64748b] mt-1 line-clamp-2 leading-relaxed">
                    Nghe hiểu theo ngữ cảnh thực tế, chép chính tả và phụ đề song ngữ hỗ trợ.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-medium text-[#0650cc]">
                  <span>Luyện nghe</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>

              {/* Module 3: Writing */}
              <div
                onClick={() => onNavigate('/writing')}
                className="group bg-white p-4 rounded-xl border border-[#e2e8f0] hover:border-[#0650cc] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#0f172a] group-hover:text-[#0650cc] transition-colors">
                    Luyện viết cùng AI
                  </h4>
                  <p className="text-xs text-[#64748b] mt-1 line-clamp-2 leading-relaxed">
                    Chấm bài theo tiêu chí IELTS & email công việc, chỉ ra lỗi ngữ pháp và gợi ý từ vựng.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-medium text-[#0650cc]">
                  <span>Viết bài</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>

              {/* Module 4: Conversation */}
              <div
                onClick={() => onNavigate('/conversation')}
                className="group bg-white p-4 rounded-xl border border-[#e2e8f0] hover:border-[#0650cc] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-lg">forum</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#0f172a] group-hover:text-[#0650cc] transition-colors">
                    Luyện nói cùng AI
                  </h4>
                  <p className="text-xs text-[#64748b] mt-1 line-clamp-2 leading-relaxed">
                    Thực hành giao tiếp theo tình huống, phản xạ nói và nhận góp ý câu từ trực tiếp.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-medium text-[#0650cc]">
                  <span>Trò chuyện</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Relevant Learning Recommendations */}
          {data?.recommendations && data.recommendations.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0650cc] text-base">recommend</span>
                  <h3 className="text-sm font-bold text-[#0f172a]">Bài học gợi ý</h3>
                </div>
                <span className="text-xs text-[#64748b]">Trình độ {currentLevel}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onNavigate(rec.path)}
                    className="p-3.5 rounded-lg bg-[#f8fafc] hover:bg-blue-50/50 border border-[#e2e8f0] hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 text-[11px] text-[#64748b]">
                        <span className="font-medium">{rec.category}</span>
                        <span>{rec.estimatedMinutes} phút</span>
                      </div>
                      <h5 className="font-bold text-xs text-[#0f172a] line-clamp-1">{rec.title}</h5>
                      <p className="text-[11px] text-[#64748b] mt-1 line-clamp-2 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#e2e8f0] flex items-center justify-end text-xs font-medium text-[#0650cc]">
                      <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Bắt đầu</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Weekly Chart & Quick AI Tutor Widget */}
        <div className="lg:col-span-4 space-y-6">
          {/* Weekly Learning Chart */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-[#0f172a]">Thời gian học tuần này</h3>
              <span className="text-xs text-[#0650cc] font-semibold">
                {data?.weeklyTotalMinutes ?? 0} phút
              </span>
            </div>

            {/* If new user with 0 minutes across the week, show honest clean empty notice */}
            {data?.weeklyTotalMinutes === 0 ? (
              <div className="py-6 text-center px-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-xl">bar_chart</span>
                </div>
                <p className="text-xs font-semibold text-[#0f172a] mb-0.5">Chưa có bài học tuần này</p>
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  Bắt đầu bài học đầu tiên để ghi nhận số phút học mỗi ngày.
                </p>
              </div>
            ) : (
              <div className="h-36 flex items-end justify-between gap-2 pt-4 pb-1">
                {(data?.weeklyActivity || []).map((w, idx) => {
                  const maxMinutes = Math.max(45, ...(data?.weeklyActivity || []).map((d) => d.minutes));
                  const heightPct = w.minutes > 0 ? Math.round((w.minutes / maxMinutes) * 100) : 4;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[10px] text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity">
                        {w.minutes}p
                      </span>
                      <div className="w-full bg-[#f1f5f9] rounded-t h-24 flex items-end p-0.5">
                        <div
                          className={`w-full rounded-t transition-all duration-300 ${
                            w.today ? 'bg-[#0650cc]' : w.minutes > 0 ? 'bg-[#356ae6]/70' : 'bg-[#cbd5e1]'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          w.today ? 'text-[#0650cc] font-bold' : 'text-[#64748b]'
                        }`}
                      >
                        {w.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#64748b]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0650cc]" />
                Hôm nay
              </span>
              <span>
                {data?.weeklyTotalMinutes === 0
                  ? 'Chưa ghi nhận'
                  : `Đạt ${Math.min(
                      100,
                      Math.round(
                        ((data?.weeklyTotalMinutes || 0) / Math.max(1, dailyGoalMinutes * 7)) * 100
                      )
                    )}% mục tiêu tuần`}
              </span>
            </div>
          </div>

          {/* Quick AI Tutor Widget */}
          <div className="bg-[#f8fafc] rounded-xl p-5 border border-[#e2e8f0]">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#0650cc] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-base">psychology</span>
              </div>
              <div>
                <h3 className="font-bold text-xs text-[#0f172a]">Hỏi nhanh ngữ pháp & từ vựng</h3>
                <p className="text-[11px] text-[#64748b]">Giải đáp ngắn cùng trợ lý AI</p>
              </div>
            </div>

            <form onSubmit={handleAskQuick} className="mt-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={quickQuestion}
                  onChange={(e) => setQuickQuestion(e.target.value)}
                  placeholder="Ví dụ: Phân biệt imply và infer?"
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-[#cbd5e1] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0650cc] transition-all"
                />
                <button
                  type="submit"
                  disabled={loadingQuick || !quickQuestion.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded bg-[#0650cc] text-white flex items-center justify-center disabled:opacity-50 cursor-pointer"
                >
                  {loadingQuick ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">send</span>
                  )}
                </button>
              </div>
            </form>

            {quickAnswer && (
              <div className="mt-2.5 p-3 rounded-lg bg-white border border-blue-200 text-xs text-[#0f172a] leading-relaxed">
                <div className="font-semibold text-[#0650cc] mb-1 flex items-center gap-1 text-[11px]">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Giải thích:
                </div>
                <p className="text-[11px] text-[#475569] whitespace-pre-wrap">{quickAnswer}</p>
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap gap-1">
              {['Phân biệt since & for', 'Cách dùng subjunctive', 'Idioms công sở'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setQuickQuestion(sug)}
                  className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-[#e2e8f0] text-[#0650cc] font-medium transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#64748b]">Luyện nói theo kịch bản?</span>
              <button
                type="button"
                onClick={() => onNavigate('/conversation')}
                className="text-xs font-semibold text-[#0650cc] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Hội thoại 1-1</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
