export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
}

export interface LearningProfile {
  userId: string;
  currentLevel: string;
  levelLabel?: string;
  targetLevel: string;
  targetCertificate: string;
  certificateTargetDate?: string;
  priorityTopic?: string;
  priorityTopicDesc?: string;
  dailyCommitmentMinutes?: number;
  dailyGoalMinutes?: number;
  todayMinutesSpent?: number;
  todayMinutesStudied?: number;
  streakDays?: number;
  wordsLearnedCount?: number;
  phone?: string;
  institution?: string;
  gender?: string;
  birthDate?: string;
  bio?: string;
  skillsRadar?: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
    grammar: number;
    vocabulary: number;
  };
  learningGoals?: string[];
  primaryGoal?: string;
  focusSkills?: string[];
  onboardingCompleted?: boolean;
  updatedAt?: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  cefrLevel: string;
  frequency?: string;
  vietnameseMeaning: string;
  wordFamily?: Array<{ form: string; type: string; meaning: string }>;
  collocations?: Array<{ phrase: string; meaning?: string; example?: string } | string>;
  exampleEn?: string;
  exampleSentence?: string;
  exampleVi?: string;
  exampleTranslation?: string;
  aiTip?: string;
  topic: string;
  srsLevel?: number;
  status?: 'mastered' | 'review' | 'pending';
  nextReviewText?: string;
  isFavorite?: boolean;
}

export interface ListeningExercise {
  id: string;
  title: string;
  section?: string;
  speaker?: string;
  speakerRole?: string;
  speakerAvatar?: string;
  duration: string;
  audioUrl?: string;
  level: string;
  difficulty?: string;
  accent?: string;
  topic?: string;
  audioTranscriptEn?: string;
  audioTranscriptVi?: string;
  transcript?: Array<{ timestamp: string; speaker?: string; text: string; vietnamese?: string }>;
  paragraphWithBlanks?: string;
  blanks: Array<{
    id: string;
    index: number;
    targetWord: string;
    phonetic?: string;
    partOfSpeech?: string;
    meaning?: string;
    hint?: string;
    sentence?: string;
  }>;
  fillInBlanks: Array<{
    id: number | string;
    sentence: string;
    targetWord: string;
    hint?: string;
  }>;
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  keyVocab?: Array<{
    word: string;
    phonetic: string;
    partOfSpeech: string;
    meaning: string;
    status: 'correct' | 'active' | 'pending';
  }>;
  collocationHighlight?: {
    phrase: string;
    meaning: string;
  };
  insights?: {
    structure: string;
    structureExplanation: string;
    pronunciation: string;
    pronunciationExplanation: string;
  };
}

export interface WritingSubmission {
  id: string;
  userId: string;
  topicId?: string;
  topicTitle?: string;
  topic?: string;
  prompt?: string;
  content: string;
  wordCount: number;
  overallScore: number;
  grammarScore?: number;
  lexicalScore?: number;
  coherenceScore?: number;
  toneScore?: number;
  criteriaScores?: {
    taskAchievement: string | number;
    coherence: string | number;
    lexicalResource: string | number;
    grammar: string | number;
  };
  cefrAssessment?: string;
  feedback?: string;
  errors?: Array<{
    type: string;
    original: string;
    suggestion: string;
    explanation: string;
    section?: string;
  }>;
  corrections?: Array<{
    type?: string;
    original: string;
    suggestion: string;
    explanation: string;
  }>;
  vocabUpgrades?: Array<{
    original: string;
    suggestion: string;
    level: string;
  }>;
  vocabularySuggestions?: Array<{
    originalWord: string;
    suggestedWord: string;
    context: string;
  }>;
  polishedEssay?: string;
  improvedVersion?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  translation?: string;
  audioDuration?: string;
  naturalnessScore?: number;
  praise?: string;
  suggestion?: string;
  feedback?: string;
  suggestedReply?: string;
  suggestedAnswers?: string[];
  timestamp?: string;
  createdAt?: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  topicId?: string;
  topicTitle?: string;
  topic?: string;
  topicBadge?: string;
  tutorName?: string;
  tutorAccent?: string;
  tutorAvatar?: string;
  messages: ChatMessage[];
  score?: {
    overall: number;
    fluency: number;
    pronunciation: number;
    lexical: number;
  };
  scoredWords?: Array<{ word: string; phonetic: string; points: number }>;
  grammarNotes?: string[];
  createdAt: string;
}

export interface UserSettings {
  userId?: string;
  speechSpeed?: number;
  speechRate?: number;
  preferredAccent?: 'us' | 'uk' | string;
  audioAccent?: 'US' | 'UK' | 'AU' | string;
  grammarDepth?: 'short' | 'detail' | 'academic';
  autoParaphrase?: boolean;
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string;
  streakProtectionAlert?: boolean;
  weeklyEmailDigest?: boolean;
  emailNotifications?: boolean;
  soundEffects?: boolean;
  uiLanguage?: 'vi' | 'en';
  themeMode?: 'light' | 'dark';
}

export interface LearningActivity {
  id: string;
  userId: string;
  type: 'writing' | 'conversation' | 'listening' | 'vocabulary';
  title: string;
  badge: string;
  scoreText: string;
  subText: string;
  timestamp: string;
}

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface ProgressReport {
  kpis?: {
    studyTimeHours: number;
    studyTimeComparison: string;
    goalPercentage: number;
    vocabMastered: number;
    vocabTarget: number;
    vocabRetention: number;
    reflexScore: number;
    reflexComparison: string;
    aiTalkSessions: number;
    streakDays: number;
    recordStreak: number;
    streakBadge: string;
  };
  totalHoursStudied?: number;
  streakDays?: number;
  wordsMastered?: number;
  averageWritingScore?: number;
  badges?: BadgeItem[];
  weeklyDistribution?: Array<{
    week: string;
    hours: number;
    listening: number;
    vocab: number;
    writing: number;
    conversation: number;
  }>;
  cefrProgress?: {
    currentBadge: string;
    target: string;
    listening: { percent: number; label: string };
    readingVocab: { percent: number; label: string };
    writing: { percent: number; label: string };
    speaking: { percent: number; label: string };
    forecastWeeks: number;
  };
  recentActivities?: LearningActivity[];
}

export interface DashboardStats {
  todayMinutesSpent: number;
  dailyGoalMinutes: number;
  remainingMinutes: number;
  goalPercentage: number;
  streakDays: number;
  isNewUser: boolean;
  wordsLearnedCount: number;
  vocabAwaitingReview: number;
  vocabMasteredCount: number;
  totalVocabInSystem: number;
  writingSubmissionsCount: number;
  averageWritingScore: string | number | null;
  totalStudyTimeMinutes: number;
}

export interface ContinueLearningItem {
  hasStarted: boolean;
  type: 'listening' | 'vocabulary' | 'writing' | 'conversation';
  section: string;
  title: string;
  subText: string;
  progressPercentage: number;
  badge: string;
  path: string;
}

export interface WeeklyActivityDay {
  day: string;
  minutes: number;
  active: boolean;
  today: boolean;
}

export interface LearningRecommendation {
  id: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  type: 'listening' | 'vocabulary' | 'writing' | 'conversation';
  path: string;
  estimatedMinutes: number;
}

export interface DashboardData {
  greeting: string;
  isNewUser: boolean;
  profile: LearningProfile;
  stats: DashboardStats;
  weeklyActivity: WeeklyActivityDay[];
  weeklyTotalMinutes: number;
  continueLearning: ContinueLearningItem;
  recommendations: LearningRecommendation[];
  recentActivities: LearningActivity[];
}
