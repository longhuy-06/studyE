import React, { useState, useEffect, useRef } from 'react';
import { ListeningExercise } from '../types';
import { api } from '../services/api';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseTimestamp(ts?: string): number {
  if (!ts) return 0;
  const parts = ts.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  return 0;
}

function normalizeExercise(raw: ListeningExercise): ListeningExercise {
  const blanks = raw.blanks || [];
  const fillInBlanks =
    raw.fillInBlanks && raw.fillInBlanks.length > 0
      ? raw.fillInBlanks
      : blanks.map((b, idx) => ({
          id: b.id || idx + 1,
          sentence: raw.paragraphWithBlanks || `Chỗ trống #${b.index || idx + 1}: ${b.meaning}`,
          targetWord: b.targetWord,
          hint: b.hint || b.phonetic || '',
        }));

  const questions =
    raw.questions && raw.questions.length > 0
      ? raw.questions
      : [
          {
            id: 1,
            question: `Chủ đề chính được thảo luận trong bài "${raw.title}" là gì?`,
            options: [
              raw.section || 'Xu hướng phát triển công nghệ và chuyển đổi số',
              'Chiến lược tiếp thị truyền thống',
              'Quản trị tài chính cá nhân',
              'Thiết kế giao diện người dùng',
            ],
            correctAnswer: 0,
            explanation: `Bài nghe tập trung vào: ${raw.section || raw.title}. Diễn giả giải thích các yếu tố cốt lõi trong đoạn transcript.`,
          },
        ];

  const transcript =
    raw.transcript && raw.transcript.length > 0
      ? raw.transcript
      : [
          {
            timestamp: '00:03',
            speaker: raw.speaker || 'Diễn giả',
            text: raw.audioTranscriptEn || raw.title,
            vietnamese: raw.audioTranscriptVi || '',
          },
        ];

  const keyVocab =
    raw.keyVocab && raw.keyVocab.length > 0
      ? raw.keyVocab
      : blanks.map((b) => ({
          word: b.targetWord,
          phonetic: b.phonetic || '',
          partOfSpeech: b.partOfSpeech || 'n',
          meaning: b.meaning || '',
          status: 'active' as const,
        }));

  return {
    ...raw,
    audioUrl: raw.audioUrl || `/audio/${raw.id}.wav`,
    topic: raw.topic || 'Business & Technology',
    blanks,
    fillInBlanks,
    questions,
    transcript,
    keyVocab,
  };
}

export const ListeningPage: React.FC = () => {
  const [exercises, setExercises] = useState<ListeningExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ListeningExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // UI Tabs & Views
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState<'mcq' | 'dictation'>('mcq');

  // Exercise interaction state
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [dictationAnswers, setDictationAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    maxScore: number;
    scorePercent: number;
    feedback: string;
    todayMinutesSpent?: number;
    listeningSkillScore?: number;
    evaluations?: {
      mcq?: Record<number, { isCorrect: boolean; correctAnswer: number; explanation?: string }>;
      dictation?: Record<string, { isCorrect: boolean; targetWord: string; userWord: string }>;
    };
  } | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  // Sync audio element with playbackRate and volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [playbackRate, volume, isMuted]);

  const loadExercises = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getListeningExercises();
      const list = Array.isArray(data) ? data.map(normalizeExercise) : [];
      setExercises(list);
      if (list.length > 0) {
        handleSelectExercise(list[0]);
      } else {
        setSelectedExercise(null);
      }
    } catch (err: any) {
      console.warn('Could not load listening exercises:', err);
      setErrorMsg('Không thể tải danh sách bài luyện nghe. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExercise = (ex: ListeningExercise) => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioError(null);

    const normalized = normalizeExercise(ex);
    setSelectedExercise(normalized);

    const anyEx = ex as any;
    if (anyEx.isCompleted) {
      setMcqAnswers(anyEx.savedMcqAnswers || {});
      setDictationAnswers(anyEx.savedDictationAnswers || {});
      setIsSubmitted(true);
      setScoreResult({
        score: anyEx.lastScore || 0,
        maxScore: anyEx.maxScore || 10,
        scorePercent: anyEx.lastScorePercent || 0,
        feedback:
          anyEx.lastScorePercent >= 80
            ? 'Bạn đã hoàn thành xuất sắc bài nghe này trong database!'
            : 'Đã hoàn thành bài nghe này (kết quả lưu trong database).',
      });
    } else {
      setMcqAnswers({});
      setDictationAnswers({});
      setIsSubmitted(false);
      setScoreResult(null);
    }
    setSubmissionId(`sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  };

  const handleResetCurrentExercise = async () => {
    if (!selectedExercise) return;
    try {
      await api.resetListening(selectedExercise.id);
      setMcqAnswers({});
      setDictationAnswers({});
      setIsSubmitted(false);
      setScoreResult(null);
      setExercises((prev) =>
        prev.map((e) =>
          e.id === selectedExercise.id
            ? ({ ...e, isCompleted: false, lastScorePercent: undefined } as any)
            : e
        )
      );
    } catch (err) {
      console.warn('Failed to reset listening exercise', err);
    }
  };

  // Audio player controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    setAudioError(null);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsAudioLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsAudioLoading(false);
        })
        .catch((err) => {
          console.warn('Audio play failed:', err);
          setIsPlaying(false);
          setIsAudioLoading(false);
          // If browser blocked or file not found, fall back to speech synthesis if needed
          setAudioError('Không thể phát tệp âm thanh này hoặc trình duyệt chặn tự động phát. Hãy bấm "Thử lại tải âm thanh" hoặc nghe qua giọng đọc máy.');
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const skipSeconds = (delta: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration || 180, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const jumpToTimestamp = (ts?: string) => {
    const seconds = parseTimestamp(ts);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const changeRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleAudioError = () => {
    setIsPlaying(false);
    setIsAudioLoading(false);
    setAudioError('Không thể tải tệp âm thanh từ nguồn máy chủ. Tệp có thể đang được chuẩn bị hoặc đường truyền bị gián đoạn.');
  };

  const fallbackSpeechSynthesis = () => {
    if (!selectedExercise) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text =
        selectedExercise.transcript && selectedExercise.transcript.length > 0
          ? selectedExercise.transcript.map((t) => `${t.speaker ? t.speaker + ': ' : ''}${t.text}`).join('. ')
          : selectedExercise.audioTranscriptEn || selectedExercise.title;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = playbackRate;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setAudioError(null);
    }
  };

  // Submit and verify answers
  const handleSubmit = async () => {
    if (!selectedExercise || isSubmitting) return;

    setIsSubmitting(true);
    const questions = selectedExercise.questions || [];
    const fillInBlanks = selectedExercise.fillInBlanks || [];

    // Local client evaluation for instant feedback
    let localScore = 0;
    const maxScore = Math.max(1, questions.length + fillInBlanks.length);

    const localMcqEvals: Record<number, { isCorrect: boolean; correctAnswer: number; explanation?: string }> = {};
    questions.forEach((q) => {
      const isCorrect = mcqAnswers[q.id] === q.correctAnswer;
      if (isCorrect) localScore++;
      localMcqEvals[q.id] = {
        isCorrect,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    const localDictationEvals: Record<string, { isCorrect: boolean; targetWord: string; userWord: string }> = {};
    fillInBlanks.forEach((b) => {
      const userVal = (dictationAnswers[String(b.id)] || '').trim().toLowerCase();
      const targetVal = b.targetWord.trim().toLowerCase();
      const isCorrect = userVal === targetVal;
      if (isCorrect) localScore++;
      localDictationEvals[String(b.id)] = {
        isCorrect,
        targetWord: b.targetWord,
        userWord: userVal,
      };
    });

    const scorePercent = Math.round((localScore / maxScore) * 100);
    const feedbackMsg =
      scorePercent === 100
        ? 'Xuất sắc! Bạn nghe hiểu hoàn hảo 100% nội dung bài nói và chép chính tả chính xác.'
        : scorePercent >= 70
        ? 'Làm rất tốt! Bạn đã nắm bắt hầu hết thông tin cốt lõi. Hãy nghe lại các câu chưa đúng để hoàn thiện.'
        : 'Hãy bật phụ đề song ngữ, giảm tốc độ về 0.75x và nghe lại để làm quen với hiện tượng nối âm.';

    setScoreResult({
      score: localScore,
      maxScore,
      scorePercent,
      feedback: feedbackMsg,
      evaluations: {
        mcq: localMcqEvals,
        dictation: localDictationEvals,
      },
    });
    setIsSubmitted(true);

    // Save to server & MongoDB Atlas
    try {
      const res = await api.submitListening(selectedExercise.id, {
        submissionId,
        score: localScore,
        maxScore,
        answers: {
          mcq: mcqAnswers,
          dictation: dictationAnswers,
        },
      });

      if (res && res.evaluations) {
        setScoreResult((prev) =>
          prev
            ? {
                ...prev,
                todayMinutesSpent: res.todayMinutesSpent,
                listeningSkillScore: res.listeningSkillScore,
              }
            : null
        );
      }
    } catch (err) {
      console.warn('Error syncing listening progress to backend:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setIsSubmitted(false);
    setScoreResult(null);
    setMcqAnswers({});
    setDictationAnswers({});
    setSubmissionId(`sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0650cc] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#44474f]">
            Đang tải dữ liệu bài luyện nghe từ hệ thống...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg || !selectedExercise || exercises.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#e1e2ec] shadow-sm text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0650cc] flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">headphones</span>
        </div>
        <h2 className="text-lg font-bold text-[#1b1b1f]">Bài luyện nghe hiện chưa sẵn sàng</h2>
        <p className="text-xs text-[#74777f]">
          {errorMsg || 'Chưa tìm thấy bài luyện nghe khả dụng trong cơ sở dữ liệu.'}
        </p>
        <button
          onClick={loadExercises}
          className="px-5 py-2.5 rounded-xl bg-[#0650cc] text-white text-xs font-bold hover:bg-[#003ea8] transition-colors cursor-pointer"
        >
          Tải lại bài nghe
        </button>
      </div>
    );
  }

  const questionsList = selectedExercise.questions || [];
  const blanksList = selectedExercise.fillInBlanks || [];
  const transcriptList = selectedExercise.transcript || [];
  const keyVocabList = selectedExercise.keyVocab || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={selectedExercise.audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={handleAudioError}
      />

      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">Luyện nghe tiếng Anh</h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Luyện nghe hiểu qua bài tập trắc nghiệm và chép chính tả từng câu theo chủ đề thực tế.
          </p>
        </div>

        {/* Exercise Quick Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#64748b] whitespace-nowrap">Chọn bài:</span>
          <select
            value={selectedExercise.id}
            onChange={(e) => {
              const ex = exercises.find((item) => item.id === e.target.value);
              if (ex) handleSelectExercise(ex);
            }}
            className="px-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-xs font-medium text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0650cc] cursor-pointer"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                [{ex.level || 'B1+'}] {ex.title} ({ex.duration})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Audio Player & Exercises */}
        <div className="lg:col-span-7 space-y-6">
          {/* Audio Player Card */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0650cc]">
                    {selectedExercise.topic}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                    {selectedExercise.level}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#0f172a] mt-1.5">
                  {selectedExercise.title}
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">{selectedExercise.section}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-medium text-[#0650cc] bg-blue-50 px-2 py-1 rounded inline-block">
                  {selectedExercise.duration}
                </span>
                <div className="text-[11px] text-[#94a3b8] mt-1">{selectedExercise.difficulty || 'Độ khó vừa'}</div>
              </div>
            </div>

            {/* Error Banner if audio cannot be loaded */}
            {audioError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="material-symbols-outlined text-base">warning</span>
                  Lưu ý về nguồn âm thanh
                </div>
                <p className="text-[11px] leading-relaxed">{audioError}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAudioError(null);
                      if (audioRef.current) {
                        audioRef.current.load();
                        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-amber-600 text-white text-[11px] font-medium hover:bg-amber-700 cursor-pointer"
                  >
                    Thử lại audio
                  </button>
                  <button
                    type="button"
                    onClick={fallbackSpeechSynthesis}
                    className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 text-[11px] font-medium hover:bg-amber-100 cursor-pointer"
                  >
                    Đọc bằng SpeechSynthesis
                  </button>
                </div>
              </div>
            )}

            {/* Main Interactive Audio Player Box */}
            <div className="p-4 rounded-xl bg-[#0650cc] text-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Skip backward 5s */}
                  <button
                    type="button"
                    onClick={() => skipSeconds(-5)}
                    title="Lùi 5 giây"
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">replay_5</span>
                  </button>

                  {/* Play / Pause Primary Button */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-xl bg-white text-[#0650cc] flex items-center justify-center hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    {isAudioLoading ? (
                      <div className="w-4 h-4 border-2 border-[#0650cc] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-2xl">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    )}
                  </button>

                  {/* Skip forward 5s */}
                  <button
                    type="button"
                    onClick={() => skipSeconds(5)}
                    title="Tiến 5 giây"
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">forward_5</span>
                  </button>

                  <div className="pl-1">
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      {isPlaying ? 'Đang phát audio' : 'Sẵn sàng nghe'}
                    </div>
                    <div className="text-[11px] text-blue-100">
                      {selectedExercise.accent || 'Giọng Mỹ'} • {selectedExercise.speaker || 'Diễn giả'}
                    </div>
                  </div>
                </div>

                {/* Speed selector */}
                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
                  {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => changeRate(rate)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                        playbackRate === rate
                          ? 'bg-white text-[#0650cc] font-semibold'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar & Timeline Scrub Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono text-blue-100 min-w-[34px]">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration > 0 ? duration : 180}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <span className="text-[11px] font-mono text-blue-100 min-w-[34px] text-right">
                    {formatTime(duration > 0 ? duration : parseTimestamp(selectedExercise.duration))}
                  </span>
                </div>
              </div>
            </div>

            {/* Subtitle / Transcript toggle button */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs font-medium text-[#0650cc] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">
                  {showTranscript ? 'subtitles_off' : 'subtitles'}
                </span>
                {showTranscript ? 'Ẩn phụ đề' : 'Xem phụ đề hội thoại (Transcript)'}
              </button>

              <div className="text-xs text-[#64748b]">
                Giọng đọc bản xứ
              </div>
            </div>

            {/* Transcript Drawer */}
            {showTranscript && (
              <div className="p-3.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-2.5 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-1">
                  <span>Nội dung bài nghe</span>
                  <span className="text-[10px] lowercase font-normal">Nhấn mốc giờ để nghe lại</span>
                </div>
                {transcriptList.map((line, idx) => (
                  <div key={idx} className="space-y-0.5 text-xs p-1.5 rounded hover:bg-white transition-colors">
                    <div className="flex items-baseline gap-2">
                      <button
                        type="button"
                        onClick={() => jumpToTimestamp(line.timestamp)}
                        className="font-mono text-[11px] text-[#0650cc] hover:underline bg-blue-50 px-1 py-0.5 rounded cursor-pointer"
                        title="Bấm để phát từ mốc này"
                      >
                        {line.timestamp}
                      </button>
                      {line.speaker && (
                        <span className="font-semibold text-[#0f172a]">{line.speaker}:</span>
                      )}
                      <span className="text-[#334155]">{line.text}</span>
                    </div>
                    {line.vietnamese && (
                      <p className="text-[11px] text-[#64748b] pl-10 italic">{line.vietnamese}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Exercises Tabs (MCQ & Dictation) */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-5">
            <div className="flex items-center gap-1.5 border-b border-[#f1f5f9] pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('mcq')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'mcq'
                    ? 'bg-blue-50 text-[#0650cc] font-semibold'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                <span className="material-symbols-outlined text-base">quiz</span>
                Trắc nghiệm nghe hiểu ({questionsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dictation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dictation'
                    ? 'bg-blue-50 text-[#0650cc] font-semibold'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Chép chính tả ({blanksList.length})
              </button>
            </div>

            {/* TAB 1: MCQ */}
            {activeTab === 'mcq' && (
              <div className="space-y-5">
                {questionsList.map((q, qIdx) => {
                  const chosen = mcqAnswers[q.id];
                  return (
                    <div key={q.id} className="space-y-2.5">
                      <div className="text-xs sm:text-sm font-semibold text-[#0f172a] flex items-start gap-2">
                        <span className="w-5 h-5 rounded bg-blue-50 text-[#0650cc] text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          {qIdx + 1}
                        </span>
                        <span>{q.question}</span>
                      </div>

                      <div className="space-y-1.5 pl-7">
                        {q.options.map((opt, optIdx) => {
                          const isChosen = chosen === optIdx;
                          const isCorrect = q.correctAnswer === optIdx;
                          let style = 'border-[#e2e8f0] hover:border-[#0650cc] text-[#0f172a]';
                          if (isSubmitted) {
                            if (isCorrect) {
                              style = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold';
                            } else if (isChosen && !isCorrect) {
                              style = 'border-red-500 bg-red-50 text-red-800 font-semibold';
                            } else {
                              style = 'border-slate-200 bg-slate-50 opacity-60 text-slate-500';
                            }
                          } else if (isChosen) {
                            style = 'border-[#0650cc] bg-blue-50 text-[#0650cc] font-semibold';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() =>
                                setMcqAnswers({
                                  ...mcqAnswers,
                                  [q.id]: optIdx,
                                })
                              }
                              className={`w-full p-2.5 rounded-lg border text-xs text-left transition-all flex items-center justify-between cursor-pointer ${style}`}
                            >
                              <span>{opt}</span>
                              {isSubmitted && isCorrect && (
                                <span className="material-symbols-outlined text-emerald-600 text-sm">
                                  check_circle
                                </span>
                              )}
                              {isSubmitted && isChosen && !isCorrect && (
                                <span className="material-symbols-outlined text-red-600 text-sm">
                                  cancel
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {isSubmitted && q.explanation && (
                        <div className="ml-7 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-[#0650cc] leading-relaxed">
                          <strong>Giải thích:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: DICTATION FILL-IN-THE-BLANK */}
            {activeTab === 'dictation' && (
              <div className="space-y-3.5">
                <p className="text-xs text-[#64748b]">
                  Lắng nghe đoạn audio và điền từ thích hợp vào các ô bên dưới:
                </p>

                <div className="space-y-3">
                  {blanksList.map((b, bIdx) => {
                    const userVal = dictationAnswers[String(b.id)] || '';
                    const isCorrect = userVal.trim().toLowerCase() === b.targetWord.toLowerCase();
                    return (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-[#0f172a]">
                          <span>Câu #{bIdx + 1}</span>
                          {b.hint && (
                            <span className="text-[11px] text-[#64748b] font-normal">
                              Gợi ý: {b.hint}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#334155] leading-relaxed">
                          {b.sentence}
                        </p>
                        <div className="flex items-center gap-2.5 pt-0.5">
                          <input
                            type="text"
                            disabled={isSubmitted}
                            value={userVal}
                            onChange={(e) =>
                              setDictationAnswers({
                                ...dictationAnswers,
                                [b.id]: e.target.value,
                              })
                            }
                            placeholder="Nhập từ bạn nghe được..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-xs text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
                          />
                          {isSubmitted && (
                            <span
                              className={`text-xs font-semibold shrink-0 ${
                                isCorrect ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {isCorrect ? '✓ Đúng' : `✗ Đáp án: ${b.targetWord}`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submission, Scoring, & Retry Card */}
            <div className="pt-3.5 border-t border-[#f1f5f9] flex flex-col sm:flex-row items-center justify-between gap-3">
              {scoreResult ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    {scoreResult.score}/{scoreResult.maxScore}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      Điểm: {scoreResult.scorePercent}% ({scoreResult.score}/{scoreResult.maxScore} câu đúng)
                    </div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">{scoreResult.feedback}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#64748b]">
                  Làm bài tập trắc nghiệm hoặc điền khuyết trước khi nộp.
                </div>
              )}

              <div className="flex items-center gap-2">
                {isSubmitted && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-3.5 py-1.5 rounded-lg border border-[#cbd5e1] text-xs font-medium text-[#0f172a] hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    Làm lại
                  </button>
                )}
                <button
                  type="button"
                  disabled={isSubmitted || isSubmitting}
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded-lg bg-[#0650cc] text-white text-xs font-medium hover:bg-[#003ea8] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang chấm...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check</span>
                      Nộp bài
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Other Listening Exercises & Key Vocab */}
        <div className="lg:col-span-5 space-y-6">
          {/* List of Available Listening Exercises */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-[#0f172a] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0650cc] text-base">queue_music</span>
                Danh sách bài luyện nghe ({exercises.length})
              </h3>
              <span className="text-[11px] text-[#64748b]">Chọn bài để học</span>
            </div>

            <div className="space-y-2">
              {exercises.map((ex) => {
                const isCur = ex.id === selectedExercise.id;
                return (
                  <div
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isCur
                        ? 'border-[#0650cc] bg-blue-50/50'
                        : 'border-[#e2e8f0] hover:border-blue-200 hover:bg-[#f8fafc]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-[#0f172a] flex items-center gap-1.5">
                        {isCur && <span className="w-1.5 h-1.5 rounded-full bg-[#0650cc]" />}
                        {ex.title}
                      </div>
                      <div className="text-[11px] text-[#64748b] flex items-center gap-2">
                        <span>{ex.topic || 'Business & Tech'}</span>
                        <span>•</span>
                        <span className="font-mono">{ex.duration}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right space-y-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#0650cc] inline-block">
                        {ex.level || 'B1+'}
                      </span>
                      {(ex as any).isCompleted && (
                        <div>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-block">
                            ✓ Đã nộp {(ex as any).lastScorePercent}%
                          </span>
                        </div>
                      )}
                      {isCur && isPlaying && (
                        <div>
                          <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                            Đang phát
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Vocabulary in this Audio */}
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0650cc] text-base">translate</span>
              <h3 className="font-bold text-xs sm:text-sm text-[#0f172a]">Từ vựng trong bài</h3>
            </div>

            <div className="space-y-2">
              {keyVocabList.slice(0, 4).map((vocab, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0650cc]">{vocab.word}</span>
                    <span className="text-[11px] font-mono text-[#64748b]">
                      {vocab.phonetic} {vocab.partOfSpeech && `• ${vocab.partOfSpeech}`}
                    </span>
                  </div>
                  <p className="text-xs text-[#334155]">{vocab.meaning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collocation & Pronunciation Insights */}
          {selectedExercise.insights && (
            <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-base">tips_and_updates</span>
                <h3 className="font-bold text-xs sm:text-sm text-[#0f172a]">Lưu ý ngữ pháp & phát âm</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 space-y-0.5">
                  <div className="font-semibold text-amber-900">{selectedExercise.insights.structure}</div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {selectedExercise.insights.structureExplanation}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/80 space-y-0.5">
                  <div className="font-semibold text-blue-900">{selectedExercise.insights.pronunciation}</div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    {selectedExercise.insights.pronunciationExplanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
