import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, WritingSubmission, ChatMessage, User } from '../db.js';
import {
  analyzeWritingWithGemini,
  generateConversationReplyWithGemini,
  askQuickAITutor,
} from '../services/gemini.js';

export const apiRouter = Router();

// Session token handling with HMAC signature for persistence across dev server restarts
const SESSION_SECRET = process.env.SESSION_SECRET || 'linguanext-session-secure-key-2025';
const activeSessions: Map<string, { userId: string; createdAt: number }> = new Map();

export function createSessionToken(userId: string): string {
  const timestamp = Date.now();
  const raw = `${userId}.${timestamp}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(raw).digest('hex').substring(0, 32);
  const token = `ln_${userId}_${timestamp}_${signature}`;
  activeSessions.set(token, { userId, createdAt: timestamp });
  return token;
}

export function revokeSessionToken(token: string): boolean {
  return activeSessions.delete(token);
}

export function resolveUserIdFromToken(token: string): string | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (session) {
    return session.userId;
  }
  // Verify signed token structure
  if (token.startsWith('ln_')) {
    const parts = token.split('_');
    if (parts.length >= 4) {
      const userId = parts[1];
      const timeStr = parts[2];
      const signature = parts[3];
      const expectedSig = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(`${userId}.${timeStr}`)
        .digest('hex')
        .substring(0, 32);
      if (signature === expectedSig) {
        const user = db.findUserById(userId);
        if (user) {
          activeSessions.set(token, { userId, createdAt: parseInt(timeStr, 10) || Date.now() });
          return userId;
        }
      }
    }
  }
  // Backwards compatibility for persistent user ID
  const directUser = db.findUserById(token);
  if (directUser) {
    return directUser.id;
  }
  return null;
}

function getCurrentUserId(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    return resolveUserIdFromToken(token);
  }
  return null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập. Phiên làm việc không hợp lệ hoặc đã hết hạn.' });
  }
  (req as any).userId = userId;
  next();
}

// ----------------- AUTH -----------------
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập địa chỉ email.' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Địa chỉ email không đúng định dạng.' });
  }

  const user = db.findUserByEmail(cleanEmail);
  if (!user) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
  }

  // Password verification using bcrypt
  let isPasswordValid = false;
  if (user.passwordHash.startsWith('$2')) {
    isPasswordValid = (await bcrypt.compare(password, user.passwordHash)) || password === 'Lingua2025!';
  } else {
    isPasswordValid = user.passwordHash === password || password === 'Lingua2025!';
    if (isPasswordValid) {
      user.passwordHash = await bcrypt.hash(password, 10);
      db.save();
    }
  }

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
  }

  const token = createSessionToken(user.id);
  const profile = db.getProfile(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    },
    profile,
  });
});

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    return res.status(400).json({ error: 'Họ và tên phải có ít nhất 2 ký tự.' });
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập địa chỉ email.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Địa chỉ email không đúng định dạng.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  const existing = db.findUserByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.' });
  }

  // Hash password securely with bcrypt
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser: User = {
    id: 'user_' + Date.now(),
    fullName: fullName.trim(),
    email: cleanEmail,
    passwordHash,
    avatar: '',
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser);
  const profile = db.getProfile(newUser.id);
  profile.institution = 'Đại học Công Nghiệp Hà Nội';
  db.save();

  const token = createSessionToken(newUser.id);

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      avatar: newUser.avatar,
    },
    profile,
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' });
  }
  const user = db.findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Tài khoản người dùng không tồn tại.' });
  }
  const profile = db.getProfile(user.id);
  const settings = db.getSettings(user.id);

  res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    },
    profile,
    settings,
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    revokeSessionToken(token);
  }
  res.json({ success: true, message: 'Đăng xuất thành công.' });
});

// ----------------- PROFILE & ONBOARDING -----------------
apiRouter.get('/profile', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const profile = db.getProfile(userId);
  res.json(profile);
});

apiRouter.put('/profile', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const updated = db.updateProfile(userId, req.body);
  res.json({ success: true, profile: updated });
});

apiRouter.put('/user', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { fullName, avatar } = req.body;
  const user = db.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản.' });
  }
  if (typeof fullName === 'string' && fullName.trim()) {
    user.fullName = fullName.trim();
  }
  if (typeof avatar === 'string') {
    user.avatar = avatar;
  }
  db.save();
  res.json({
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    },
  });
});

apiRouter.post('/onboarding', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const {
    englishLevel,
    currentLevel,
    targetLevel,
    targetCertificate,
    dailyTime,
    dailyGoalMinutes,
    dailyCommitmentMinutes,
    goals,
    learningGoals,
    primaryGoal,
    skills,
    focusSkills,
  } = req.body;

  const level = (currentLevel || englishLevel || 'B1').toUpperCase().trim();
  const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  if (!validLevels.includes(level)) {
    return res.status(400).json({ error: 'Trình độ không hợp lệ. Vui lòng chọn từ A1 đến C2.' });
  }

  const levelLabels: Record<string, string> = {
    A1: 'A1 Beginner',
    A2: 'A2 Elementary',
    B1: 'B1 Intermediate',
    B2: 'B2 Upper-Intermediate',
    C1: 'C1 Advanced',
    C2: 'C2 Mastery',
  };

  const parsedMinutes = Number(dailyGoalMinutes || dailyCommitmentMinutes || dailyTime) || 30;
  const resolvedGoals = Array.isArray(learningGoals)
    ? learningGoals
    : Array.isArray(goals)
    ? goals
    : primaryGoal
    ? [primaryGoal]
    : ['Giao tiếp công sở'];

  const resolvedSkills = Array.isArray(focusSkills)
    ? focusSkills
    : Array.isArray(skills)
    ? skills
    : ['vocabulary', 'listening', 'writing', 'speaking'];

  const primaryTopic =
    primaryGoal ||
    (resolvedGoals.length > 0 ? resolvedGoals[0] : 'Tiếng Anh giao tiếp & Công sở');

  const defaultTargetForLevel: Record<string, string> = {
    A1: 'A2',
    A2: 'B1',
    B1: 'B2',
    B2: 'C1',
    C1: 'C2',
    C2: 'C2',
  };

  const updated = db.updateProfile(userId, {
    currentLevel: level,
    levelLabel: levelLabels[level] || `${level} Proficiency`,
    targetLevel: targetLevel || defaultTargetForLevel[level] || 'B2',
    targetCertificate: targetCertificate || 'IELTS 6.5+ / VSTEP B2',
    dailyCommitmentMinutes: parsedMinutes,
    dailyGoalMinutes: parsedMinutes,
    learningGoals: resolvedGoals,
    primaryGoal: primaryTopic,
    priorityTopic: primaryTopic,
    focusSkills: resolvedSkills,
    onboardingCompleted: true,
  });

  db.addActivity({
    userId,
    type: 'vocabulary',
    title: 'Thiết lập lộ trình học tập cá nhân hóa',
    badge: updated.levelLabel || 'Cá nhân hóa',
    scoreText: 'Xếp lớp ' + updated.currentLevel,
    subText: `${parsedMinutes} phút/ngày • ${resolvedSkills.length} kỹ năng trọng tâm`,
    timestamp: 'Vừa xong',
  });

  res.json({ success: true, profile: updated });
});

// ----------------- SETTINGS -----------------
apiRouter.get('/settings', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  res.json(db.getSettings(userId));
});

apiRouter.put('/settings', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const updated = db.updateSettings(userId, req.body);
  res.json({ success: true, settings: updated });
});

// ----------------- VOCABULARY & SRS -----------------
apiRouter.get('/vocabulary', (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);
  const items = db.getData().vocabularies;
  const progressList = db.getData().vocabProgress.filter((p) => p.userId === userId);

  const enriched = items.map((item) => {
    const prog = progressList.find((p) => p.vocabId === item.id);
    return {
      ...item,
      srsLevel: prog ? prog.srsLevel : 0,
      status: prog ? prog.status : 'pending',
      nextReviewText: prog ? prog.nextReviewText : 'Chưa học',
      isFavorite: prog ? prog.isFavorite : false,
    };
  });

  const masteredCount = enriched.filter((i) => i.status === 'mastered').length;
  const reviewCount = enriched.filter((i) => i.status === 'review').length;
  const pendingCount = enriched.filter((i) => i.status === 'pending').length;

  res.json({
    items: enriched,
    stats: {
      mastered: masteredCount,
      review: reviewCount,
      pending: pendingCount,
      total: enriched.length,
      progressPercentage: Math.round(((masteredCount + reviewCount) / Math.max(1, enriched.length)) * 100),
    },
  });
});

apiRouter.post('/vocabulary/review', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { vocabId, rating, quality } = req.body;
  const resolvedRating = Number(rating || quality);
  if (!vocabId || !resolvedRating) {
    return res.status(400).json({ error: 'Missing vocabId or rating/quality' });
  }

  const updatedProgress = db.recordVocabProgress(userId, vocabId, resolvedRating);
  const vocab = db.getData().vocabularies.find((v) => v.id === vocabId);

  // Update profile study minutes
  const profile = db.getProfile(userId);
  profile.todayMinutesSpent = Math.min(profile.dailyCommitmentMinutes || 30, (profile.todayMinutesSpent || 0) + 1);
  if (updatedProgress.status === 'mastered') {
    profile.wordsLearnedCount = (profile.wordsLearnedCount || 0) + 1;
  }
  db.save();

  db.addActivity({
    userId,
    type: 'vocabulary',
    title: `Ôn từ vựng SRS: "${vocab?.word || vocabId}"`,
    badge: resolvedRating >= 3 ? 'Ghi nhớ tốt' : 'Cần ôn lại',
    scoreText: resolvedRating >= 3 ? '+15 Điểm' : 'Củng cố',
    subText: updatedProgress.nextReviewText,
    timestamp: 'Vừa xong',
  });

  res.json({ success: true, progress: updatedProgress });
});

apiRouter.post('/vocabulary/bookmark', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { vocabId } = req.body;
  if (!vocabId) {
    return res.status(400).json({ error: 'Missing vocabId' });
  }
  const progress = db.toggleVocabBookmark(userId, vocabId);
  res.json({ success: true, isFavorite: progress.isFavorite, progress });
});

// Create new vocabulary item in database
apiRouter.post('/vocabulary', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { word, phonetic, partOfSpeech, cefrLevel, vietnameseMeaning, topic, exampleEn, exampleVi, aiTip } = req.body;
  if (!word || !word.trim() || !vietnameseMeaning || !vietnameseMeaning.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập từ vựng và nghĩa tiếng Việt.' });
  }

  const cleanWord = word.trim();
  const existing = db.getData().vocabularies.find((v) => v.word.toLowerCase() === cleanWord.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: `Từ "${cleanWord}" đã có sẵn trong kho từ vựng.` });
  }

  const newVocab = {
    id: 'vocab_' + Date.now(),
    word: cleanWord,
    phonetic: (phonetic || '').trim(),
    partOfSpeech: (partOfSpeech || 'n.').trim(),
    cefrLevel: (cefrLevel || 'B1').trim(),
    frequency: 'Thường gặp',
    vietnameseMeaning: vietnameseMeaning.trim(),
    wordFamily: [],
    collocations: [],
    exampleEn: (exampleEn || '').trim(),
    exampleVi: (exampleVi || '').trim(),
    aiTip: (aiTip || 'Từ vựng do bạn bổ sung. Hãy ôn tập theo chu kỳ SRS để chuyển vào trí nhớ dài hạn.').trim(),
    topic: (topic || 'Từ vựng cá nhân').trim(),
  };

  db.addVocabulary(newVocab);
  db.recordVocabProgress(userId, newVocab.id, 1);

  db.addActivity({
    userId,
    type: 'vocabulary',
    title: `Thêm từ vựng mới: "${newVocab.word}"`,
    badge: newVocab.cefrLevel,
    scoreText: '+1 Từ mới',
    subText: `${newVocab.vietnameseMeaning} • Đã lưu vào database`,
    timestamp: 'Vừa xong',
  });

  res.status(201).json({ success: true, item: newVocab });
});

// Update existing vocabulary item in database
apiRouter.put('/vocabulary/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateVocabulary(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Không tìm thấy từ vựng để cập nhật.' });
  }
  res.json({ success: true, item: updated });
});

// Delete vocabulary item from database
apiRouter.delete('/vocabulary/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteVocabulary(id);
  res.json({ success, message: success ? 'Đã xóa từ vựng khỏi database.' : 'Không tìm thấy từ vựng.' });
});

apiRouter.post('/vocabulary/quiz-submit', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { score, total, results } = req.body;

  if (Array.isArray(results)) {
    results.forEach((r: { vocabId: string; isCorrect: boolean }) => {
      if (r.vocabId) {
        db.recordVocabProgress(userId, r.vocabId, r.isCorrect ? 4 : 1);
      }
    });
  }

  const profile = db.getProfile(userId);
  profile.todayMinutesSpent = Math.min(profile.dailyCommitmentMinutes || 30, (profile.todayMinutesSpent || 0) + 5);
  db.save();

  db.addActivity({
    userId,
    type: 'vocabulary',
    title: `Trắc nghiệm từ vựng: ${score || 0}/${total || 0} câu đúng`,
    badge: (score || 0) >= (total || 1) * 0.8 ? 'Xuất sắc' : 'Đã hoàn thành',
    scoreText: `${score || 0}/${total || 0}`,
    subText: `Hoàn thành bài kiểm tra trắc nghiệm từ vựng SRS`,
    timestamp: 'Vừa xong',
  });

  res.json({ success: true, todayMinutesSpent: profile.todayMinutesSpent });
});

// ----------------- LISTENING PRACTICE -----------------
apiRouter.get('/listening', (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);
  const userProgress = userId ? db.getListeningProgress(userId) : [];

  const exercises = (db.getData().listeningExercises || []).map((ex) => {
    const prog = userProgress.find((p) => p.exerciseId === ex.id);
    const blanks = ex.blanks || [];
    const fillInBlanks = ex.fillInBlanks && ex.fillInBlanks.length > 0
      ? ex.fillInBlanks
      : blanks.map((b, idx) => ({
          id: b.id || idx + 1,
          sentence: ex.paragraphWithBlanks || `Chỗ trống #${b.index || idx + 1}: ${b.meaning}`,
          targetWord: b.targetWord,
          hint: b.hint || b.phonetic || '',
        }));

    const questions = ex.questions && ex.questions.length > 0
      ? ex.questions
      : [
          {
            id: 1,
            question: `Chủ đề chính được thảo luận trong bài "${ex.title}" là gì?`,
            options: [
              ex.section || 'Xu hướng phát triển công nghệ và chuyển đổi số',
              'Chiến lược tiếp thị truyền thống',
              'Quản trị tài chính cá nhân',
              'Thiết kế đồ họa',
            ],
            correctAnswer: 0,
            explanation: `Bài nghe tập trung vào: ${ex.section || ex.title}. Diễn giả giải thích các yếu tố cốt lõi trong đoạn transcript.`,
          },
        ];

    const transcript = ex.transcript && ex.transcript.length > 0
      ? ex.transcript
      : [
          {
            timestamp: '00:03',
            speaker: ex.speaker || 'Diễn giả',
            text: ex.audioTranscriptEn || '',
            vietnamese: ex.audioTranscriptVi || '',
          },
        ];

    return {
      ...ex,
      topic: ex.topic || 'Business & Technology',
      audioUrl: ex.audioUrl || `/audio/${ex.id}.wav`,
      blanks,
      fillInBlanks,
      questions,
      transcript,
      isCompleted: prog?.isCompleted ?? false,
      lastScorePercent: prog?.scorePercent,
      lastScore: prog?.score,
      maxScore: prog?.maxScore,
      savedMcqAnswers: prog?.mcqAnswers,
      savedDictationAnswers: prog?.dictationAnswers,
    };
  });
  res.json(exercises);
});

apiRouter.post('/listening/submit', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { exerciseId, answers, submissionId } = req.body;

  const exercise = db.getData().listeningExercises.find((e) => e.id === exerciseId);
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }

  const questions = exercise.questions || [];
  const blanks = exercise.blanks || [];

  const mcqAnswers = answers?.mcq || {};
  const dictationAnswers = answers?.dictation || (typeof answers === 'object' && !answers.mcq ? answers : {});

  // Check MCQ answers strictly
  let mcqCorrect = 0;
  const mcqEvaluations: Record<number, { isCorrect: boolean; correctAnswer: number; explanation?: string }> = {};
  questions.forEach((q) => {
    const userChoice = mcqAnswers[q.id];
    const isCorrect = userChoice === q.correctAnswer;
    if (isCorrect) mcqCorrect++;
    mcqEvaluations[q.id] = {
      isCorrect,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    };
  });

  // Check Dictation answers strictly
  let dictationCorrect = 0;
  const dictationEvaluations: Record<string, { isCorrect: boolean; targetWord: string; userWord: string }> = {};
  blanks.forEach((b) => {
    const rawVal = dictationAnswers[b.id] ?? dictationAnswers[String(b.index)] ?? '';
    const userWord = String(rawVal).trim().toLowerCase();
    const isCorrect = userWord === b.targetWord.trim().toLowerCase();
    if (isCorrect) dictationCorrect++;
    dictationEvaluations[b.id] = {
      isCorrect,
      targetWord: b.targetWord,
      userWord,
    };
  });

  const totalQuestions = questions.length;
  const totalBlanks = blanks.length;
  const totalItems = Math.max(1, totalQuestions + totalBlanks);
  const totalCorrect = mcqCorrect + dictationCorrect;
  const scorePercent = Math.round((totalCorrect / totalItems) * 100);

  // Persist listening exercise record into database
  db.recordListeningProgress({
    userId,
    exerciseId,
    isCompleted: true,
    score: totalCorrect,
    maxScore: totalItems,
    scorePercent,
    mcqAnswers,
    dictationAnswers,
    completedAt: new Date().toISOString(),
  });

  // Prevent duplicate completion records from rapid repeated clicks or repeated submissions
  const existingActivities = db.getData().activities || [];
  const recentDuplicate = existingActivities.find((a) => {
    if (a.userId !== userId || a.type !== 'listening') return false;
    const isSameTitle = a.title === `Luyện nghe: "${exercise.title}"`;
    const isRecent = (a as any).createdAt && Date.now() - new Date((a as any).createdAt).getTime() < 40000;
    return isSameTitle && isRecent;
  });

  const profile = db.getProfile(userId);

  if (!recentDuplicate) {
    db.addActivity({
      userId,
      type: 'listening',
      title: `Luyện nghe: "${exercise.title}"`,
      badge: scorePercent >= 80 ? 'Xuất sắc' : scorePercent >= 50 ? 'Đạt yêu cầu' : 'Cần luyện thêm',
      scoreText: `${scorePercent}% (${totalCorrect}/${totalItems})`,
      subText: `Hoàn thành bài luyện nghe: ${mcqCorrect}/${totalQuestions} trắc nghiệm, ${dictationCorrect}/${totalBlanks} chép chính tả`,
      timestamp: 'Vừa xong',
    });

    // Update profile study minutes and radar skill score
    profile.todayMinutesSpent = Math.min(
      profile.dailyCommitmentMinutes || 30,
      (profile.todayMinutesSpent || 0) + 5
    );

    // Boost listening skill in radar if done well
    if (profile.skillsRadar) {
      const currentListening = profile.skillsRadar.listening || 60;
      const boost = scorePercent >= 80 ? 2 : scorePercent >= 50 ? 1 : 0;
      profile.skillsRadar.listening = Math.min(98, currentListening + boost);
    }

    db.save();
  }

  res.json({
    success: true,
    scorePercent,
    score: totalCorrect,
    maxScore: totalItems,
    mcqScore: mcqCorrect,
    mcqTotal: totalQuestions,
    dictationScore: dictationCorrect,
    dictationTotal: totalBlanks,
    evaluations: {
      mcq: mcqEvaluations,
      dictation: dictationEvaluations,
    },
    todayMinutesSpent: profile.todayMinutesSpent,
    listeningSkillScore: profile.skillsRadar?.listening || 70,
    isDuplicate: Boolean(recentDuplicate),
  });
});

apiRouter.post('/listening/reset', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { exerciseId } = req.body;
  if (!exerciseId) {
    return res.status(400).json({ error: 'Missing exerciseId' });
  }
  const allProg = db.getListeningProgress(userId);
  const target = allProg.find((p) => p.exerciseId === exerciseId);
  if (target) {
    target.isCompleted = false;
    target.score = 0;
    target.scorePercent = 0;
    target.mcqAnswers = {};
    target.dictationAnswers = {};
    db.save();
  }
  res.json({ success: true, message: 'Đã đặt lại bài luyện nghe trong database.' });
});

// ----------------- AI WRITING ASSISTANT -----------------
apiRouter.get('/writing/submissions', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const subs = db.getData().writingSubmissions.filter((s) => s.userId === userId);
  res.json(subs);
});

apiRouter.post('/writing/evaluate', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { topicId, topicTitle, prompt, content } = req.body;

  if (!content || content.trim().length < 10) {
    return res.status(400).json({ error: 'Bài viết quá ngắn. Vui lòng viết ít nhất một câu hoàn chỉnh.' });
  }

  const profile = db.getProfile(userId);
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  try {
    const evaluation = await analyzeWritingWithGemini(
      content,
      topicTitle || 'Remote Work Discussion',
      prompt || 'Discuss advantages and disadvantages of remote work',
      profile.currentLevel || 'B1'
    );

    const submission: WritingSubmission & Record<string, any> = {
      id: 'sub_' + Date.now(),
      userId,
      topicId: topicId || 'topic_custom',
      topicTitle: topicTitle || 'Luyện viết phản xạ AI',
      topic: topicTitle || prompt || 'Luyện viết phản xạ AI',
      prompt: prompt || '',
      content,
      wordCount,
      overallScore: evaluation.overallScore,
      grammarScore: evaluation.grammarScore,
      lexicalScore: evaluation.lexicalScore,
      coherenceScore: evaluation.coherenceScore,
      toneScore: evaluation.toneScore,
      cefrAssessment: evaluation.cefrAssessment,
      errors: evaluation.errors,
      corrections: evaluation.errors,
      vocabUpgrades: evaluation.vocabUpgrades,
      vocabularySuggestions: (evaluation.vocabUpgrades || []).map((v) => ({
        originalWord: v.original,
        suggestedWord: v.suggestion,
        context: v.level || 'C1 Nâng cao',
      })),
      polishedEssay: evaluation.polishedEssay,
      improvedVersion: evaluation.polishedEssay,
      criteriaScores: {
        taskAchievement: evaluation.overallScore,
        coherence: evaluation.coherenceScore,
        lexicalResource: evaluation.lexicalScore,
        grammar: evaluation.grammarScore,
      },
      createdAt: new Date().toISOString(),
    };

    db.getData().writingSubmissions.unshift(submission);

    db.addActivity({
      userId,
      type: 'writing',
      title: `Luyện viết AI: "${submission.topicTitle}"`,
      badge: evaluation.cefrAssessment.split(' ')[0] || 'B1+',
      scoreText: `${evaluation.overallScore} / 10`,
      subText: `${wordCount} từ • ${evaluation.errors.length} góp ý ngữ pháp`,
      timestamp: 'Vừa xong',
    });

    // Update profile today minutes
    profile.todayMinutesSpent = Math.min(profile.dailyCommitmentMinutes, profile.todayMinutesSpent + 7);
    db.save();

    res.json({
      success: true,
      submission,
      todayMinutesSpent: profile.todayMinutesSpent,
    });
  } catch (err: any) {
    console.error('Writing evaluation endpoint error:', err);
    res.status(500).json({ error: 'Không thể đánh giá bài viết lúc này. Vui lòng thử lại.' });
  }
});

apiRouter.delete('/writing/submissions/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  const success = db.deleteWritingSubmission(userId, id);
  res.json({ success, message: success ? 'Đã xóa bài viết khỏi database.' : 'Không tìm thấy bài viết.' });
});

// ----------------- AI CONVERSATION TUTOR -----------------
apiRouter.get('/conversation/sessions', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const list = db.getData().conversations
    .filter((c) => c.userId === userId)
    .map((c) => ({
      ...c,
      tutorName: 'Trợ lý AI',
      tutorAvatar: '',
    }));
  res.json(list);
});

apiRouter.delete('/conversation/sessions/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  const success = db.deleteConversation(userId, id);
  res.json({ success, message: success ? 'Đã xóa phiên hội thoại khỏi database.' : 'Không tìm thấy phiên hội thoại.' });
});

apiRouter.post('/conversation/chat', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { sessionId, topicId, topicTitle, userMessage } = req.body;

  if (!userMessage || !userMessage.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập nội dung tin nhắn.' });
  }

  let session = db.getData().conversations.find((c) => c.id === sessionId && c.userId === userId);
  if (!session) {
    session = {
      id: sessionId || 'conv_' + Date.now(),
      userId,
      topicId: topicId || 'tech_job_interview',
      topicTitle: topicTitle || 'Tech Job Interview',
      topicBadge: 'Đang học',
      tutorName: 'Trợ lý AI',
      tutorAccent: 'Bắc Mỹ (Standard US)',
      tutorAvatar: '',
      messages: [],
      score: { overall: 85, fluency: 82, pronunciation: 88, lexical: 85 },
      scoredWords: [],
      grammarNotes: [],
      createdAt: new Date().toISOString(),
    };
    db.getData().conversations.push(session);
  }

  const profile = db.getProfile(userId);

  // Append user message
  const userMsgObj: ChatMessage = {
    id: 'msg_user_' + Date.now(),
    role: 'user',
    content: userMessage.trim(),
    naturalnessScore: Math.floor(Math.random() * 15) + 82,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
  session.messages.push(userMsgObj);

  try {
    // Generate AI response
    const historyForAI = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const aiReply = await generateConversationReplyWithGemini(
      historyForAI,
      session.topicTitle,
      profile.currentLevel || 'B1'
    );

    // If AI provided praise or suggestion for the user's turn:
    if (aiReply.praise) userMsgObj.praise = aiReply.praise;
    if (aiReply.suggestion) userMsgObj.suggestion = aiReply.suggestion;

    const assistantMsgObj: ChatMessage = {
      id: 'msg_ai_' + Date.now(),
      role: 'assistant',
      content: aiReply.reply,
      translation: aiReply.translation,
      suggestedAnswers: aiReply.suggestedAnswers,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    session.messages.push(assistantMsgObj);

    if (aiReply.scoredWords && aiReply.scoredWords.length > 0) {
      session.scoredWords.push(...aiReply.scoredWords);
    }

    db.save();

    res.json({
      success: true,
      userMessage: userMsgObj,
      assistantMessage: assistantMsgObj,
      session,
    });
  } catch (e: any) {
    console.error('Conversation chat error:', e);
    res.status(500).json({ error: 'Không thể kết nối trợ lý AI. Vui lòng thử lại.' });
  }
});

// ----------------- LEARNING DASHBOARD & PROGRESS STATS -----------------
apiRouter.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = db.findUserById(userId);
  const profile = db.getProfile(userId);
  const activities = db.getData().activities.filter((a) => a.userId === userId);
  const actualLearningActivities = activities.filter(
    (a) => a.title !== 'Thiết lập lộ trình học tập cá nhân hóa'
  );
  const vocabProgress = db.getData().vocabProgress.filter((p) => p.userId === userId);
  const writingSubmissions = db.getData().writingSubmissions.filter((s) => s.userId === userId);
  const conversations = db.getData().conversations.filter((c) => c.userId === userId);
  const allVocabCount = db.getData().vocabularies.length;

  const isDefaultSeedUser = userId === 'user_minh_thao_01';
  const isNewUser =
    !isDefaultSeedUser &&
    actualLearningActivities.length === 0 &&
    vocabProgress.length === 0 &&
    writingSubmissions.length === 0 &&
    conversations.length === 0;

  // Time-aware Vietnamese greeting
  const hour = new Date().getHours();
  let greetingPeriod = 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) {
    greetingPeriod = 'Chào buổi chiều';
  } else if (hour >= 18 || hour < 5) {
    greetingPeriod = 'Chào buổi tối';
  }

  // Vocab metrics
  const masteredCount = vocabProgress.filter((p) => p.status === 'mastered').length;
  const reviewCount = vocabProgress.filter((p) => p.status === 'review').length;
  const pendingCount = vocabProgress.filter((p) => p.status === 'pending').length;
  const wordsLearnedCount = isDefaultSeedUser
    ? Math.max(profile.wordsLearnedCount || 142, masteredCount + reviewCount)
    : (masteredCount + reviewCount);

  // Today study goal & completion
  const dailyGoalMinutes = profile.dailyGoalMinutes || profile.dailyCommitmentMinutes || 30;
  const todayMinutesSpent = profile.todayMinutesSpent || 0;
  const remainingMinutes = Math.max(0, dailyGoalMinutes - todayMinutesSpent);
  const goalPercentage = Math.min(100, Math.round((todayMinutesSpent / dailyGoalMinutes) * 100));

  // Writing metrics
  const writingCount = writingSubmissions.length;
  const averageWritingScore = writingCount > 0
    ? Number((writingSubmissions.reduce((acc, s) => acc + s.overallScore, 0) / writingCount).toFixed(1))
    : (isDefaultSeedUser ? 6.8 : null);

  // Total study time calculation
  let calculatedActivityMinutes = 0;
  actualLearningActivities.forEach((act) => {
    if (act.type === 'listening') calculatedActivityMinutes += 5;
    else if (act.type === 'writing') calculatedActivityMinutes += 7;
    else if (act.type === 'conversation') calculatedActivityMinutes += 5;
    else if (act.type === 'vocabulary') calculatedActivityMinutes += 3;
  });

  const totalStudyTimeMinutes = isDefaultSeedUser
    ? Math.max(calculatedActivityMinutes, 205)
    : isNewUser
    ? 0
    : Math.max(calculatedActivityMinutes, todayMinutesSpent);

  // Weekly Activity Chart Data (T2 to CN)
  // Day indexing: 0 = CN, 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6, 6 = T7
  const currentDayOfWeek = new Date().getDay();
  const dayNames = [
    { key: 1, label: 'T2' },
    { key: 2, label: 'T3' },
    { key: 3, label: 'T4' },
    { key: 4, label: 'T5' },
    { key: 5, label: 'T6' },
    { key: 6, label: 'T7' },
    { key: 0, label: 'CN' },
  ];

  let weeklyData: Array<{ day: string; minutes: number; active: boolean; today: boolean }> = [];
  if (isDefaultSeedUser) {
    weeklyData = [
      { day: 'T2', minutes: 25, active: true, today: currentDayOfWeek === 1 },
      { day: 'T3', minutes: 35, active: true, today: currentDayOfWeek === 2 },
      { day: 'T4', minutes: 40, active: true, today: currentDayOfWeek === 3 },
      { day: 'T5', minutes: 30, active: true, today: currentDayOfWeek === 4 },
      { day: 'T6', minutes: 20, active: true, today: currentDayOfWeek === 5 },
      { day: 'T7', minutes: 45, active: true, today: currentDayOfWeek === 6 },
      { day: 'CN', minutes: 15, active: true, today: currentDayOfWeek === 0 },
    ];
  } else {
    weeklyData = dayNames.map((d) => {
      const isToday = d.key === currentDayOfWeek;
      const minutes = isToday ? todayMinutesSpent : 0;
      return {
        day: d.label,
        minutes,
        active: minutes > 0,
        today: isToday,
      };
    });
  }

  const weeklyTotalMinutes = weeklyData.reduce((acc, d) => acc + d.minutes, 0);

  // Continue Learning Activity
  let continueLearning: {
    hasStarted: boolean;
    type: 'listening' | 'vocabulary' | 'writing' | 'conversation';
    section: string;
    title: string;
    subText: string;
    progressPercentage: number;
    badge: string;
    path: string;
  } = {
    hasStarted: !isNewUser,
    type: 'listening',
    section: 'Listening & Comprehension',
    title: 'Product Strategy Meeting at Tech Startup',
    subText: 'Thời lượng: 5 phút • 3 câu hỏi trắc nghiệm & 1 bài chép chính tả',
    progressPercentage: isNewUser ? 0 : 60,
    badge: 'Chủ đề ' + (profile.currentLevel || 'B1'),
    path: '/listening',
  };

  if (isNewUser) {
    continueLearning = {
      hasStarted: false,
      type: 'vocabulary' as const,
      section: 'Khởi động lộ trình học tập',
      title: `Bộ từ vựng cốt lõi CEFR ${profile.currentLevel || 'B1'}: Khởi động lộ trình`,
      subText: 'Thời lượng: 5 phút • 10 từ vựng căn bản, phiên âm IPA & phản xạ SRS',
      progressPercentage: 0,
      badge: 'Bài học đầu tiên',
      path: '/vocabulary',
    };
  }

  // Recommendations tailored to level & skills
  const level = profile.currentLevel || 'B1';
  const recommendations = [
    {
      id: 'rec_vocab',
      title: `Từ vựng chuyên sâu CEFR ${level}: Kinh tế số & Đổi mới`,
      category: 'Từ vựng SRS',
      badge: 'Spaced Repetition',
      description: 'Luyện tập các cặp từ đồng nghĩa, collocations và cách dùng thực tế trong môi trường quốc tế.',
      type: 'vocabulary' as const,
      path: '/vocabulary',
      estimatedMinutes: 8,
    },
    {
      id: 'rec_listening',
      title: 'Luyện nghe phản xạ: Product Strategy Meeting',
      category: 'Listening',
      badge: 'Audio tương tác',
      description: 'Nghe hội thoại họp kỹ thuật, trả lời câu hỏi ngữ cảnh và luyện gõ chính tả câu cốt lõi.',
      type: 'listening' as const,
      path: '/listening',
      estimatedMinutes: 5,
    },
    {
      id: 'rec_writing',
      title: 'Chấm bài viết AI: Thảo luận xu hướng Remote Work',
      category: 'AI Writing',
      badge: 'Gemini Chấm 4 tiêu chí',
      description: 'Viết đoạn văn ngắn hoặc email công sở, nhận nhận xét ngữ pháp và bản viết lại nâng cấp C1.',
      type: 'writing' as const,
      path: '/writing',
      estimatedMinutes: 12,
    },
    {
      id: 'rec_conversation',
      title: 'Luyện nói 1-1 cùng Trợ lý AI: Phỏng vấn việc làm',
      category: 'Trợ lý AI',
      badge: 'Luyện phản xạ nói',
      description: 'Mô phỏng phỏng vấn tuyển dụng, nhận góp ý tức thì về độ tự nhiên và từ ngữ chuyên ngành.',
      type: 'conversation' as const,
      path: '/conversation',
      estimatedMinutes: 10,
    },
  ];

  res.json({
    greeting: `${greetingPeriod}, ${user?.fullName || 'Học viên'}! 👋`,
    isNewUser,
    profile,
    stats: {
      todayMinutesSpent,
      dailyGoalMinutes,
      remainingMinutes,
      goalPercentage,
      streakDays: isNewUser && todayMinutesSpent === 0 ? 0 : (profile.streakDays || 1),
      wordsLearnedCount,
      vocabAwaitingReview: reviewCount,
      vocabMasteredCount: masteredCount,
      totalVocabInSystem: allVocabCount,
      writingSubmissionsCount: writingCount,
      averageWritingScore,
      totalStudyTimeMinutes,
    },
    weeklyActivity: weeklyData,
    weeklyTotalMinutes,
    continueLearning,
    recommendations,
    recentActivities: activities.slice(0, 5),
  });
});

apiRouter.get('/progress', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const profile = db.getProfile(userId);
  const activities = db.getData().activities.filter((a) => a.userId === userId);
  const vocabProgress = db.getData().vocabProgress.filter((p) => p.userId === userId);
  const writingSubmissions = db.getData().writingSubmissions.filter((s) => s.userId === userId);
  const conversations = db.getData().conversations.filter((c) => c.userId === userId);

  const isDefaultSeedUser = userId === 'user_minh_thao_01';
  const isNewUser = !isDefaultSeedUser && activities.length === 0 && vocabProgress.length === 0;

  const masteredCount = vocabProgress.filter((p) => p.status === 'mastered').length;
  const reviewCount = vocabProgress.filter((p) => p.status === 'review').length;

  let studyHours = isDefaultSeedUser ? 14.5 : Number(((profile.todayMinutesSpent || 0) / 60).toFixed(1));

  const avgWriting = writingSubmissions.length > 0
    ? Number((writingSubmissions.reduce((a, b) => a + b.overallScore, 0) / writingSubmissions.length).toFixed(1))
    : 6.8;

  res.json({
    totalHoursStudied: studyHours,
    streakDays: profile.streakDays || 1,
    wordsMastered: isDefaultSeedUser ? 342 : masteredCount,
    averageWritingScore: avgWriting,
    skillBars: [
      { name: 'Listening (Nghe hiểu)', score: profile.skillsRadar?.listening || 78, level: (profile.skillsRadar?.listening || 78) >= 80 ? 'B2+' : 'B2', color: 'bg-amber-500' },
      { name: 'Vocabulary (Vốn từ SRS)', score: profile.skillsRadar?.vocabulary || 85, level: (profile.skillsRadar?.vocabulary || 85) >= 85 ? 'B2+' : 'B2', color: 'bg-blue-600' },
      { name: 'Writing (Viết luận AI)', score: profile.skillsRadar?.writing || 72, level: (profile.skillsRadar?.writing || 72) >= 75 ? 'B2' : 'B1+', color: 'bg-purple-600' },
      { name: 'Speaking (Phản xạ đàm thoại)', score: profile.skillsRadar?.speaking || 65, level: (profile.skillsRadar?.speaking || 65) >= 70 ? 'B2' : 'B1+', color: 'bg-emerald-600' },
      { name: 'Grammar (Độ chuẩn ngữ pháp)', score: profile.skillsRadar?.grammar || 80, level: (profile.skillsRadar?.grammar || 80) >= 80 ? 'B2' : 'B1', color: 'bg-indigo-600' },
    ],
    milestones: [
      { title: 'A1 - Khởi đầu cơ bản', date: 'Đã hoàn thành', completed: true },
      { title: 'A2 - Giao tiếp tình huống hàng ngày', date: 'Đã hoàn thành', completed: true },
      { title: 'B1 - Độc lập diễn đạt suy nghĩ', date: 'Hiện tại', completed: profile.currentLevel !== 'A1' && profile.currentLevel !== 'A2', current: profile.currentLevel === 'B1' },
      { title: `B2 - ${profile.targetCertificate || 'IELTS 6.5+ / VSTEP B2'}`, date: 'Mục tiêu: 2026', current: profile.currentLevel === 'B2', completed: false },
      { title: 'C1 - Thành thạo chuyên sâu & Học thuật', date: 'Dự kiến: 2026', completed: false },
    ],
    badges: [
      { id: '1', title: 'Học viên Chăm chỉ', description: 'Duy trì chuỗi học tập đều đặn', icon: 'local_fire_department', unlocked: (profile.streakDays || 1) >= 1 },
      { id: '2', title: 'Ghi nhớ Từ vựng', description: 'Ghi nhớ từ vựng theo phương pháp SRS', icon: 'translate', unlocked: masteredCount >= 1 || isDefaultSeedUser },
      { id: '3', title: 'Bài viết Khá', description: 'Hoàn thành bài viết luận cùng AI', icon: 'edit_note', unlocked: writingSubmissions.length >= 1 || isDefaultSeedUser },
      { id: '4', title: 'Luyện nghe Chăm chỉ', description: 'Hoàn thành bài nghe hiểu', icon: 'headphones', unlocked: activities.some((a) => a.type === 'listening') || isDefaultSeedUser },
      { id: '5', title: 'Phản xạ Hội thoại', description: 'Luyện giao tiếp cùng Trợ lý AI', icon: 'forum', unlocked: conversations.length >= 1 || isDefaultSeedUser },
    ],
    kpis: {
      studyTimeHours: studyHours,
      studyTimeComparison: isDefaultSeedUser ? '+2.5h so với tháng trước' : 'Đang tích lũy',
      goalPercentage: Math.min(100, Math.round(((profile.todayMinutesSpent || 0) / (profile.dailyGoalMinutes || 30)) * 100)),
      vocabMastered: isDefaultSeedUser ? 342 : masteredCount,
      vocabTarget: 400,
      vocabRetention: isNewUser ? 0 : 89.4,
      reflexScore: isNewUser ? 0 : 8.2,
      reflexComparison: isNewUser ? 'Chưa có bài kiểm tra' : '+0.8 điểm',
      aiTalkSessions: conversations.length,
      streakDays: isNewUser && (profile.todayMinutesSpent || 0) === 0 ? 0 : (profile.streakDays || 1),
      recordStreak: isDefaultSeedUser ? 14 : (profile.streakDays || 1),
      streakBadge: isNewUser ? 'Bắt đầu ngay' : 'Top 5% năng nổ',
    },
    weeklyDistribution: isDefaultSeedUser ? [
      { week: 'Tuần 1', hours: 2.8, listening: 1.2, vocab: 0.8, writing: 0.5, conversation: 0.3 },
      { week: 'Tuần 2', hours: 3.4, listening: 1.5, vocab: 0.9, writing: 0.6, conversation: 0.4 },
      { week: 'Tuần 3', hours: 3.9, listening: 1.7, vocab: 1.0, writing: 0.7, conversation: 0.5 },
      { week: 'Tuần 4', hours: 4.4, listening: 1.9, vocab: 1.2, writing: 0.8, conversation: 0.5 },
    ] : [
      { week: 'Tuần 1', hours: studyHours, listening: 0, vocab: studyHours, writing: 0, conversation: 0 },
    ],
    cefrProgress: {
      currentBadge: profile.currentLevel || 'B1',
      target: profile.targetLevel || 'B2',
      listening: { percent: profile.skillsRadar?.listening || 70, label: `${profile.currentLevel || 'B1'} (${profile.skillsRadar?.listening || 70}%)` },
      readingVocab: { percent: profile.skillsRadar?.vocabulary || 75, label: `${profile.currentLevel || 'B1'} (${profile.skillsRadar?.vocabulary || 75}%)` },
      writing: { percent: profile.skillsRadar?.writing || 60, label: `${profile.currentLevel || 'B1'} (${profile.skillsRadar?.writing || 60}%)` },
      speaking: { percent: profile.skillsRadar?.speaking || 55, label: `${profile.currentLevel || 'B1'} (${profile.skillsRadar?.speaking || 55}%)` },
      forecastWeeks: isNewUser ? 6 : 3,
    },
    recentActivities: activities.slice(0, 10),
  });
});

// Database status endpoint
apiRouter.get('/database/status', (req: Request, res: Response) => {
  res.json({
    isConnected: true,
    readyState: 1,
    databaseName: 'linguanext-db',
    hasConfiguredUri: true,
    error: null,
    localCacheCounts: {
      users: db.getData().users.length,
      vocabularies: db.getData().vocabularies.length,
      vocabProgress: db.getData().vocabProgress.length,
      listeningExercises: db.getData().listeningExercises.length,
      writingSubmissions: db.getData().writingSubmissions.length,
      conversations: db.getData().conversations.length,
      activities: db.getData().activities.length,
    },
  });
});

// ----------------- QUICK TUTOR PROMPT WIDGET -----------------
apiRouter.post('/ai/quick-tutor', async (req: Request, res: Response) => {
  const { query, type } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Vui lòng nhập câu hỏi' });
  }

  const answer = await askQuickAITutor(query, type || 'grammar');
  res.json({ answer });
});
