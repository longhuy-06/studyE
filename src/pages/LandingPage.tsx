import React, { useState } from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { PublicFooter } from '../components/layout/PublicFooter';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      onNavigate('register');
    }, 1200);
  };

  const playPronunciation = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Resilient');
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] text-[#0f1b34] flex flex-col justify-between selection:bg-[#dbe1ff] selection:text-[#00174a]">
      <PublicHeader currentPath="landing" onNavigate={onNavigate} isAuthenticated={isAuthenticated} />

      <main className="w-full pt-16 bg-[#faf9ff] flex-1">
        {/* Ambient Glow Orbs */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-b from-[#dbe1ff]/40 via-[#e9edff]/30 to-transparent blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-96 right-10 w-[380px] h-[280px] bg-[#6cf8bb]/20 blur-3xl pointer-events-none -z-10"></div>

          {/* 1. HERO SECTION */}
          <section className="max-w-[1200px] mx-auto px-6 pt-12 sm:pt-16 pb-14">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-5">
              <span className="text-xs font-semibold text-[#0650cc] uppercase tracking-wider">
                Nền tảng học tiếng Anh trực tuyến
              </span>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f1b34] tracking-tight leading-tight">
                Học tiếng Anh chủ động và hiệu quả cùng AI
              </h1>

              {/* Supporting Paragraph */}
              <p className="text-base sm:text-lg text-[#475569] max-w-2xl leading-relaxed">
                Luyện từ vựng qua phương pháp lặp lại ngắt quãng (SRS), nhận phản hồi ngữ pháp tức thì và thực hành hội thoại phản xạ mỗi ngày.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'overview' : 'register')}
                  className="px-6 py-3 rounded-xl bg-[#0650cc] hover:bg-[#003ea8] text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Bắt đầu học ngay</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <a
                  href="#core-features"
                  className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#0f1b34] font-semibold text-sm transition-colors flex items-center gap-2 border border-[#cbd5e1]"
                >
                  <span className="material-symbols-outlined text-base text-[#0650cc]">play_circle</span>
                  <span>Xem tính năng</span>
                </a>
              </div>

              {/* Clean Feature List */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#64748b]">
                <span>Phương pháp lặp lại ngắt quãng SRS</span>
                <span aria-hidden="true">·</span>
                <span>Luyện phát âm chuẩn IPA</span>
                <span aria-hidden="true">·</span>
                <span>Chữa bài viết theo chuẩn CEFR</span>
                <span aria-hidden="true">·</span>
                <span>Hội thoại theo tình huống</span>
              </div>
            </div>

            {/* 2. INTERACTIVE PRODUCT PREVIEW MOCKUP */}
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="rounded-2xl bg-white shadow-xl border border-[#e1e8ff] overflow-hidden">
                {/* Browser Titlebar */}
                <div className="bg-[#f1f3ff] px-4 py-3 flex items-center justify-between border-b border-[#e1e8ff]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ba1a1a]/60"></span>
                    <span className="w-3 h-3 rounded-full bg-[#7f4f00]/60"></span>
                    <span className="w-3 h-3 rounded-full bg-[#006c49]/60"></span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1 bg-white rounded-full text-xs text-[#737685] max-w-xs w-full justify-center shadow-inner">
                    <span className="material-symbols-outlined text-xs">lock</span>
                    <span>app.linguanext.edu.vn/workspace</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#737685]">
                    <span className="material-symbols-outlined text-sm">share</span>
                    <span className="material-symbols-outlined text-sm">more_vert</span>
                  </div>
                </div>

                {/* Dashboard Content Mock */}
                <div className="p-4 sm:p-6 bg-[#faf9ff]">
                  {/* Top Metric Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-[#e1e8ff] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[#737685] block">Chuỗi học tập</span>
                        <span className="text-base text-[#7f4f00] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[#7f4f00] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                            local_fire_department
                          </span>
                          7 Ngày
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#ffddb8] text-[#2a1700] text-[11px] font-semibold">Đạt mục tiêu</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-sm border border-[#e1e8ff] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[#737685] block">Từ vựng Oxford</span>
                        <span className="text-base text-[#0650cc] font-bold">142 Từ đã nhớ</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#0650cc]">
                        <span className="material-symbols-outlined text-base">style</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-sm border border-[#e1e8ff] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[#737685] block">Độ chuẩn xác phát âm</span>
                        <span className="text-base text-[#006c49] font-bold">94% IPA</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#6ffbbe] flex items-center justify-center text-[#006c49]">
                        <span className="material-symbols-outlined text-base">mic</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-sm border border-[#e1e8ff] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[#737685] block">Cấp độ hiện tại</span>
                        <span className="text-base text-[#0f1b34] font-bold">B2 Upper</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#356ae6] text-white text-[11px] font-semibold">IELTS 6.5+</span>
                    </div>
                  </div>

                  {/* Split Preview Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Flashcard & Phonetic Studio Widget (7 cols) */}
                    <div className="lg:col-span-7 bg-white p-4 rounded-xl shadow-sm border border-[#e1e8ff] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-1 rounded bg-[#e9edff] text-xs text-[#0650cc] font-semibold">
                            Luyện tập ngắt quãng (Spaced Repetition)
                          </span>
                          <span className="text-xs text-[#737685]">Thẻ 14 / 20 hôm nay</span>
                        </div>

                        <div className="p-4 rounded-xl bg-[#f1f3ff] mb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-bold text-[#0f1b34]">Resilient</h3>
                                <span className="text-xs text-[#737685]">(adj)</span>
                              </div>
                              <div className="inline-flex items-center gap-2 mt-1.5 px-3 py-1 rounded-full bg-[#d8e2ff] text-[#0650cc] font-mono text-sm">
                                <span>/rɪˈzɪl.jənt/</span>
                                <button
                                  onClick={playPronunciation}
                                  className="w-5 h-5 rounded-full bg-[#0650cc] text-white flex items-center justify-center hover:scale-105 transition-transform"
                                  title="Nghe phát âm"
                                >
                                  <span className={`material-symbols-outlined text-xs ${isPlayingAudio ? 'animate-spin' : ''}`}>
                                    volume_up
                                  </span>
                                </button>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-[#6ffbbe] text-[#002113] text-xs font-bold">CEFR C1</span>
                          </div>

                          <p className="text-sm text-[#0f1b34] mt-3 font-semibold">
                            Kiên cường, có khả năng phục hồi nhanh chóng sau khó khăn.
                          </p>
                          <p className="text-xs text-[#434654] mt-1.5 italic">
                            "Vietnamese students are remarkably <strong className="text-[#0650cc] font-bold">resilient</strong> when adapting to new AI learning technologies."
                          </p>
                        </div>
                      </div>

                      {/* Recall Buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          onClick={() => onNavigate('vocabulary')}
                          className="py-2.5 rounded-lg bg-[#e1e8ff] hover:bg-[#ffdad6] text-[#0f1b34] text-xs font-semibold transition-colors text-center"
                        >
                          Cần ôn lại (1m)
                        </button>
                        <button
                          onClick={() => onNavigate('vocabulary')}
                          className="py-2.5 rounded-lg bg-[#e1e8ff] hover:bg-[#ffddb8] text-[#0f1b34] text-xs font-semibold transition-colors text-center"
                        >
                          Đang nhớ (10m)
                        </button>
                        <button
                          onClick={() => onNavigate('vocabulary')}
                          className="py-2.5 rounded-lg bg-[#356ae6] hover:bg-[#0650cc] text-white text-xs font-semibold transition-colors text-center"
                        >
                          Thành thạo (4d)
                        </button>
                      </div>
                    </div>

                    {/* Right: AI Chatbot Companion Snippet (5 cols) */}
                    <div className="lg:col-span-5 bg-white p-4 rounded-xl shadow-sm border border-[#e1e8ff] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 pb-3 border-b border-[#e1e8ff] mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#356ae6] text-white flex items-center justify-center font-bold text-xs">
                            <span className="material-symbols-outlined text-base">smart_toy</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#0f1b34] leading-tight">Trợ lý AI</h4>
                            <span className="text-xs text-[#006c49] flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span> Sẵn sàng phản hồi
                            </span>
                          </div>
                        </div>

                        {/* Chat bubbles */}
                        <div className="space-y-2 text-xs">
                          {/* Bot message */}
                          <div className="bg-[#e9edff] p-3 rounded-xl rounded-tl-none text-[#0f1b34]">
                            <p className="leading-snug">
                              "Great pronunciation! Now try using <span className="font-bold text-[#0650cc]">resilient</span> in a sentence about your graduation project."
                            </p>
                            <span className="mt-1 text-[11px] text-[#0650cc] font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">translate</span>
                              Xem tiếng Việt
                            </span>
                          </div>

                          {/* User message */}
                          <div className="bg-[#0650cc] text-white p-3 rounded-xl rounded-tr-none ml-auto max-w-[85%]">
                            <p className="leading-snug">
                              "Our software team remained resilient despite the tight submission deadline."
                            </p>
                          </div>

                          {/* AI Diff Feedback note */}
                          <div className="bg-[#f1f3ff] p-2.5 rounded-lg flex items-start gap-2">
                            <span className="material-symbols-outlined text-[#006c49] text-base mt-0.5">verified</span>
                            <div>
                              <span className="font-bold text-[#006c49] block">Chính xác 100% ngữ pháp!</span>
                              <span className="text-[#434654] text-[11px]">Collocation tự nhiên, đạt chuẩn văn phong học thuật.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mock input box */}
                      <div
                        onClick={() => onNavigate('conversation')}
                        className="mt-3 flex items-center gap-2 bg-[#f1f3ff] p-2 rounded-lg cursor-pointer hover:bg-[#e9edff] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[#737685] text-base ml-1">mic</span>
                        <span className="text-xs text-[#737685] flex-1">Nhấn để nói hoặc gõ câu trả lời...</span>
                        <span className="w-6 h-6 rounded bg-[#356ae6] text-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs">send</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CORE 4-FEATURE CARDS SECTION */}
          <section className="max-w-[1200px] mx-auto px-6 py-14" id="core-features">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs text-[#0650cc] uppercase tracking-wider font-semibold">Các tính năng chính</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f1b34] mt-1.5">4 Kỹ năng luyện tập toàn diện</h2>
              <p className="text-sm text-[#64748b] mt-1.5 leading-relaxed">
                Thiết kế tập trung vào tính thực tế, hỗ trợ bạn sử dụng tiếng Anh tự tin trong công việc và học tập.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1 */}
              <div
                onClick={() => onNavigate('vocabulary')}
                className="bg-white p-5 rounded-xl border border-[#e2e8f0] hover:border-[#0650cc] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0650cc] mb-3">
                    <span className="material-symbols-outlined text-xl">auto_stories</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0f1b34]">Học từ vựng SRS</h3>
                  <p className="text-xs sm:text-sm text-[#64748b] mt-1.5 leading-relaxed">
                    Ôn tập từ vựng qua phương pháp lặp lại ngắt quãng (Spaced Repetition), flashcard tương tác kèm phiên âm IPA và ví dụ thực tế.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-medium text-[#0650cc]">
                  <span>Luyện từ vựng</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </div>

              {/* Card 2 */}
              <div
                onClick={() => onNavigate('listening')}
                className="bg-white p-5 rounded-xl border border-[#e2e8f0] hover:border-[#0650cc] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
                    <span className="material-symbols-outlined text-xl">headphones</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0f1b34]">Luyện nghe phản xạ</h3>
                  <p className="text-xs sm:text-sm text-[#64748b] mt-1.5 leading-relaxed">
                    Audio giọng bản xứ theo chủ đề thực tế, kết hợp bài tập trắc nghiệm nghe hiểu và chép chính tả từng câu.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-medium text-[#0650cc]">
                  <span>Luyện nghe</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </div>

              {/* Card 3 */}
              <div
                onClick={() => onNavigate('writing')}
                className="bg-white p-5 rounded-xl border border-[#e2e8f0] hover:border-[#0650cc] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                    <span className="material-symbols-outlined text-xl">edit_note</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0f1b34]">Chấm bài viết cùng AI</h3>
                  <p className="text-xs sm:text-sm text-[#64748b] mt-1.5 leading-relaxed">
                    Phân tích ngữ pháp chi tiết, gợi ý nâng cấp từ vựng và tham khảo bài mẫu viết lại theo chuẩn CEFR.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-medium text-[#0650cc]">
                  <span>Luyện viết</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </div>

              {/* Card 4 */}
              <div
                onClick={() => onNavigate('conversation')}
                className="bg-white p-5 rounded-xl border border-[#e2e8f0] hover:border-[#0650cc] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                    <span className="material-symbols-outlined text-xl">forum</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0f1b34]">Luyện nói cùng AI</h3>
                  <p className="text-xs sm:text-sm text-[#64748b] mt-1.5 leading-relaxed">
                    Thực hành giao tiếp theo các tình huống thường gặp (phỏng vấn, công sở, đời sống) có hỗ trợ phát âm và góp ý câu từ.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-medium text-[#0650cc]">
                  <span>Trò chuyện</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. PERSONALIZED LEARNING PATH */}
          <section className="bg-[#f8fafc] py-14 border-y border-[#e2e8f0]" id="learning-path">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs text-[#0650cc] uppercase tracking-wider font-semibold">Quy trình học tập</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0f1b34] mt-1.5">3 Bước duy trì thói quen học tập</h2>
                <p className="text-sm text-[#64748b] mt-1.5 leading-relaxed">
                  Lộ trình rõ ràng giúp bạn học tập đều đặn mỗi ngày mà không bị quá tải.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Step 1 */}
                <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] flex flex-col">
                  <div className="w-8 h-8 rounded-lg bg-[#0650cc] text-white font-bold flex items-center justify-center text-xs mb-3">
                    01
                  </div>
                  <h3 className="text-base font-bold text-[#0f1b34] mb-1.5">Xác định mục tiêu học tập</h3>
                  <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed flex-1">
                    Lựa chọn mục tiêu cụ thể như chuẩn bị phỏng vấn, giao tiếp công sở, hoặc ôn thi chứng chỉ IELTS / TOEIC.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#f1f5f9] text-xs text-[#64748b]">
                    Khung tham chiếu CEFR từ A1 đến C2
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] flex flex-col">
                  <div className="w-8 h-8 rounded-lg bg-[#356ae6] text-white font-bold flex items-center justify-center text-xs mb-3">
                    02
                  </div>
                  <h3 className="text-base font-bold text-[#0f1b34] mb-1.5">Luyện tập theo quỹ thời gian</h3>
                  <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed flex-1">
                    Dành từ 15 đến 30 phút mỗi ngày để hoàn thành bài ôn từ vựng, nghe một đoạn hội thoại hoặc viết một đoạn văn ngắn.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#f1f5f9] text-xs text-[#64748b]">
                    Nhắc nhở nhẹ nhàng theo khung giờ bạn chọn
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] flex flex-col">
                  <div className="w-8 h-8 rounded-lg bg-[#006c49] text-white font-bold flex items-center justify-center text-xs mb-3">
                    03
                  </div>
                  <h3 className="text-base font-bold text-[#0f1b34] mb-1.5">Theo dõi và củng cố</h3>
                  <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed flex-1">
                    Xem lại biểu đồ chuỗi học tập và số từ vựng đã nhớ dài hạn. Hệ thống tự động nhắc ôn các từ khó bạn hay quên.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#f1f5f9] text-xs text-[#64748b]">
                    Báo cáo tiến độ tuần minh bạch
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. ACADEMIC RIGOR & TESTIMONIALS */}
          <section className="max-w-[1200px] mx-auto px-6 py-14" id="about-team">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-3">
                <span className="text-xs font-semibold text-[#0650cc] uppercase tracking-wider">
                  Định hướng phát triển
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0f1b34] leading-tight">
                  Tập trung vào trải nghiệm học thực tế của người Việt
                </h2>
                <p className="text-sm text-[#475569] leading-relaxed">
                  LinguaNext được xây dựng dựa trên phương pháp đối chiếu ngôn ngữ Anh - Việt, nhằm giải quyết trực diện các rào cản người học thường gặp phải: thiếu môi trường phản xạ, ngữ pháp rời rạc và phát âm thiếu chuẩn xác.
                </p>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Thay vì học thuộc lòng máy móc, bạn được thực hành qua các bài tập ngắn, có phản hồi tức thì và giải thích rõ ràng bằng tiếng Việt.
                </p>
              </div>

              <div className="lg:col-span-6 space-y-3">
                <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#0650cc] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#dbe1ff]">
                      MT
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0f1b34]">Minh Thảo</h4>
                      <span className="text-[11px] text-[#64748b]">Học viên ôn luyện IELTS</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed italic">
                    "Tính năng gợi ý chữa bài viết chỉ ra các lỗi ngữ pháp chi tiết và có gợi ý từ vựng theo ngữ cảnh rất tiện lợi. Mình duy trì học 20 phút mỗi ngày dễ dàng hơn."
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#e2e8f0]">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#006c49] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#a3f6c8]">
                      MH
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0f1b34]">Minh Hoàng</h4>
                      <span className="text-[11px] text-[#64748b]">Kỹ sư phần mềm</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed italic">
                    "Phần luyện nghe chép chính tả và đàm thoại theo chủ đề công sở giúp mình tự tin hơn khi tham gia các cuộc họp bằng tiếng Anh."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. BOTTOM BANNER CTA */}
          <section className="max-w-[1200px] mx-auto px-6 pb-14">
            <div className="rounded-2xl bg-[#0650cc] p-8 sm:p-10 text-white text-center">
              <div className="max-w-xl mx-auto space-y-3">
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                  Bắt đầu học tiếng Anh ngay hôm nay
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 max-w-md mx-auto leading-relaxed">
                  Tạo tài khoản miễn phí để thiết lập mục tiêu và trải nghiệm các bài học đầu tiên.
                </p>

                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto pt-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white text-[#0f1b34] placeholder:text-[#94a3b8] text-xs focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto whitespace-nowrap px-5 py-2.5 rounded-lg bg-white text-[#0650cc] text-xs font-bold hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    {subscribed ? 'Đang chuyển tiếp...' : 'Tạo tài khoản'}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
};
