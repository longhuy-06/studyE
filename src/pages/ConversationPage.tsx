import React, { useState, useEffect, useRef } from 'react';
import { ConversationSession } from '../types';
import { api } from '../services/api';

export const ConversationPage: React.FC = () => {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const topics = [
    {
      id: 'job_interview',
      title: 'Job Interview at Tech Firm',
      desc: 'Phỏng vấn xin việc bằng tiếng Anh với nhà tuyển dụng',
      icon: 'work',
    },
    {
      id: 'hotel_checkin',
      title: 'Hotel Check-in & Concierge',
      desc: 'Giao tiếp nhận phòng khách sạn và hỏi đường khi du lịch',
      icon: 'hotel',
    },
    {
      id: 'coffee_networking',
      title: 'Coffee Break & Casual Networking',
      desc: 'Nói chuyện phiếm và làm quen đối tác tại hội thảo',
      icon: 'coffee',
    },
    {
      id: 'business_negotiation',
      title: 'Project Deadline Negotiation',
      desc: 'Thương lượng lịch trình và ngân sách dự án với khách hàng',
      icon: 'handshake',
    },
  ];

  useEffect(() => {
    loadSessions();
    setupSpeechRecognition();
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const setupSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  };

  const loadSessions = async () => {
    try {
      const data = await api.getConversationSessions();
      setSessions(data);
      if (data.length > 0) {
        setCurrentSession(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentSession || loading) return;

    const userMessageText = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const updatedSession = await api.sendConversationMessage(
        currentSession.id,
        userMessageText
      );
      setCurrentSession(updatedSession);

      // Auto speak tutor's last reply if enabled
      if (autoPlayAudio) {
        const lastMsg = updatedSession.messages[updatedSession.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          speakText(lastMsg.content);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Không thể gửi tin nhắn.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt hiện tại chưa hỗ trợ nhận diện giọng nói Web Speech. Vui lòng sử dụng gõ bàn phím.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const startNewTopic = async (topicTitle: string) => {
    try {
      const newSession = await api.createConversationSession(topicTitle);
      setCurrentSession(newSession);
      setSessions([newSession, ...sessions]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa phiên đàm thoại này khỏi database?')) return;
    try {
      await api.deleteConversationSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (currentSession?.id === sessionId) {
        setCurrentSession(remaining[0] || null);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">Hội thoại tiếng Anh</h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Luyện phản xạ giao tiếp theo các tình huống thực tế và nhận gợi ý diễn đạt trực tiếp.
          </p>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#64748b] select-none">
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(e) => setAutoPlayAudio(e.target.checked)}
              className="rounded text-[#0650cc] focus:ring-[#0650cc]"
            />
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-[#0650cc]">volume_up</span>
              Tự động phát âm thanh
            </span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Chat Container */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col h-[600px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 sm:p-4 border-b border-[#f1f5f9] flex items-center justify-between bg-[#f8fafc]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0650cc] text-white flex items-center justify-center font-bold text-xs relative">
                <span className="material-symbols-outlined text-base">smart_toy</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-xs sm:text-sm text-[#0f172a]">Trợ lý AI</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-[#0650cc] font-medium">
                    Hội thoại tiếng Anh
                  </span>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  Chủ đề: {currentSession?.topic || currentSession?.topicTitle || 'Luyện tập tiếng Anh'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              }}
              className="text-xs text-[#64748b] hover:text-[#0f172a] flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">volume_off</span>
              Dừng đọc
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white">
            {currentSession?.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${
                    isUser ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                      isUser
                        ? 'bg-slate-700 text-white'
                        : 'bg-[#0650cc] text-white'
                    }`}
                  >
                    {isUser ? 'BẠN' : 'AI'}
                  </div>

                  {/* Bubble Content */}
                  <div className="space-y-1.5">
                    <div
                      className={`p-3 rounded-lg text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#0650cc] text-white'
                          : 'bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0]'
                      }`}
                    >
                      <p>{msg.content}</p>

                      {!isUser && (
                        <div className="mt-2 pt-1.5 border-t border-[#e2e8f0] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => speakText(msg.content)}
                            className="text-[11px] font-medium text-[#0650cc] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">volume_up</span>
                            Nghe phát âm
                          </button>
                          <span className="text-[10px] text-[#94a3b8]">
                            {msg.timestamp || new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Feedback & Grammar Tip */}
                    {!isUser && (msg.feedback || msg.suggestedReply) && (
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                        {msg.feedback && (
                          <div className="text-amber-900">
                            <span className="font-semibold flex items-center gap-1 text-[11px] text-amber-800">
                              <span className="material-symbols-outlined text-xs">lightbulb</span>
                              Gợi ý phản hồi:
                            </span>
                            <p className="text-[11px] mt-0.5 leading-relaxed">{msg.feedback}</p>
                          </div>
                        )}

                        {msg.suggestedReply && (
                          <div className="pt-1 border-t border-amber-200/60 text-[11px] text-[#0650cc]">
                            <span className="font-medium">Cách diễn đạt gợi ý:</span>
                            <p className="font-mono text-[11px] bg-white p-1 rounded mt-0.5 border border-amber-200/50">
                              "{msg.suggestedReply}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-[#0650cc] text-white flex items-center justify-center text-[10px] font-bold">
                  AI
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center gap-2 text-xs text-[#64748b]">
                  <span className="w-3 h-3 border-2 border-[#0650cc] border-t-transparent rounded-full animate-spin" />
                  Đang trả lời...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-[#f1f5f9] bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 text-[#0650cc] hover:bg-blue-50'
                }`}
                title="Bấm để nói bằng Microphone"
              >
                <span className="material-symbols-outlined text-lg">
                  {isRecording ? 'mic' : 'mic_none'}
                </span>
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập câu trả lời bằng tiếng Anh (hoặc bấm mic)..."
                className="flex-1 px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-xs text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
              />

              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="w-9 h-9 rounded-lg bg-[#0650cc] text-white flex items-center justify-center hover:bg-[#003ea8] disabled:opacity-50 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (4 cols): Scenarios & Advice */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Scenario Selector */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-2.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0650cc] text-base">theater_comedy</span>
              <h3 className="font-bold text-xs sm:text-sm text-[#0f172a]">Chủ đề hội thoại</h3>
            </div>
            <p className="text-[11px] text-[#64748b]">
              Chọn chủ đề bạn muốn luyện tập:
            </p>

            <div className="space-y-2 pt-1">
              {topics.map((t) => (
                <div
                  key={t.id}
                  onClick={() => startNewTopic(t.title)}
                  className="p-3 rounded-lg border border-[#e2e8f0] hover:border-[#0650cc] hover:bg-blue-50/30 transition-all cursor-pointer flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0650cc] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-sm">{t.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#0f172a]">{t.title}</h4>
                    <p className="text-[11px] text-[#64748b] mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Conversations in Database */}
          {sessions.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#0650cc] text-base">forum</span>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0f172a]">
                    Hội thoại đã lưu ({sessions.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pt-1">
                {sessions.map((s) => {
                  const isActive = currentSession?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setCurrentSession(s)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                        isActive
                          ? 'border-[#0650cc] bg-blue-50/50 font-semibold text-[#0650cc]'
                          : 'border-[#e2e8f0] hover:bg-slate-50 text-[#0f172a]'
                      }`}
                    >
                      <div className="truncate flex-1">
                        <p className="truncate font-medium">{s.topicTitle || s.topic || 'Hội thoại'}</p>
                        <span className="text-[10px] text-[#64748b]">
                          {s.messages?.length || 0} tin nhắn
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        className="w-6 h-6 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center shrink-0 transition-colors"
                        title="Xóa phiên khỏi database"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Practice Tips Card */}
          <div className="bg-[#f8fafc] rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-base">tips_and_updates</span>
              <h4 className="font-semibold text-xs sm:text-sm text-[#0f172a]">Mẹo luyện tập</h4>
            </div>

            <p className="text-xs text-[#64748b] leading-relaxed">
              Hãy cố gắng trả lời bằng câu hoàn chỉnh thay vì chỉ dùng một từ. Nếu chưa rõ nghĩa một câu nào đó, bạn có thể gõ câu hỏi để được giải thích thêm.
            </p>

            <div className="pt-2 border-t border-[#e2e8f0] text-[11px] text-[#64748b] space-y-1">
              <p>• Dùng phím Enter để gửi nhanh tin nhắn.</p>
              <p>• Bấm biểu tượng loa cạnh tin nhắn để nghe phát âm.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
