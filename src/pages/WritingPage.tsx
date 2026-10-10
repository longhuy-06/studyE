import React, { useState, useEffect } from 'react';
import { WritingSubmission } from '../types';
import { api } from '../services/api';

export const WritingPage: React.FC = () => {
  const [topic, setTopic] = useState(
    'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?'
  );
  const [content, setContent] = useState('');
  const [taskType, setTaskType] = useState('IELTS Task 2');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<WritingSubmission | null>(null);
  const [history, setHistory] = useState<WritingSubmission[]>([]);

  // Suggested Topics
  const sampleTopics = [
    {
      type: 'IELTS Task 2',
      title: 'Compulsory community service for high schoolers',
      prompt:
        'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?',
      minWords: 250,
    },
    {
      type: 'IELTS Task 2',
      title: 'Technological advancements and human communication',
      prompt:
        'Nowadays, the way many people interact with each other has changed because of technology. In what ways has technology affected the types of relationships people make? Has this been a positive or negative development?',
      minWords: 250,
    },
    {
      type: 'Business Email',
      title: 'Professional Job Application Follow-up',
      prompt:
        'Write a professional follow-up email to the Hiring Manager after your interview for the position of Senior Frontend Engineer at a global technology company.',
      minWords: 120,
    },
    {
      type: 'Business Email',
      title: 'Client Project Delay & Remedy Proposal',
      prompt:
        'Write an email to an international client explaining an unavoidable 1-week delay in delivering the project milestone, along with compensation and revised roadmap.',
      minWords: 150,
    },
  ];

  const sampleEssays: Record<string, string> = {
    'Compulsory community service for high schoolers': `It is frequently argued that secondary school students ought to be required to participate in unpaid volunteer work within their local communities. While some educators argue that compulsory service creates unnecessary academic burdens, I firmly agree that introducing community service into high school curriculums fosters civic responsibility and develops essential interpersonal skills.

To begin with, mandatory community engagement helps teenagers develop empathy and social awareness. Today, many adolescents spend excessive amounts of screen time disconnected from real-world societal challenges. By volunteering at elderly care facilities, local food banks, or community clean-up drives, students witness firsthand the socioeconomic disparities existing in their neighborhoods. Consequently, they become more compassionate citizens who understand the value of public service and mutual support.

Furthermore, volunteer programs equip young individuals with practical life skills that cannot be acquired solely through textbook study. Participating in community initiatives requires team collaboration, problem solving, and effective communication with diverse populations. For instance, organizing a local charity event demands strict time management and leadership abilities, both of which are highly regarded by future university admissions committees and prospective employers.

In conclusion, although balancing extracurricular commitments with heavy academic schedules can be challenging, the profound benefits of cultivating empathetic mindset and pragmatic soft skills far outweigh the drawbacks. Therefore, educational authorities should integrate unpaid community service into high school programmes as a graduation requirement.`,
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getWritingHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubmission = async (e: React.MouseEvent, subId: string) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa bài viết này khỏi database không?')) return;
    try {
      await api.deleteWritingSubmission(subId);
      setHistory((prev) => prev.filter((h) => h.id !== subId));
      if (analysisResult?.id === subId) {
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error('Error deleting submission:', err);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const paragraphCount = content.trim() ? content.split(/\n\s*\n/).length : 0;

  const handleAnalyze = async () => {
    if (!content.trim() || wordCount < 30) {
      alert('Vui lòng viết tối thiểu 30 từ để AI có thể đánh giá và chấm điểm chính xác.');
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    try {
      const result = await api.analyzeWriting(topic, content);
      setAnalysisResult(result);
      // Reload history
      loadHistory();
    } catch (err: any) {
      alert(err.message || 'Không thể kết nối với dịch vụ chấm bài AI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (tTitle: string) => {
    const essay = sampleEssays[tTitle];
    if (essay) {
      setContent(essay);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">Luyện viết tiếng Anh</h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Kiểm tra ngữ pháp, gợi ý nâng cấp từ vựng và đánh giá bài viết theo tiêu chí chuẩn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#64748b]">Dạng bài:</span>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-xs font-medium text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
          >
            <option value="IELTS Task 2">IELTS Writing Task 2</option>
            <option value="Business Email">Email công việc</option>
            <option value="Academic Essay">Đoạn văn học thuật</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Writing Editor & Topic */}
        <div className="lg:col-span-7 space-y-5">
          {/* Topic Card */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#0f172a]">
                Đề bài:
              </label>
              <div className="flex items-center gap-1.5">
                {sampleTopics.map((st, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTopic(st.prompt);
                      setTaskType(st.type);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-[#0650cc] text-[#64748b] font-medium transition-colors cursor-pointer"
                  >
                    Đề mẫu #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-xs font-normal text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
              placeholder="Nhập đề bài tiếng Anh của bạn tại đây..."
            />
          </div>

          {/* Editor Card */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2.5">
              <div className="flex items-center gap-3 text-xs text-[#64748b]">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-[#0f172a]">{wordCount}</span> từ
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-[#0f172a]">{paragraphCount}</span> đoạn
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleLoadSample('Compulsory community service for high schoolers')
                  }
                  className="px-2.5 py-1 rounded-md bg-blue-50 text-[#0650cc] text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Dán bài mẫu
                </button>
                <button
                  type="button"
                  onClick={() => setContent('')}
                  className="px-2.5 py-1 rounded-md border border-[#cbd5e1] text-xs text-[#64748b] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>

            <textarea
              rows={13}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập bài viết bằng tiếng Anh của bạn..."
              className="w-full p-3.5 rounded-lg border border-[#cbd5e1] bg-white text-xs sm:text-sm text-[#0f172a] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0650cc] font-sans"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="text-xs text-[#64748b]">
                {wordCount < 150 ? (
                  <span className="text-amber-700">
                    Khuyến nghị từ 250 từ cho IELTS Task 2.
                  </span>
                ) : (
                  <span className="text-emerald-700">
                    Độ dài bài viết phù hợp ({wordCount} từ).
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={loading || !content.trim()}
                onClick={handleAnalyze}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#0650cc] hover:bg-[#003ea8] text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang chấm bài...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check</span>
                    Chấm bài viết
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): AI Evaluation Report */}
        <div className="lg:col-span-5 space-y-5">
          {analysisResult ? (
            <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-5">
              {/* Score header */}
              <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                <div>
                  <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                    Kết quả đánh giá
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0f172a] mt-0.5">
                    Điểm ước tính: {analysisResult.overallScore} / 9.0
                  </h3>
                </div>
                <div className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  {analysisResult.overallScore >= 7.5 ? 'CEFR C1' : analysisResult.overallScore >= 6.0 ? 'CEFR B2' : 'CEFR B1'}
                </div>
              </div>

              {/* 4 Criteria Scores */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[11px] text-[#64748b]">Task Response</div>
                  <div className="text-base font-bold text-[#0650cc]">
                    {analysisResult.criteriaScores?.taskAchievement || '7.0'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[11px] text-[#64748b]">Coherence & Cohesion</div>
                  <div className="text-base font-bold text-[#0650cc]">
                    {analysisResult.criteriaScores?.coherence || '7.0'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[11px] text-[#64748b]">Lexical Resource</div>
                  <div className="text-base font-bold text-[#0650cc]">
                    {analysisResult.criteriaScores?.lexicalResource || '7.5'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[11px] text-[#64748b]">Grammatical Accuracy</div>
                  <div className="text-base font-bold text-[#0650cc]">
                    {analysisResult.criteriaScores?.grammar || '7.0'}
                  </div>
                </div>
              </div>

              {/* General Feedback */}
              <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 space-y-1">
                <h4 className="text-[11px] font-semibold text-[#0650cc] uppercase tracking-wider">
                  Nhận xét tổng quan
                </h4>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {analysisResult.feedback}
                </p>
              </div>

              {/* Grammar Corrections */}
              {analysisResult.corrections && analysisResult.corrections.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-[#0f172a] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-amber-600">spellcheck</span>
                    Lỗi ngữ pháp & gợi ý sửa ({analysisResult.corrections.length})
                  </h4>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {analysisResult.corrections.map((corr, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-red-50/30 border border-red-100 text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-red-600 font-medium line-through">
                          <span>✗</span>
                          <span>{corr.original}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <span>✓</span>
                          <span>{corr.suggestion}</span>
                        </div>
                        <p className="text-[11px] text-[#64748b] pt-0.5">
                          {corr.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary Upgrades */}
              {analysisResult.vocabularySuggestions && analysisResult.vocabularySuggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#0f172a] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-blue-600">upgrade</span>
                    Gợi ý từ vựng nâng cao
                  </h4>

                  <div className="space-y-1.5">
                    {analysisResult.vocabularySuggestions.map((vs, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-[#64748b]">{vs.originalWord}</span>
                          <span className="text-[#0650cc]">→ {vs.suggestedWord}</span>
                        </div>
                        <p className="text-[11px] text-[#64748b] mt-0.5">{vs.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Polished Model Essay */}
              {analysisResult.improvedVersion && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-[#0f172a] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#0650cc]">edit_document</span>
                    Đoạn văn tham khảo
                  </h4>
                  <div className="p-3.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#334155] leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap">
                    {analysisResult.improvedVersion}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-xs text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0650cc] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-xl">edit_note</span>
              </div>
              <h3 className="font-semibold text-sm text-[#0f172a]">
                Chưa có kết quả chấm bài
              </h3>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto leading-relaxed">
                Nhập nội dung bài viết và nhấn <strong>"Chấm bài viết"</strong> để nhận phản hồi về ngữ pháp, từ vựng và bài mẫu viết lại.
              </p>

              {/* History shortcuts */}
              {history.length > 0 && (
                <div className="pt-4 border-t border-[#f1f5f9] text-left">
                  <h4 className="text-xs font-semibold text-[#0f172a] mb-2">
                    Lịch sử bài viết gần đây:
                  </h4>
                  <div className="space-y-1.5">
                    {history.slice(0, 3).map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          setTopic(h.topic || h.topicTitle || '');
                          setContent(h.content);
                          setAnalysisResult(h);
                        }}
                        className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] hover:border-blue-300 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="truncate max-w-[200px] font-medium text-[#0f172a]">
                          {h.topic || h.topicTitle || 'Bài viết'}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-[#0650cc]">
                            {h.overallScore} / 9.0
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSubmission(e, h.id)}
                            className="w-6 h-6 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Xóa bài viết khỏi database"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
