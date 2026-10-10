import React, { useState, useEffect } from 'react';
import { ProgressReport, User, LearningProfile } from '../types';
import { api } from '../services/api';

interface ProgressPageProps {
  user: User | null;
  profile: LearningProfile | null;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ user, profile }) => {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await api.getProgress();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const skillBars = [
    { name: 'Listening (Nghe hiểu)', score: 78, level: 'B2', color: 'bg-amber-500' },
    { name: 'Vocabulary (Vốn từ SRS)', score: 85, level: 'B2+', color: 'bg-blue-600' },
    { name: 'Writing (Viết luận AI)', score: 72, level: 'B2', color: 'bg-purple-600' },
    { name: 'Speaking (Phản xạ đàm thoại)', score: 65, level: 'B1+', color: 'bg-emerald-600' },
    { name: 'Grammar (Độ chuẩn ngữ pháp)', score: 80, level: 'B2', color: 'bg-indigo-600' },
  ];

  const milestones = [
    { title: 'A1 - Khởi đầu cơ bản', date: 'Tháng 1/2026', completed: true },
    { title: 'A2 - Giao tiếp tình huống hàng ngày', date: 'Tháng 2/2026', completed: true },
    { title: 'B1 - Độc lập diễn đạt suy nghĩ', date: 'Tháng 3/2026', completed: true },
    { title: 'B2 - Tự tin làm việc & đàm phán', date: 'Mục tiêu: Tháng 5/2026', current: true },
    { title: 'IELTS 7.0 - Du học & Nộp hồ sơ', date: 'Dự kiến: Tháng 7/2026', completed: false },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">Tiến độ học tập</h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Tổng hợp thời gian học, mức độ ghi nhớ từ vựng và kết quả các kỹ năng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-[#0650cc]">
            Mục tiêu: {profile?.targetCertificate || 'IELTS 7.0'} ({profile?.targetLevel || 'B2'})
          </span>
        </div>
      </div>

      {/* 4 Key Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2e8f0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748b]">Thời gian học</span>
            <span className="material-symbols-outlined text-[#0650cc] text-lg">schedule</span>
          </div>
          <div className="text-2xl font-bold text-[#0f172a]">
            {report?.totalHoursStudied || 14.5} <span className="text-xs font-normal text-[#64748b]">giờ</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1.5">Tăng 2.5 giờ so với tuần trước</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2e8f0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748b]">Chuỗi học tập</span>
            <span className="material-symbols-outlined text-amber-500 text-lg">local_fire_department</span>
          </div>
          <div className="text-2xl font-bold text-[#0f172a]">
            {report?.streakDays || 7} <span className="text-xs font-normal text-[#64748b]">ngày</span>
          </div>
          <p className="text-[11px] text-[#64748b] mt-1.5">Duy trì đều đặn 7 ngày</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2e8f0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748b]">Từ vựng đã nhớ</span>
            <span className="material-symbols-outlined text-[#0650cc] text-lg">translate</span>
          </div>
          <div className="text-2xl font-bold text-[#0f172a]">
            {report?.wordsMastered || 142} <span className="text-xs font-normal text-[#64748b]">từ</span>
          </div>
          <p className="text-[11px] text-[#64748b] mt-1.5">Theo phương pháp SRS</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#e2e8f0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#64748b]">Điểm viết trung bình</span>
            <span className="material-symbols-outlined text-emerald-600 text-lg">edit_note</span>
          </div>
          <div className="text-2xl font-bold text-[#0f172a]">
            {report?.averageWritingScore || 6.8} <span className="text-xs font-normal text-[#64748b]">/ 9.0</span>
          </div>
          <p className="text-[11px] text-[#64748b] mt-1.5">Tương đương B2 CEFR</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-[#0f172a]">Đánh giá theo kỹ năng</h3>
              <span className="text-xs text-[#64748b]">Cập nhật tuần này</span>
            </div>

            <div className="space-y-3.5 pt-1">
              {((report as any)?.skillBars || skillBars).map((sk: any) => (
                <div key={sk.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0f172a]">{sk.name}</span>
                    <span className="font-semibold text-[#0650cc]">
                      {sk.score}% ({sk.level})
                    </span>
                  </div>
                  <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sk.color || 'bg-[#0650cc]'}`}
                      style={{ width: `${sk.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CEFR Milestones Timeline */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-[#0f172a]">Lộ trình mục tiêu: {profile?.targetCertificate || 'IELTS 7.0'}</h3>
              <span className="text-xs text-[#64748b]">Tiến độ thực tế</span>
            </div>

            <div className="space-y-3 pt-1">
              {((report as any)?.milestones || milestones).map((m: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {m.completed ? (
                      <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                    ) : m.current ? (
                      <span className="material-symbols-outlined text-[#0650cc] text-base">radio_button_checked</span>
                    ) : (
                      <span className="material-symbols-outlined text-slate-300 text-base">radio_button_unchecked</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-medium ${m.current ? 'text-[#0650cc] font-semibold' : 'text-[#0f172a]'}`}>
                        {m.title}
                      </h4>
                      <span className="text-[11px] text-[#64748b]">{m.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-[#0f172a]">Huy hiệu đạt được</h3>
              <span className="text-xs text-amber-700 font-medium">
                {report?.badges?.filter((b) => b.unlocked).length || 3} / 5 huy hiệu
              </span>
            </div>

            <div className="space-y-2.5">
              {(report?.badges || [
                { id: '1', title: 'Học viên Chăm chỉ', description: 'Duy trì chuỗi học tập 7 ngày liên tục', icon: 'local_fire_department', unlocked: true },
                { id: '2', title: 'Ghi nhớ Từ vựng', description: 'Ghi nhớ 100 từ vựng theo phương pháp SRS', icon: 'translate', unlocked: true },
                { id: '3', title: 'Bài viết Khá', description: 'Đạt điểm bài viết từ 7.0 trở lên', icon: 'edit_note', unlocked: true },
                { id: '4', title: 'Luyện nghe Chăm chỉ', description: 'Hoàn thành 10 bài nghe hiểu', icon: 'headphones', unlocked: false },
                { id: '5', title: 'Phản xạ Hội thoại', description: 'Hoàn thành 50 tin nhắn giao tiếp cùng AI', icon: 'forum', unlocked: false },
              ]).map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                    badge.unlocked
                      ? 'border-[#e2e8f0] bg-[#f8fafc]'
                      : 'border-dashed border-slate-200 opacity-60'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      badge.unlocked
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{badge.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-[#0f172a]">{badge.title}</h4>
                      {badge.unlocked && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800">
                          Đã đạt
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-0.5">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
