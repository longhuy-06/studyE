import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { VocabularyItem } from '../types';
import { api } from '../services/api';

interface VocabularyPageProps {
  onNavigate?: (path: string) => void;
}

interface QuizAnswerRecord {
  vocabId: string;
  word: string;
  phonetic: string;
  vietnameseMeaning: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export const VocabularyPage: React.FC<VocabularyPageProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'flashcard' | 'quiz' | 'list'>('flashcard');

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSupported] = useState<boolean>(typeof window !== 'undefined' && 'speechSynthesis' in window);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<VocabularyItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizRecords, setQuizRecords] = useState<QuizAnswerRecord[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Search & Filter (List view)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [filterBookmarkedOnly, setFilterBookmarkedOnly] = useState(false);

  // Add Word Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newPartOfSpeech, setNewPartOfSpeech] = useState('n.');
  const [newCefr, setNewCefr] = useState('B1');
  const [newTopic, setNewTopic] = useState('Từ vựng cá nhân');
  const [newExampleEn, setNewExampleEn] = useState('');
  const [newExampleVi, setNewExampleVi] = useState('');
  const [isSubmittingNewWord, setIsSubmittingNewWord] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  }, []);

  const handleCreateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) {
      showToast('Vui lòng nhập từ vựng và nghĩa tiếng Việt.', 'error');
      return;
    }
    setIsSubmittingNewWord(true);
    try {
      const res = await api.addVocabulary({
        word: newWord.trim(),
        vietnameseMeaning: newMeaning.trim(),
        phonetic: newPhonetic.trim(),
        partOfSpeech: newPartOfSpeech,
        cefrLevel: newCefr,
        topic: newTopic.trim() || 'Từ vựng cá nhân',
        exampleEn: newExampleEn.trim(),
        exampleVi: newExampleVi.trim(),
      });
      setItems((prev) => [res.item, ...prev]);
      setShowAddModal(false);
      setNewWord('');
      setNewMeaning('');
      setNewPhonetic('');
      setNewExampleEn('');
      setNewExampleVi('');
      showToast(`Đã thêm từ "${res.item.word}" vào database thành công!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể thêm từ vựng vào database.', 'error');
    } finally {
      setIsSubmittingNewWord(false);
    }
  };

  const handleDeleteWord = async (vocabId: string, wordStr: string) => {
    if (!confirm(`Bạn có chắc muốn xóa từ "${wordStr}" khỏi database không?`)) return;
    try {
      await api.deleteVocabulary(vocabId);
      setItems((prev) => prev.filter((it) => it.id !== vocabId));
      showToast(`Đã xóa từ "${wordStr}" khỏi database.`, 'success');
    } catch (err: any) {
      showToast('Không thể xóa từ vựng.', 'error');
    }
  };

  const loadVocab = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVocabulary();
      const list = data.items || [];
      setItems(list);
      // Initialize quiz questions
      if (list.length > 0) {
        setQuizQuestions([...list]);
      }
    } catch (err: any) {
      console.error('Failed to load vocabulary:', err);
      setError(err.message || 'Không thể tải kho từ vựng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVocab();
  }, [loadVocab]);

  // Audio playback using SpeechSynthesis with fallback handling
  const playAudio = useCallback((text: string) => {
    if (!text || !text.trim()) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      showToast('Trình duyệt hiện không hỗ trợ phát âm tự động.', 'info');
    }
  }, [showToast]);

  // Toggle Bookmark for Review
  const handleToggleBookmark = async (vocabId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.toggleVocabBookmark(vocabId);
      setItems((prev) =>
        prev.map((it) => (it.id === vocabId ? { ...it, isFavorite: res.isFavorite } : it))
      );
      showToast(
        res.isFavorite
          ? 'Đã thêm từ vào danh sách cần ôn tập!'
          : 'Đã bỏ đánh dấu ôn tập cho từ này.',
        'success'
      );
    } catch (err: any) {
      console.error('Error toggling bookmark:', err);
      showToast('Không thể cập nhật trạng thái ôn tập. Vui lòng thử lại.', 'error');
    }
  };

  // SRS Rating response on Flashcard
  const handleSRSReview = async (quality: number) => {
    const currentWord = items[cardIndex];
    if (!currentWord) return;

    try {
      const res = await api.reviewVocabularySRS(currentWord.id, quality);
      // Update local state
      setItems((prev) =>
        prev.map((it) =>
          it.id === currentWord.id
            ? {
                ...it,
                srsLevel: res.progress?.srsLevel || quality,
                status: quality >= 3 ? 'mastered' : 'review',
                nextReviewText: res.progress?.nextReviewText || (quality >= 3 ? 'Ôn sau 4 ngày' : 'Ôn lại hôm nay'),
              }
            : it
        )
      );

      const toastMsg =
        quality >= 3
          ? '🎉 Đã ghi nhớ tốt! Hệ thống xếp lịch củng cố sau vài ngày.'
          : '📌 Đã ghi nhận từ khó. Hệ thống sẽ ưu tiên ôn lại sớm.';
      showToast(toastMsg, 'success');

      // Advance card
      setIsFlipped(false);
      if (cardIndex < items.length - 1) {
        setCardIndex(cardIndex + 1);
      } else {
        setCardIndex(0);
      }
    } catch (err: any) {
      console.error('Error recording SRS progress:', err);
      showToast('Có lỗi xảy ra khi lưu tiến độ ôn từ.', 'error');
    }
  };

  // Keyboard navigation for Flashcard
  useEffect(() => {
    if (mode !== 'flashcard' || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsFlipped(false);
        setCardIndex((i) => (i < items.length - 1 ? i + 1 : 0));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsFlipped(false);
        setCardIndex((i) => (i > 0 ? i - 1 : items.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, items.length]);

  // Quiz: Current Question & Options
  const currentQuizItem = quizQuestions[quizIndex];

  const quizOptions = useMemo(() => {
    if (!currentQuizItem || items.length === 0) return [];
    const correctMeaning = currentQuizItem.vietnameseMeaning;

    // Pick 3 distractors from other items
    const otherMeanings = items
      .filter((it) => it.id !== currentQuizItem.id && it.vietnameseMeaning !== correctMeaning)
      .map((it) => it.vietnameseMeaning);

    // Shuffle and pick up to 3 distractors
    const shuffledOthers = [...otherMeanings].sort(() => 0.5 - Math.random()).slice(0, 3);
    const combined = [correctMeaning, ...shuffledOthers];

    // Deterministic shuffle based on question ID
    return combined.sort();
  }, [currentQuizItem, items]);

  const handleSelectQuizOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleCheckQuizAnswer = () => {
    if (!selectedOption || !currentQuizItem || isSubmitted) return;
    const isCorrect = selectedOption === currentQuizItem.vietnameseMeaning;
    setIsSubmitted(true);

    // Play pronunciation on answer check
    playAudio(currentQuizItem.word);

    // Add or update record
    const newRecord: QuizAnswerRecord = {
      vocabId: currentQuizItem.id,
      word: currentQuizItem.word,
      phonetic: currentQuizItem.phonetic,
      vietnameseMeaning: currentQuizItem.vietnameseMeaning,
      selectedAnswer: selectedOption,
      isCorrect,
    };

    setQuizRecords((prev) => {
      const filtered = prev.filter((r) => r.vocabId !== currentQuizItem.id);
      return [...filtered, newRecord];
    });
  };

  const handleRetryCurrentQuestion = () => {
    setIsSubmitted(false);
    setSelectedOption(null);
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(quizIndex + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsQuizCompleted(true);
    setQuizSubmitting(true);

    const score = quizRecords.filter((r) => r.isCorrect).length;
    const total = quizQuestions.length;

    try {
      await api.submitVocabQuiz({
        score,
        total,
        results: quizRecords.map((r) => ({ vocabId: r.vocabId, isCorrect: r.isCorrect })),
      });
      showToast('Đã lưu kết quả bài kiểm tra và cập nhật tiến độ học tập!', 'success');
    } catch (err: any) {
      console.error('Failed to submit quiz results:', err);
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleRestartQuiz = (retryIncorrectOnly = false) => {
    if (retryIncorrectOnly) {
      const incorrectIds = quizRecords.filter((r) => !r.isCorrect).map((r) => r.vocabId);
      const filtered = items.filter((it) => incorrectIds.includes(it.id));
      if (filtered.length > 0) {
        setQuizQuestions(filtered);
        setQuizIndex(0);
        setSelectedOption(null);
        setIsSubmitted(false);
        setIsQuizCompleted(false);
        setQuizRecords([]);
        return;
      }
    }

    setQuizQuestions([...items]);
    setQuizIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsQuizCompleted(false);
    setQuizRecords([]);
  };

  // Filtered Items for Notebook / List mode
  const filteredList = useMemo(() => {
    return items.filter((it) => {
      const matchSearch =
        it.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.vietnameseMeaning.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTopic = selectedTopic === 'All' || it.topic === selectedTopic;
      const matchBookmark = !filterBookmarkedOnly || it.isFavorite;
      return matchSearch && matchTopic && matchBookmark;
    });
  }, [items, searchTerm, selectedTopic, filterBookmarkedOnly]);

  const topicsList = useMemo(() => {
    return ['All', ...Array.from(new Set(items.map((it) => it.topic).filter(Boolean)))];
  }, [items]);

  const currentFlashcard = items[cardIndex];

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] space-y-4">
        <div className="w-12 h-12 border-4 border-[#0650cc] border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-bold text-[#1b1b1f]">Đang tải kho từ vựng Spaced Repetition...</p>
          <p className="text-xs text-[#74777f] mt-1">Đồng bộ lộ trình học tập và trạng thái ôn tập cá nhân</p>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error && items.length === 0) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-3xl border border-red-200 text-center space-y-4 shadow-sm my-12">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1b1b1f]">Không thể tải từ vựng</h3>
          <p className="text-xs text-[#74777f] mt-1">{error}</p>
        </div>
        <button
          onClick={loadVocab}
          className="px-6 py-2.5 bg-[#0650cc] hover:bg-[#003ea8] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-3xl border border-[#e1e2ec] text-center space-y-4 shadow-sm my-12">
        <div className="w-14 h-14 bg-blue-50 text-[#0650cc] rounded-2xl flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">school</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1b1b1f]">Chưa có từ vựng nào</h3>
          <p className="text-xs text-[#74777f] mt-1">
            Kho từ vựng đang được chuẩn bị. Vui lòng nhấn làm mới để cập nhật dữ liệu.
          </p>
        </div>
        <button
          onClick={loadVocab}
          className="px-6 py-2.5 bg-[#0650cc] hover:bg-[#003ea8] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm"
        >
          Làm mới dữ liệu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl text-xs font-semibold shadow-xl border flex items-center gap-2.5 transition-all transform animate-bounce-subtle ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-500/10'
              : feedbackToast.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200 shadow-red-500/10'
              : 'bg-blue-50 text-blue-900 border-blue-200 shadow-blue-500/10'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {feedbackToast.type === 'success'
              ? 'check_circle'
              : feedbackToast.type === 'error'
              ? 'error'
              : 'info'}
          </span>
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-[#e2e8f0] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            Học từ vựng
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Ôn tập từ vựng theo phương pháp lặp lại ngắt quãng (SRS), ngữ cảnh thực tế và trắc nghiệm phản xạ.
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-lg self-start md:self-auto border border-[#e2e8f0]">
          <button
            onClick={() => {
              setMode('flashcard');
              setIsFlipped(false);
            }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'flashcard'
                ? 'bg-white text-[#0650cc] font-semibold shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <span className="material-symbols-outlined text-base">style</span>
            <span>Flashcard (SRS)</span>
          </button>
          <button
            onClick={() => {
              setMode('quiz');
              setIsQuizCompleted(false);
            }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'quiz'
                ? 'bg-white text-[#0650cc] font-semibold shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <span className="material-symbols-outlined text-base">quiz</span>
            <span>Trắc nghiệm</span>
          </button>
          <button
            onClick={() => setMode('list')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'list'
                ? 'bg-white text-[#0650cc] font-semibold shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <span className="material-symbols-outlined text-base">menu_book</span>
            <span>Danh sách từ ({items.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODE 1: INTERACTIVE FLASHCARD SRS
         ========================================================================= */}
      {mode === 'flashcard' && currentFlashcard && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Card Meta & Deck Progress */}
          <div className="flex items-center justify-between text-xs font-semibold text-[#74777f] px-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1b1b1f]">
                Thẻ {cardIndex + 1} / {items.length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-[#0650cc] font-bold">
                {currentFlashcard.topic}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                {currentFlashcard.cefrLevel}
              </span>
              {currentFlashcard.status === 'mastered' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-[#0650cc]">
                  Đã thuộc lòng
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#f1f3ff] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0650cc] h-full transition-all duration-300"
              style={{ width: `${Math.round(((cardIndex + 1) / items.length) * 100)}%` }}
            />
          </div>

          {/* Interactive Flashcard */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[400px] bg-white rounded-xl border border-[#e2e8f0] hover:border-[#0650cc] shadow-xs p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-colors relative select-none"
          >
            {/* Top Card Controls */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  {isFlipped ? 'visibility' : 'touch_app'}
                </span>
                {isFlipped ? 'Mặt sau: Nghĩa & Ngữ cảnh' : 'Nhấn để lật thẻ (hoặc phím Space)'}
              </span>

              <div className="flex items-center gap-2">
                {/* Audio Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentFlashcard.word);
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-blue-50 hover:bg-blue-100 text-[#0650cc]'
                  }`}
                  title="Nghe phát âm chuẩn (US)"
                >
                  <span className="material-symbols-outlined text-lg">volume_up</span>
                </button>

                {/* Mark for Review / Bookmark Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleBookmark(currentFlashcard.id, e)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    currentFlashcard.isFavorite
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                  }`}
                  title={currentFlashcard.isFavorite ? 'Đã đánh dấu ôn tập' : 'Đánh dấu cần ôn tập'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {currentFlashcard.isFavorite ? 'bookmark' : 'bookmark_border'}
                  </span>
                </button>
              </div>
            </div>

            {/* Front of Card */}
            {!isFlipped ? (
              <div className="text-center py-8 space-y-3 my-auto">
                <div className="inline-block text-xs font-semibold text-[#0650cc] bg-blue-50 px-2.5 py-0.5 rounded">
                  {currentFlashcard.partOfSpeech}
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a] tracking-tight">
                  {currentFlashcard.word}
                </h2>
                <p className="text-base text-[#64748b] font-mono">{currentFlashcard.phonetic}</p>
                {currentFlashcard.frequency && (
                  <p className="text-xs text-[#94a3b8]">{currentFlashcard.frequency}</p>
                )}
                <div className="pt-4 text-xs text-[#94a3b8] flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">flip</span>
                  Nhấp vào thẻ để xem nghĩa tiếng Việt & ví dụ
                </div>
              </div>
            ) : (
              /* Back of Card */
              <div className="py-4 space-y-4 my-auto">
                <div>
                  <span className="text-[11px] font-semibold text-[#0650cc] uppercase tracking-wider">
                    Định nghĩa tiếng Việt
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] mt-0.5">
                    {currentFlashcard.vietnameseMeaning}
                  </h3>
                </div>

                {/* Example sentence & Vietnamese translation */}
                <div className="p-3.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#64748b]">
                    <span className="font-medium">Ví dụ thực tế:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(currentFlashcard.exampleEn || currentFlashcard.exampleSentence || '');
                      }}
                      className="text-[#0650cc] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">volume_up</span>
                      Nghe câu
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#0f172a] italic">
                    "{currentFlashcard.exampleEn || currentFlashcard.exampleSentence || ''}"
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {currentFlashcard.exampleVi || currentFlashcard.exampleTranslation || ''}
                  </p>
                </div>

                {/* Collocations if available */}
                {currentFlashcard.collocations && currentFlashcard.collocations.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-[#64748b]">Cụm từ thường gặp:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {currentFlashcard.collocations.slice(0, 3).map((col, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded bg-blue-50 text-[#0650cc] font-medium"
                        >
                          {typeof col === 'string' ? col : col.phrase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Study Tip */}
                {currentFlashcard.aiTip && (
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">lightbulb</span>
                    <p className="leading-relaxed">{currentFlashcard.aiTip}</p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Card Navigation */}
            <div className="flex items-center justify-between pt-3 border-t border-[#f1f5f9]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  setCardIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
                }}
                className="text-xs font-medium text-[#64748b] hover:text-[#0f172a] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Từ trước
              </button>

              <span className="text-[11px] text-[#94a3b8] hidden sm:inline">
                Phím mũi tên ← → để chuyển từ
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  setCardIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
                }}
                className="text-xs font-medium text-[#64748b] hover:text-[#0f172a] flex items-center gap-1 cursor-pointer transition-colors"
              >
                Từ sau
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Spaced Repetition (SRS) Review Rating Buttons */}
          <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs text-center space-y-2.5">
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
              Đánh giá mức độ ghi nhớ
            </h4>
            <p className="text-xs text-[#64748b]">
              Hệ thống sẽ tự động xếp lịch ôn tập phù hợp theo chu kỳ nhớ của bạn.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <button
                onClick={() => handleSRSReview(1)}
                className="p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-0.5"
              >
                <span>Chưa nhớ</span>
                <span className="text-[10px] font-normal text-red-600">Ôn lại hôm nay</span>
              </button>
              <button
                onClick={() => handleSRSReview(2)}
                className="p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-0.5"
              >
                <span>Khó nhớ</span>
                <span className="text-[10px] font-normal text-amber-600">Ôn ngày mai</span>
              </button>
              <button
                onClick={() => handleSRSReview(3)}
                className="p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-0.5"
              >
                <span>Đã nhớ</span>
                <span className="text-[10px] font-normal text-blue-600">Ôn sau 3 ngày</span>
              </button>
              <button
                onClick={() => handleSRSReview(4)}
                className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer flex flex-col items-center gap-0.5"
              >
                <span>Thành thạo</span>
                <span className="text-[10px] font-normal text-emerald-600">Ôn sau 7 ngày</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: MULTIPLE-CHOICE QUIZ (TRẮC NGHIỆM PHẢN XẠ)
         ========================================================================= */}
      {mode === 'quiz' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {!isQuizCompleted && currentQuizItem ? (
            <div className="bg-white p-6 sm:p-7 rounded-xl border border-[#e2e8f0] shadow-xs space-y-5">
              {/* Progress & Header */}
              <div className="flex items-center justify-between text-xs font-semibold text-[#64748b]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0f172a]">
                    Câu hỏi {quizIndex + 1} / {quizQuestions.length}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#0650cc] font-semibold">
                    {currentQuizItem.topic}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                    Đúng: {quizRecords.filter((r) => r.isCorrect).length} câu
                  </span>
                  {/* Bookmark Button in Quiz */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleBookmark(currentQuizItem.id, e)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      currentQuizItem.isFavorite
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title="Đánh dấu từ này để ôn tập"
                  >
                    <span className="material-symbols-outlined text-base">
                      {currentQuizItem.isFavorite ? 'bookmark' : 'bookmark_border'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Quiz Progress Bar */}
              <div className="w-full bg-[#f1f5f9] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0650cc] h-full transition-all duration-300"
                  style={{
                    width: `${Math.round(((quizIndex + 1) / quizQuestions.length) * 100)}%`,
                  }}
                />
              </div>

              {/* Target Word Display */}
              <div className="text-center py-4 space-y-1.5 bg-[#f8fafc] p-5 rounded-lg border border-[#e2e8f0]">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Chọn nghĩa tiếng Việt của từ:
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
                  {currentQuizItem.word}
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs text-[#64748b] font-mono">
                  <span>{currentQuizItem.phonetic}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#0650cc] font-sans font-semibold">
                    {currentQuizItem.partOfSpeech}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playAudio(currentQuizItem.word)}
                  className="inline-flex items-center gap-1 text-xs text-[#0650cc] font-medium hover:underline mt-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">volume_up</span>
                  Phát âm
                </button>
              </div>

              {/* Answer Options */}
              <div className="space-y-2">
                {quizOptions.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQuizItem.vietnameseMeaning;

                  let cardStyle =
                    'border-[#e2e8f0] hover:border-[#0650cc] hover:bg-blue-50/20 text-[#0f172a]';

                  if (isSubmitted) {
                    if (isCorrect) {
                      cardStyle =
                        'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      cardStyle = 'border-red-500 bg-red-50 text-red-950 font-semibold';
                    } else {
                      cardStyle = 'border-slate-200 bg-slate-50 opacity-60 text-slate-500';
                    }
                  } else if (isSelected) {
                    cardStyle =
                      'border-[#0650cc] bg-blue-50 text-[#0650cc] font-semibold';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelectQuizOption(option)}
                      className={`w-full p-3.5 rounded-lg border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${cardStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${
                            isSubmitted && isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isSubmitted && isSelected && !isCorrect
                              ? 'bg-red-600 text-white'
                              : isSelected
                              ? 'bg-[#0650cc] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-snug">{option}</span>
                      </div>

                      {isSubmitted && isCorrect && (
                        <span className="material-symbols-outlined text-emerald-600 text-lg">
                          check_circle
                        </span>
                      )}
                      {isSubmitted && isSelected && !isCorrect && (
                        <span className="material-symbols-outlined text-red-600 text-lg">
                          cancel
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Area upon submission */}
              {isSubmitted && (
                <div
                  className={`p-3.5 rounded-lg border text-xs ${
                    selectedOption === currentQuizItem.vietnameseMeaning
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`material-symbols-outlined text-lg mt-0.5 ${
                        selectedOption === currentQuizItem.vietnameseMeaning
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {selectedOption === currentQuizItem.vietnameseMeaning
                        ? 'check_circle'
                        : 'cancel'}
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs">
                        {selectedOption === currentQuizItem.vietnameseMeaning
                          ? 'Đáp án chính xác'
                          : 'Chưa chính xác'}
                      </p>
                      <p className="text-xs">
                        Nghĩa đúng của <strong className="font-semibold">{currentQuizItem.word}</strong>: {currentQuizItem.vietnameseMeaning}
                      </p>
                      {currentQuizItem.exampleEn && (
                        <p className="text-[11px] text-slate-600 italic pt-0.5">
                          "{currentQuizItem.exampleEn}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between gap-3">
                {isSubmitted && selectedOption !== currentQuizItem.vietnameseMeaning ? (
                  <button
                    type="button"
                    onClick={handleRetryCurrentQuestion}
                    className="px-3.5 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">replay</span>
                    Thử lại câu này
                  </button>
                ) : (
                  <span className="text-xs text-[#64748b]">
                    {isSubmitted ? 'Nhấn câu tiếp theo để chuyển tiếp' : 'Chọn đáp án và kiểm tra'}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {!isSubmitted ? (
                    <button
                      type="button"
                      disabled={!selectedOption}
                      onClick={handleCheckQuizAnswer}
                      className="px-5 py-2 rounded-lg bg-[#0650cc] hover:bg-[#003ea8] text-white text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Kiểm tra đáp án
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuizQuestion}
                      className="px-5 py-2 rounded-lg bg-[#0650cc] hover:bg-[#003ea8] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {quizIndex < quizQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                      </span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Quiz Completion Summary */
            <div className="bg-white p-6 sm:p-7 rounded-xl border border-[#e2e8f0] shadow-xs space-y-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0650cc] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0650cc]">
                  Kết quả bài luyện
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mt-1">
                  Đã hoàn thành bài trắc nghiệm
                </h2>
                <p className="text-xs text-[#64748b] mt-1">
                  Kết quả đã được cập nhật vào tiến độ học tập của bạn.
                </p>
              </div>

              {/* Score Display Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                <div className="p-3 bg-white rounded-md border border-[#e2e8f0]">
                  <span className="text-[11px] text-[#64748b] font-medium">Số câu đúng</span>
                  <div className="text-xl font-bold text-[#0650cc] mt-0.5">
                    {quizRecords.filter((r) => r.isCorrect).length} / {quizQuestions.length}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-md border border-[#e2e8f0]">
                  <span className="text-[11px] text-[#64748b] font-medium">Độ chính xác</span>
                  <div className="text-xl font-bold text-emerald-600 mt-0.5">
                    {quizQuestions.length > 0
                      ? Math.round(
                          (quizRecords.filter((r) => r.isCorrect).length / quizQuestions.length) * 100
                        )
                      : 0}
                    %
                  </div>
                </div>
                <div className="p-3 bg-white rounded-md border border-[#e2e8f0] col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-[#64748b] font-medium">Đánh giá</span>
                  <div className="text-xs font-semibold text-[#0f172a] mt-2">
                    {quizRecords.filter((r) => r.isCorrect).length >= quizQuestions.length * 0.8
                      ? 'Nắm vững từ vựng'
                      : quizRecords.filter((r) => r.isCorrect).length >= quizQuestions.length * 0.5
                      ? 'Đạt yêu cầu'
                      : 'Nên ôn tập lại'}
                  </div>
                </div>
              </div>

              {/* Breakdown of Words */}
              <div className="text-left space-y-2">
                <h4 className="text-xs font-semibold text-[#0f172a]">
                  Chi tiết các từ trong bài:
                </h4>
                <div className="divide-y divide-[#f1f5f9] max-h-56 overflow-y-auto border border-[#e2e8f0] rounded-lg p-1 bg-white">
                  {quizRecords.map((rec) => (
                    <div
                      key={rec.vocabId}
                      className="p-2.5 flex items-center justify-between text-xs hover:bg-[#f8fafc]"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#0f172a]">{rec.word}</span>
                          <span className="text-[10px] text-[#64748b] font-mono">{rec.phonetic}</span>
                        </div>
                        <p className="text-[11px] text-[#64748b]">{rec.vietnameseMeaning}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            rec.isCorrect
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {rec.isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(rec.vocabId)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                          title="Đánh dấu ôn tập"
                        >
                          <span className="material-symbols-outlined text-xs">bookmark</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {quizRecords.some((r) => !r.isCorrect) && (
                  <button
                    onClick={() => handleRestartQuiz(true)}
                    className="px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">replay</span>
                    Ôn từ chưa đúng ({quizRecords.filter((r) => !r.isCorrect).length})
                  </button>
                )}

                <button
                  onClick={() => handleRestartQuiz(false)}
                  className="px-4 py-2 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-[#0f172a] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Làm lại bài
                </button>

                <button
                  onClick={() => {
                    setMode('flashcard');
                    setIsFlipped(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#0650cc] hover:bg-[#003ea8] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">style</span>
                  Học Flashcards
                </button>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('/dashboard')}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0f172a] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    Bảng điều khiển
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODE 3: VOCABULARY NOTEBOOK / SỔ TỪ VỰNG
         ========================================================================= */}
      {mode === 'list' && (
        <div className="space-y-4">
          {/* Search, Topic Filters & Bookmark toggle */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-lg">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm từ vựng hoặc nghĩa tiếng Việt..."
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#e2e8f0] bg-white text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
              />
            </div>

            {/* Filter by Bookmarked Only */}
            <button
              type="button"
              onClick={() => setFilterBookmarkedOnly(!filterBookmarkedOnly)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                filterBookmarkedOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-base text-amber-600">
                {filterBookmarkedOnly ? 'bookmark' : 'bookmark_border'}
              </span>
              <span>Đã đánh dấu ({items.filter((i) => i.isFavorite).length})</span>
            </button>

            {/* Topic Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {topicsList.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                    selectedTopic === topic
                      ? 'bg-[#0650cc] border-[#0650cc] text-white shadow-xs'
                      : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-slate-50'
                  }`}
                >
                  {topic === 'All' ? 'Tất cả chủ đề' : topic}
                </button>
              ))}
            </div>

            {/* Add New Word Button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-[#0650cc] hover:bg-[#003ea8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Thêm từ mới</span>
            </button>
          </div>

          {/* Vocabulary List Container */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-xs">
            {filteredList.length === 0 ? (
              <div className="p-10 text-center text-[#64748b] space-y-2">
                <span className="material-symbols-outlined text-3xl text-slate-300">search_off</span>
                <p className="text-xs">Không tìm thấy từ vựng phù hợp với bộ lọc.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTopic('All');
                    setFilterBookmarkedOnly(false);
                  }}
                  className="text-xs text-[#0650cc] hover:underline font-medium"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {filteredList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-[#f8fafc] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-[#0f172a]">{item.word}</h4>
                        <span className="text-xs text-[#64748b] font-mono">{item.phonetic}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-[#0650cc]">
                          {item.partOfSpeech}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {item.cefrLevel}
                        </span>
                        {item.status === 'mastered' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-[#0650cc]">
                            Đã nhớ
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-[#0650cc]">{item.vietnameseMeaning}</p>

                      <div className="text-xs text-[#64748b] space-y-0.5">
                        <p className="italic">"{item.exampleEn || item.exampleSentence || 'No example sentence'}"</p>
                        <p className="text-[#94a3b8]">
                          {item.exampleVi || item.exampleTranslation || ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {/* Audio Button */}
                      <button
                        type="button"
                        onClick={() => playAudio(item.word)}
                        className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0650cc] flex items-center justify-center transition-colors cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <span className="material-symbols-outlined text-base">volume_up</span>
                      </button>

                      {/* Bookmark Toggle */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleBookmark(item.id, e)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          item.isFavorite
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                        }`}
                        title={item.isFavorite ? 'Bỏ đánh dấu ôn tập' : 'Đánh dấu cần ôn tập'}
                      >
                        <span className="material-symbols-outlined text-base">
                          {item.isFavorite ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>

                      <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-[#f1f5f9] text-[#64748b]">
                        {item.topic}
                      </span>

                      {/* Delete Word from DB */}
                      <button
                        type="button"
                        onClick={() => handleDeleteWord(item.id, item.word)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                        title="Xóa từ khỏi database"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD NEW WORD MODAL
         ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0650cc]">add_circle</span>
                <h3 className="text-base font-bold text-[#0f172a]">Thêm từ vựng vào Database</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateWord} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                    Từ tiếng Anh *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="e.g. Breakthrough"
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                    Phiên âm IPA
                  </label>
                  <input
                    type="text"
                    value={newPhonetic}
                    onChange={(e) => setNewPhonetic(e.target.value)}
                    placeholder="e.g. /ˈbreɪkθruː/"
                    className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                  Nghĩa tiếng Việt *
                </label>
                <input
                  type="text"
                  required
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  placeholder="e.g. Bước đột phá, phát kiến quan trọng"
                  className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                    Từ loại
                  </label>
                  <select
                    value={newPartOfSpeech}
                    onChange={(e) => setNewPartOfSpeech(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#cbd5e1] text-xs focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
                  >
                    <option value="n.">Danh từ (n.)</option>
                    <option value="v.">Động từ (v.)</option>
                    <option value="adj.">Tính từ (adj.)</option>
                    <option value="adv.">Trạng từ (adv.)</option>
                    <option value="idiom">Thành ngữ (idiom)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                    Trình độ CEFR
                  </label>
                  <select
                    value={newCefr}
                    onChange={(e) => setNewCefr(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#cbd5e1] text-xs focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                    Chủ đề
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Chủ đề"
                    className="w-full px-2.5 py-2 rounded-lg border border-[#cbd5e1] text-xs focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                  Ví dụ câu tiếng Anh
                </label>
                <input
                  type="text"
                  value={newExampleEn}
                  onChange={(e) => setNewExampleEn(e.target.value)}
                  placeholder="e.g. This technology represents a major breakthrough in artificial intelligence."
                  className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                  Dịch nghĩa câu ví dụ
                </label>
                <input
                  type="text"
                  value={newExampleVi}
                  onChange={(e) => setNewExampleVi(e.target.value)}
                  placeholder="e.g. Công nghệ này đại diện cho một bước đột phá lớn trong trí tuệ nhân tạo."
                  className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] text-xs focus:outline-none focus:ring-1 focus:ring-[#0650cc]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewWord}
                  className="px-5 py-2 rounded-lg bg-[#0650cc] hover:bg-[#003ea8] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingNewWord ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Lưu vào Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
