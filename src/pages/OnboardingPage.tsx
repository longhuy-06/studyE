import React, { useState, useEffect } from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { api } from '../services/api';
import { User, LearningProfile } from '../types';

interface OnboardingPageProps {
  onNavigate: (path: string) => void;
  user: User | null;
  profile?: LearningProfile | null;
  onProfileUpdated: (profile: LearningProfile) => void;
}

interface CefrLevel {
  code: string;
  title: string;
  cefrLabel: string;
  desc: string;
  highlight: string;
}

interface LearningGoal {
  id: string;
  category: string;
  title: string;
  desc: string;
  icon: string;
  badges: string[];
  defaultCertificate: string;
}

interface StudyDuration {
  min: number;
  label: string;
  subtitle: string;
  badge: string;
  weeklyEstimate: string;
  tip: string;
}

interface FocusSkill {
  id: string;
  icon: string;
  title: string;
  shortDesc: string;
  detailedDesc: string;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  onNavigate,
  user,
  profile,
  onProfileUpdated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [fetchingProfile, setFetchingProfile] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form states
  const [currentLevel, setCurrentLevel] = useState<string>('B1');
  const [targetLevel, setTargetLevel] = useState<string>('B2');
  const [primaryGoal, setPrimaryGoal] = useState<string>('career');
  const [learningGoals, setLearningGoals] = useState<string[]>(['career']);
  const [targetCertificate, setTargetCertificate] = useState<string>('IELTS 6.5+ / VSTEP B2');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(30);
  const [focusSkills, setFocusSkills] = useState<string[]>([
    'vocabulary',
    'listening',
    'writing',
    'speaking',
  ]);

  // Modal for honest placement test status
  const [showPlacementModal, setShowPlacementModal] = useState<boolean>(false);
  const [hasExistingProfile, setHasExistingProfile] = useState<boolean>(false);

  // CEFR Levels specification
  const cefrLevels: CefrLevel[] = [
    {
      code: 'A1',
      title: 'Beginner',
      cefrLabel: 'Mất gốc / Khởi đầu',
      desc: 'Nhận biết từ vựng cơ bản, phát âm từ đơn lẻ, chào hỏi và giới thiệu tên tuổi đơn giản.',
      highlight: 'Xây dựng nền tảng từ vựng và ngữ pháp cốt lõi',
    },
    {
      code: 'A2',
      title: 'Elementary',
      cefrLabel: 'Sơ cấp',
      desc: 'Hiểu câu giao tiếp ngắn trong sinh hoạt hàng ngày (mua sắm, địa chỉ, gia đình, công việc đơn giản).',
      highlight: 'Rèn luyện phản xạ nghe hiểu các mẫu câu thông dụng',
    },
    {
      code: 'B1',
      title: 'Intermediate',
      cefrLabel: 'Trung cấp (Phổ biến)',
      desc: 'Hiểu các chủ đề quen thuộc ở trường học/nơi làm việc. Diễn đạt ý kiến cá nhân và viết đoạn văn mạch lạc.',
      highlight: 'Bứt phá phản xạ nói và làm quen ngữ pháp nâng cao',
    },
    {
      code: 'B2',
      title: 'Upper-Intermediate',
      cefrLabel: 'Trung cấp cao',
      desc: 'Giao tiếp trôi chảy với người bản xứ, đọc hiểu văn bản chuyên ngành và viết luận có cấu trúc chặt chẽ.',
      highlight: 'Sẵn sàng làm việc môi trường quốc tế hoặc thi IELTS 6.5+',
    },
    {
      code: 'C1',
      title: 'Advanced',
      cefrLabel: 'Cao cấp',
      desc: 'Sử dụng ngôn ngữ linh hoạt cho học thuật, nghiên cứu và đàm phán kinh doanh chuyên sâu.',
      highlight: 'Hoàn thiện văn phong học thuật và từ vựng band điểm cao',
    },
    {
      code: 'C2',
      title: 'Mastery',
      cefrLabel: 'Thành thạo bản xứ',
      desc: 'Hiểu và sử dụng tiếng Anh gần như người bản xứ, phân tích văn phong tinh tế và phản xạ tức thì.',
      highlight: 'Làm chủ ngữ điệu, thành ngữ và lập luận sắc bén',
    },
  ];

  // Learning goals specification
  const goalsList: LearningGoal[] = [
    {
      id: 'daily_communication',
      category: 'Giao tiếp hàng ngày',
      title: 'Giao tiếp đời sống & Phản xạ tự nhiên',
      desc: 'Tự tin trò chuyện hàng ngày, đi du lịch, kết bạn quốc tế và xem phim/nghe podcast không cần phụ đề.',
      icon: 'forum',
      badges: ['Du lịch', 'Phản xạ', 'Đời sống'],
      defaultCertificate: 'Giao tiếp Quốc tế B1/B2',
    },
    {
      id: 'academic',
      category: 'Học thuật & Nghiên cứu',
      title: 'Học thuật, Đại học & Nghiên cứu khoa học',
      desc: 'Đọc hiểu tài liệu chuyên ngành, báo cáo khoa học, thuyết trình đồ án và chuẩn bị du học.',
      icon: 'school',
      badges: ['Đại học', 'Du học', 'Luận văn'],
      defaultCertificate: 'Academic English B2+',
    },
    {
      id: 'career',
      category: 'Sự nghiệp & Công sở',
      title: 'Phát triển sự nghiệp & Tiếng Anh công sở',
      desc: 'Viết email chỉn chu, phỏng vấn xin việc các công ty công nghệ/đa quốc gia, đàm phán và thuyết trình với đối tác.',
      icon: 'business_center',
      badges: ['Phỏng vấn IT', 'Email công sở', 'Thuyết trình'],
      defaultCertificate: 'Business B2 / VSTEP B2',
    },
    {
      id: 'exam_prep',
      category: 'Luyện thi chứng chỉ',
      title: 'Luyện thi chứng chỉ quốc tế (IELTS / TOEIC / VSTEP)',
      desc: 'Lộ trình luyện đề theo mục tiêu điểm số, tối ưu điểm từ vựng (Lexical Resource) và ngữ pháp cùng AI.',
      icon: 'workspace_premium',
      badges: ['IELTS 6.5 - 7.5', 'TOEIC 850+', 'VSTEP'],
      defaultCertificate: 'IELTS 7.0 / TOEIC 850+',
    },
  ];

  // Daily study durations
  const durations: StudyDuration[] = [
    {
      min: 15,
      label: '15 phút',
      subtitle: 'Khởi động nhẹ nhàng',
      badge: 'Dễ duy trì',
      weeklyEstimate: '~1.75 giờ mỗi tuần',
      tip: 'Thích hợp cho người bận rộn; 10 phút từ vựng SRS + 5 phút nghe tin tức.',
    },
    {
      min: 30,
      label: '30 phút',
      subtitle: 'Tiêu chuẩn vàng',
      badge: 'Khuyên dùng',
      weeklyEstimate: '~3.5 giờ mỗi tuần',
      tip: 'Cân bằng hoàn hảo: 10 phút từ vựng SRS, 10 phút nghe chép chính tả, 10 phút đàm thoại AI.',
    },
    {
      min: 45,
      label: '45 phút',
      subtitle: 'Tiến bộ nhanh',
      badge: 'Hiệu quả cao',
      weeklyEstimate: '~5.25 giờ mỗi tuần',
      tip: 'Luyện tập toàn diện 4 kỹ năng: từ vựng, nghe phản xạ, viết bài luận và hội thoại tương tác.',
    },
    {
      min: 60,
      label: '60 phút',
      subtitle: 'Tăng tốc chuyên sâu',
      badge: 'Bứt phá',
      weeklyEstimate: '~7.0 giờ mỗi tuần',
      tip: 'Lộ trình cấp tốc chuẩn bị thi chứng chỉ hoặc phỏng vấn xin việc trong 30-60 ngày tới.',
    },
  ];

  // 4 Core Skills
  const skillsList: FocusSkill[] = [
    {
      id: 'vocabulary',
      icon: 'translate',
      title: 'Từ vựng (Vocabulary - SRS)',
      shortDesc: 'Phương pháp lặp lại ngắt quãng Spaced Repetition',
      detailedDesc: 'Học từ vựng theo ngữ cảnh thực tế, phiên âm IPA, từ đồng nghĩa và collocations phổ biến.',
    },
    {
      id: 'listening',
      icon: 'headphones',
      title: 'Luyện nghe & Chép chính tả (Listening)',
      shortDesc: 'Nghe điền từ khuyết và hội thoại đa giọng điệu (US/UK)',
      detailedDesc: 'Luyện phản xạ nhận diện âm, nối âm, nuốt âm và tăng tốc độ xử lý thông tin thính giác.',
    },
    {
      id: 'writing',
      icon: 'edit_document',
      title: 'Luyện viết cùng AI (AI Writing)',
      shortDesc: 'Sửa ngữ pháp tức thì và chấm điểm bài viết chuẩn CEFR',
      detailedDesc: 'Chấm điểm 4 tiêu chí IELTS/VSTEP, giải thích chi tiết lỗi sai và viết lại bài mẫu điểm cao.',
    },
    {
      id: 'speaking',
      icon: 'record_voice_over',
      title: 'Luyện nói cùng AI (AI Conversation)',
      shortDesc: 'Luyện nói 1-1 với Trợ lý AI không áp lực',
      detailedDesc: 'Thực hành các tình huống phỏng vấn, đàm phán, đóng vai và nhận gợi ý cách diễn đạt tự nhiên hơn.',
    },
  ];

  // Restore saved profile on mount
  useEffect(() => {
    const loadProfileData = async () => {
      setFetchingProfile(true);
      try {
        let loaded = profile;
        if (!loaded) {
          loaded = await api.getProfile();
        }

        if (loaded && loaded.currentLevel) {
          setHasExistingProfile(true);
          setCurrentLevel(loaded.currentLevel || 'B1');
          if (loaded.targetLevel) setTargetLevel(loaded.targetLevel);
          if (loaded.targetCertificate) setTargetCertificate(loaded.targetCertificate);
          if (loaded.dailyCommitmentMinutes || loaded.dailyGoalMinutes) {
            setDailyGoalMinutes(loaded.dailyCommitmentMinutes || loaded.dailyGoalMinutes || 30);
          }
          if (loaded.primaryGoal) {
            setPrimaryGoal(loaded.primaryGoal);
          } else if (loaded.priorityTopic) {
            // Match with existing topics
            const matched = goalsList.find(
              (g) => g.title.includes(loaded!.priorityTopic!) || loaded!.priorityTopic!.includes(g.category)
            );
            if (matched) setPrimaryGoal(matched.id);
          }
          if (loaded.learningGoals && Array.isArray(loaded.learningGoals) && loaded.learningGoals.length > 0) {
            setLearningGoals(loaded.learningGoals);
          }
          if (loaded.focusSkills && Array.isArray(loaded.focusSkills) && loaded.focusSkills.length > 0) {
            setFocusSkills(loaded.focusSkills);
          }
        }
      } catch (err) {
        console.warn('Could not fetch existing profile, using default onboarding state:', err);
      } finally {
        setFetchingProfile(false);
      }
    };

    loadProfileData();
  }, [profile]);

  // Skill toggle logic
  const handleToggleSkill = (skillId: string) => {
    setValidationError(null);
    if (focusSkills.includes(skillId)) {
      if (focusSkills.length === 1) {
        setValidationError('Vui lòng chọn ít nhất 1 kỹ năng để AI chuẩn bị lộ trình học tập.');
        return;
      }
      setFocusSkills(focusSkills.filter((s) => s !== skillId));
    } else {
      setFocusSkills([...focusSkills, skillId]);
    }
  };

  // Learning goal toggle logic
  const handleSelectGoal = (goal: LearningGoal) => {
    setValidationError(null);
    setPrimaryGoal(goal.id);
    if (!learningGoals.includes(goal.id)) {
      setLearningGoals([...learningGoals, goal.id]);
    }
    setTargetCertificate(goal.defaultCertificate);
  };

  const handleToggleAdditionalGoal = (goalId: string) => {
    if (learningGoals.includes(goalId)) {
      if (learningGoals.length > 1) {
        const next = learningGoals.filter((g) => g !== goalId);
        setLearningGoals(next);
        if (primaryGoal === goalId) {
          setPrimaryGoal(next[0]);
        }
      }
    } else {
      setLearningGoals([...learningGoals, goalId]);
    }
  };

  // Step validation
  const validateStep = (currentStepNumber: number): boolean => {
    setValidationError(null);
    if (currentStepNumber === 1) {
      if (!currentLevel) {
        setValidationError('Vui lòng chọn một trình độ CEFR để tiếp tục.');
        return false;
      }
    } else if (currentStepNumber === 2) {
      if (!primaryGoal || learningGoals.length === 0) {
        setValidationError('Vui lòng chọn ít nhất một mục tiêu học tập.');
        return false;
      }
    } else if (currentStepNumber === 3) {
      if (!dailyGoalMinutes || dailyGoalMinutes <= 0) {
        setValidationError('Vui lòng chọn thời gian học mỗi ngày.');
        return false;
      }
    } else if (currentStepNumber === 4) {
      if (focusSkills.length === 0) {
        setValidationError('Vui lòng chọn ít nhất một kỹ năng trọng tâm.');
        return false;
      }
    }
    return true;
  };

  const handleContinue = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setValidationError(null);
    setSaveError(null);
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Submit onboarding to backend
  const handleSubmitOnboarding = async () => {
    if (!validateStep(4)) return;

    setSaving(true);
    setSaveError(null);

    try {
      const selectedGoalObj = goalsList.find((g) => g.id === primaryGoal);
      const primaryTopicString = selectedGoalObj ? selectedGoalObj.title : 'Tiếng Anh giao tiếp & Công sở';

      const updatedProfile = await api.saveOnboarding({
        currentLevel,
        targetLevel,
        targetCertificate,
        dailyGoalMinutes,
        dailyCommitmentMinutes: dailyGoalMinutes,
        primaryGoal: primaryTopicString,
        learningGoals: learningGoals.map((gId) => {
          const item = goalsList.find((g) => g.id === gId);
          return item ? item.title : gId;
        }),
        focusSkills,
      });

      onProfileUpdated(updatedProfile);
      onNavigate('/dashboard');
    } catch (err: any) {
      console.error('Failed to save learning onboarding profile:', err);
      setSaveError(
        err.message ||
          'Không thể lưu lộ trình học tập vào hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col font-sans text-[#1b1b1f] selection:bg-[#dbe1ff] selection:text-[#00174a]">
      <PublicHeader currentPath="/onboarding" onNavigate={onNavigate} isAuthenticated={true} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Banner if user is revisiting to update their profile */}
        {hasExistingProfile && (
          <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs text-[#0650cc] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base shrink-0">history_edu</span>
              <span>
                <strong>Cập nhật lộ trình:</strong> Bạn đã có hồ sơ học tập (<strong>{currentLevel}</strong>). Bạn có thể điều chỉnh lại mục tiêu, thời gian hoặc kỹ năng bên dưới.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 font-bold hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
            >
              Về Bảng điều khiển
            </button>
          </div>
        )}

        {/* Stepper Progress Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#e9edff] text-[#0650cc] text-xs font-semibold mb-3">
            <span>Thiết lập lộ trình học tập</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f1b34] tracking-tight">
            Chào mừng {user?.fullName || 'bạn'} đến với LinguaNext
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] mt-1.5 max-w-lg mx-auto">
            Chọn trình độ và mục tiêu để thiết lập các bài ôn tập và đề thi thử phù hợp nhất.
          </p>

          {/* Stepper visual dots and lines */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6 max-w-lg mx-auto">
            {[
              { num: 1, label: 'Trình độ' },
              { num: 2, label: 'Mục tiêu' },
              { num: 3, label: 'Thời gian' },
              { num: 4, label: 'Kỹ năng' },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => {
                    // Allow navigating back to completed steps
                    if (s.num < step) setStep(s.num);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    step === s.num
                      ? 'bg-[#0650cc] text-white shadow-sm ring-4 ring-blue-100'
                      : step > s.num
                      ? 'bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700'
                      : 'bg-[#e1e2ec] text-[#44474f]'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                    {step > s.num ? (
                      <span className="material-symbols-outlined text-xs">check</span>
                    ) : (
                      s.num
                    )}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>

                {idx < 3 && (
                  <div
                    className={`h-0.5 w-6 sm:w-10 rounded-full transition-all ${
                      step > s.num ? 'bg-emerald-600' : 'bg-[#e1e2ec]'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Validation or save error message */}
        {(validationError || saveError) && (
          <div className="mb-6 p-4 rounded-2xl bg-[#ffdad6] border border-[#ffb4ab] text-[#ba1a1a] text-xs font-medium flex items-center justify-between gap-3 animate-shake">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{validationError || saveError}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                setSaveError(null);
              }}
              className="text-[#ba1a1a] hover:opacity-70 p-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Form Container Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e1e2ec] shadow-sm relative overflow-hidden">
          {fetchingProfile && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0650cc]">
                <span className="w-4 h-4 border-2 border-[#0650cc]/30 border-t-[#0650cc] rounded-full animate-spin" />
                <span>Đang tải thông tin hồ sơ...</span>
              </div>
            </div>
          )}

          {/* ==================== STEP 1: PROFICIENCY LEVEL & PLACEMENT ==================== */}
          {step === 1 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#f1f3ff]">
                <div>
                  <h2 className="text-xl font-bold text-[#0f1b34]">Bước 1: Trình độ tiếng Anh hiện tại</h2>
                  <p className="text-xs text-[#44474f] mt-1">
                    Chọn khung tham chiếu CEFR phản ánh đúng nhất khả năng ngôn ngữ của bạn hiện nay
                  </p>
                </div>

                {/* Placement test button */}
                <button
                  type="button"
                  onClick={() => setShowPlacementModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0650cc] text-xs font-semibold hover:bg-blue-100 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">quiz</span>
                  <span>Kiểm tra trình độ đầu vào</span>
                </button>
              </div>

              {/* CEFR Level Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {cefrLevels.map((lvl) => {
                  const isSelected = currentLevel === lvl.code;
                  return (
                    <div
                      key={lvl.code}
                      onClick={() => {
                        setCurrentLevel(lvl.code);
                        setValidationError(null);
                      }}
                      className={`p-4 sm:p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected
                          ? 'border-[#0650cc] bg-blue-50/40 shadow-sm ring-1 ring-blue-200'
                          : 'border-[#e1e2ec] hover:border-blue-200 hover:bg-[#faf9ff]'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#0650cc] text-white shadow-xs'
                            : 'bg-gray-100 text-[#44474f]'
                        }`}
                      >
                        {lvl.code}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-[#0f1b34]">{lvl.title}</h3>
                            <span className="text-[11px] font-medium text-[#0650cc]">
                              {lvl.cefrLabel}
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="material-symbols-outlined text-[#0650cc] text-xl shrink-0">
                              check_circle
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-[#c4c6d0] text-xl shrink-0">
                              radio_button_unchecked
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#44474f] mt-1.5 leading-relaxed">{lvl.desc}</p>
                        <div className="mt-2 text-[11px] text-[#0650cc] font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">arrow_right</span>
                          <span>{lvl.highlight}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== STEP 2: LEARNING GOALS ==================== */}
          {step === 2 && (
            <div>
              <div className="mb-6 pb-4 border-b border-[#f1f3ff]">
                <h2 className="text-xl font-bold text-[#0f1b34]">Bước 2: Mục tiêu học tập chính</h2>
                <p className="text-xs text-[#44474f] mt-1">
                  Chọn mục tiêu bạn hướng tới để AI tinh chỉnh kho ngữ liệu, bài đọc và chủ đề gia sư
                </p>
              </div>

              {/* Goal Cards */}
              <div className="space-y-3.5 mb-6">
                {goalsList.map((g) => {
                  const isPrimary = primaryGoal === g.id;
                  const isChecked = learningGoals.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => handleSelectGoal(g)}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isPrimary
                          ? 'border-[#0650cc] bg-blue-50/40 shadow-sm ring-1 ring-blue-200'
                          : isChecked
                          ? 'border-blue-300 bg-blue-50/15'
                          : 'border-[#e1e2ec] hover:border-blue-200 hover:bg-[#faf9ff]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isPrimary ? 'bg-[#0650cc] text-white shadow-xs' : 'bg-gray-100 text-[#44474f]'
                          }`}
                        >
                          <span className="material-symbols-outlined">{g.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-[#0650cc]">
                              {g.category}
                            </span>
                            {isPrimary && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0650cc] text-white">
                                Mục tiêu ưu tiên số 1
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-[#0f1b34] mt-1">{g.title}</h3>
                          <p className="text-xs text-[#44474f] mt-0.5 leading-relaxed">{g.desc}</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {g.badges.map((b) => (
                              <span
                                key={b}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-[#44474f]"
                              >
                                #{b}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center shrink-0">
                        {isPrimary ? (
                          <span className="material-symbols-outlined text-[#0650cc] text-2xl">
                            radio_button_checked
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-[#c4c6d0] text-2xl">
                            radio_button_unchecked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Target Level & Target Certificate selection */}
              <div className="pt-6 border-t border-[#e1e2ec] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-2">
                    Trình độ CEFR mục tiêu
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['B1', 'B2', 'C1', 'C2'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setTargetLevel(lvl)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          targetLevel === lvl
                            ? 'bg-[#0650cc] text-white shadow-xs'
                            : 'bg-[#f1f3ff] text-[#44474f] hover:bg-blue-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#44474f] uppercase tracking-wider mb-2">
                    Chứng chỉ / Mục tiêu đầu ra
                  </label>
                  <select
                    value={targetCertificate}
                    onChange={(e) => setTargetCertificate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#faf9ff] border border-[#e1e2ec] text-xs font-semibold text-[#0f1b34] focus:outline-none focus:border-[#0650cc]"
                  >
                    <option value="IELTS 6.5+ / VSTEP B2">IELTS 6.5+ / VSTEP B2</option>
                    <option value="IELTS 7.0+">IELTS 7.0+ (Band cao)</option>
                    <option value="TOEIC 850+">TOEIC 850+ (Doanh nghiệp)</option>
                    <option value="VSTEP B2 / C1">VSTEP B2 / C1 (Chuẩn Bộ GD&ĐT)</option>
                    <option value="Business English B2+">Tiếng Anh thương mại & Giao tiếp công sở B2+</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ==================== STEP 3: DAILY STUDY DURATION ==================== */}
          {step === 3 && (
            <div>
              <div className="mb-6 pb-4 border-b border-[#f1f3ff]">
                <h2 className="text-xl font-bold text-[#0f1b34]">Bước 3: Thời gian học mỗi ngày</h2>
                <p className="text-xs text-[#44474f] mt-1">
                  Duy trì việc rèn luyện đều đặn mỗi ngày là chìa khóa hình thành phản xạ ngôn ngữ dài hạn
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {durations.map((d) => {
                  const isSelected = dailyGoalMinutes === d.min;
                  return (
                    <div
                      key={d.min}
                      onClick={() => {
                        setDailyGoalMinutes(d.min);
                        setValidationError(null);
                      }}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0650cc] bg-blue-50/40 shadow-sm ring-1 ring-blue-200'
                          : 'border-[#e1e2ec] hover:border-blue-200 hover:bg-[#faf9ff]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-black text-[#0650cc]">{d.label}</span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-[#0650cc] text-white'
                                : 'bg-blue-100 text-[#0650cc]'
                            }`}
                          >
                            {d.badge}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#0f1b34]">{d.subtitle}</h4>
                        <p className="text-xs text-[#44474f] mt-1.5 leading-relaxed">{d.tip}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#e1e2ec]/60 flex items-center gap-1.5 text-xs text-[#0650cc] font-semibold">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{d.weeklyEstimate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Habit tip card */}
              <div className="mt-8 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5">
                  lightbulb
                </span>
                <div>
                  <strong>Gợi ý từ trợ lý học tập:</strong> Bạn có thể bật tính năng thông báo nhắc nhở học tập hàng ngày trong phần Cài đặt để không bị ngắt chuỗi học (streak).
                </div>
              </div>
            </div>
          )}

          {/* ==================== STEP 4: SKILLS TO IMPROVE & REVIEW ==================== */}
          {step === 4 && (
            <div>
              <div className="mb-6 pb-4 border-b border-[#f1f3ff]">
                <h2 className="text-xl font-bold text-[#0f1b34]">Bước 4: Kỹ năng bạn muốn cải thiện</h2>
                <p className="text-xs text-[#44474f] mt-1">
                  Chọn các kỹ năng bạn muốn LinguaNext tập trung bài tập và gia sư AI hỗ trợ (chọn ít nhất 1)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {skillsList.map((sk) => {
                  const isSelected = focusSkills.includes(sk.id);
                  return (
                    <div
                      key={sk.id}
                      onClick={() => handleToggleSkill(sk.id)}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected
                          ? 'border-[#0650cc] bg-blue-50/40 shadow-sm ring-1 ring-blue-200'
                          : 'border-[#e1e2ec] hover:border-blue-200 hover:bg-[#faf9ff]'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#0650cc] text-white shadow-xs' : 'bg-gray-100 text-[#44474f]'
                        }`}
                      >
                        <span className="material-symbols-outlined">{sk.icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-[#0f1b34]">{sk.title}</h4>
                          <span
                            className={`material-symbols-outlined text-xl shrink-0 ${
                              isSelected ? 'text-[#0650cc]' : 'text-[#c4c6d0]'
                            }`}
                          >
                            {isSelected ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                        </div>
                        <p className="text-xs text-[#0650cc] font-medium mt-0.5">{sk.shortDesc}</p>
                        <p className="text-xs text-[#44474f] mt-1 leading-relaxed">{sk.detailedDesc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comprehensive Summary Box */}
              <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-[#f1f3ff] border border-[#dbe1ff]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold text-[#0650cc] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">summarize</span>
                    Tổng kết lộ trình học tập được thiết lập
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Sẵn sàng lưu
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
                    <span className="text-[#74777f] block text-[11px]">Trình độ khởi điểm:</span>
                    <p className="font-extrabold text-[#0650cc] text-sm mt-0.5">{currentLevel}</p>
                    <span className="text-[10px] text-[#44474f]">
                      {cefrLevels.find((l) => l.code === currentLevel)?.title}
                    </span>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
                    <span className="text-[#74777f] block text-[11px]">Mục tiêu đầu ra:</span>
                    <p className="font-extrabold text-[#0f1b34] text-sm mt-0.5">{targetLevel}</p>
                    <span className="text-[10px] text-[#44474f] truncate block" title={targetCertificate}>
                      {targetCertificate}
                    </span>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
                    <span className="text-[#74777f] block text-[11px]">Thời gian cam kết:</span>
                    <p className="font-extrabold text-[#0f1b34] text-sm mt-0.5">{dailyGoalMinutes} phút/ngày</p>
                    <span className="text-[10px] text-[#44474f]">
                      {dailyGoalMinutes * 7} phút / tuần
                    </span>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-blue-100">
                    <span className="text-[#74777f] block text-[11px]">Kỹ năng trọng tâm:</span>
                    <p className="font-extrabold text-[#0f1b34] text-sm mt-0.5">
                      {focusSkills.length} / 4 kỹ năng
                    </p>
                    <span className="text-[10px] text-[#44474f]">
                      {focusSkills.map((s) => s.slice(0, 3)).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== NAVIGATION BUTTONS (BACK / CONTINUE / SUBMIT) ==================== */}
          <div className="mt-8 pt-6 border-t border-[#e1e2ec] flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-[#c4c6d0] text-xs font-semibold text-[#44474f] hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Quay lại</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="px-6 py-2.5 rounded-xl bg-[#0650cc] text-white text-xs font-bold hover:bg-[#003ea8] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Tiếp tục</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOnboarding}
                disabled={saving}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#0650cc] to-[#356ae6] text-white text-sm font-bold shadow-md shadow-blue-600/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang lưu lộ trình học tập...</span>
                  </>
                ) : (
                  <>
                    <span>Hoàn tất & Đến Bảng điều khiển</span>
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ==================== HONEST PLACEMENT TEST STATUS MODAL ==================== */}
      {showPlacementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e1e2ec] relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e1e2ec] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0650cc] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">quiz</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#0f1b34]">
                      Bài kiểm tra đầu vào (Placement Test)
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    Tính năng đang hoàn thiện • Sắp ra mắt
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlacementModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#74777f] cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Modal Body - Honest explanation */}
            <div className="space-y-4 text-xs text-[#44474f] leading-relaxed">
              <p>
                Hiện tại, tính năng <strong>Bài kiểm tra thích ứng 4 kỹ năng (Adaptive Placement Test)</strong> ứng dụng mô hình AI chấm điểm chuẩn CEFR đang được đội ngũ kỹ sư hoàn thiện để đảm bảo độ chính xác cao nhất.
              </p>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[#0650cc] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
                <span>
                  Để bảo đảm trải nghiệm chân thực và không đưa ra kết quả ước lượng thiếu căn cứ, hệ thống chưa kích hoạt bài thi tự động.
                </span>
              </div>

              <p>
                👉 <strong>Giải pháp tức thì:</strong> Bạn có thể <strong>tự chọn trình độ CEFR (A1 - C2)</strong> phù hợp nhất với bản thân ở danh sách bên cạnh. AI sẽ bắt đầu cá nhân hóa bài tập ngay lập tức dựa trên lựa chọn này.
              </p>

              <p className="text-[11px] text-[#74777f]">
                * Bạn có thể thay đổi hoặc cập nhật lại trình độ bất kỳ lúc nào trong phần Cài đặt sau khi đăng nhập.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-[#e1e2ec] flex justify-end">
              <button
                type="button"
                onClick={() => setShowPlacementModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#0650cc] text-white text-xs font-bold hover:bg-[#003ea8] transition-colors cursor-pointer"
              >
                Đã hiểu — Tôi sẽ tự chọn trình độ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
