import mongoose, { Schema } from 'mongoose';
import {
  User,
  LearningProfile,
  VocabularyItem,
  UserVocabProgress,
  ListeningExercise,
  WritingSubmission,
  ConversationSession,
  UserSettings,
  LearningActivity,
} from '../db.js';

// --- User Schema ---
const UserSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// --- Learning Profile Schema ---
const LearningProfileSchema = new Schema<LearningProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    currentLevel: { type: String, default: 'B1' },
    levelLabel: { type: String, default: 'B1 Intermediate' },
    targetLevel: { type: String, default: 'B2 Vantage' },
    targetCertificate: { type: String, default: 'IELTS 6.5+ / VSTEP B2' },
    certificateTargetDate: { type: String, default: 'Q4 / 2025' },
    priorityTopic: { type: String, default: 'Tech Job Interview & Công sở' },
    priorityTopicDesc: { type: String, default: '' },
    dailyCommitmentMinutes: { type: Number, default: 20 },
    todayMinutesSpent: { type: Number, default: 0 },
    streakDays: { type: Number, default: 1 },
    phone: { type: String, default: '' },
    institution: { type: String, default: '' },
    gender: { type: String, default: 'Khác / Không công khai' },
    birthDate: { type: String, default: '2003-01-01' },
    bio: { type: String, default: '' },
    skillsRadar: {
      listening: { type: Number, default: 70 },
      reading: { type: Number, default: 70 },
      writing: { type: Number, default: 60 },
      speaking: { type: Number, default: 55 },
      grammar: { type: Number, default: 65 },
      vocabulary: { type: Number, default: 75 },
    },
    dailyGoalMinutes: { type: Number, default: 20 },
    learningGoals: { type: [String], default: [] },
    primaryGoal: { type: String, default: '' },
    focusSkills: { type: [String], default: [] },
    wordsLearnedCount: { type: Number, default: 0 },
    onboardingCompleted: { type: Boolean, default: true },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// --- Vocabulary Item Schema ---
const VocabularyItemSchema = new Schema<VocabularyItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    word: { type: String, required: true, index: true },
    phonetic: { type: String, default: '' },
    partOfSpeech: { type: String, default: '' },
    cefrLevel: { type: String, default: 'B1' },
    frequency: { type: String, default: '' },
    vietnameseMeaning: { type: String, required: true },
    wordFamily: [
      {
        form: String,
        type: { type: String },
        meaning: String,
      },
    ],
    collocations: [
      {
        phrase: String,
        meaning: String,
        example: String,
      },
    ],
    exampleEn: { type: String, default: '' },
    exampleVi: { type: String, default: '' },
    aiTip: { type: String, default: '' },
    topic: { type: String, default: 'General' },
  },
  { timestamps: true }
);

// --- User Vocab Progress Schema ---
const UserVocabProgressSchema = new Schema<UserVocabProgress>(
  {
    userId: { type: String, required: true, index: true },
    vocabId: { type: String, required: true, index: true },
    srsLevel: { type: Number, default: 0 },
    status: { type: String, enum: ['mastered', 'review', 'pending'], default: 'pending' },
    nextReviewText: { type: String, default: 'Chưa học' },
    isFavorite: { type: Boolean, default: false },
    repetitions: { type: Number, default: 0 },
    lastReviewedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);
UserVocabProgressSchema.index({ userId: 1, vocabId: 1 }, { unique: true });

// --- Listening Exercise Schema ---
const ListeningExerciseSchema = new Schema<ListeningExercise>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    section: { type: String, default: '' },
    speaker: { type: String, default: '' },
    speakerRole: { type: String, default: '' },
    speakerAvatar: { type: String, default: '' },
    duration: { type: String, default: '3:00' },
    audioUrl: { type: String, default: '' },
    level: { type: String, default: 'B1' },
    difficulty: { type: String, default: 'Trung bình' },
    accent: { type: String, default: 'Mỹ (US)' },
    topic: { type: String, default: 'General' },
    audioTranscriptEn: { type: String, default: '' },
    audioTranscriptVi: { type: String, default: '' },
    transcript: [
      {
        timestamp: String,
        speaker: String,
        text: String,
        vietnamese: String,
      },
    ],
    paragraphWithBlanks: { type: String, default: '' },
    blanks: [
      {
        id: String,
        index: Number,
        targetWord: String,
        phonetic: String,
        partOfSpeech: String,
        meaning: String,
        hint: String,
      },
    ],
    fillInBlanks: [
      {
        id: Schema.Types.Mixed,
        sentence: String,
        targetWord: String,
        hint: String,
      },
    ],
    questions: [
      {
        id: Number,
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
      },
    ],
    keyVocab: [
      {
        word: String,
        phonetic: String,
        partOfSpeech: String,
        meaning: String,
        status: String,
      },
    ],
    collocationHighlight: {
      phrase: String,
      meaning: String,
    },
    insights: {
      structure: String,
      structureExplanation: String,
      pronunciation: String,
      pronunciationExplanation: String,
    },
  },
  { timestamps: true }
);

// --- Writing Submission Schema ---
const WritingSubmissionSchema = new Schema<WritingSubmission>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    topicId: { type: String, default: '' },
    topicTitle: { type: String, default: '' },
    prompt: { type: String, default: '' },
    content: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    lexicalScore: { type: Number, default: 0 },
    coherenceScore: { type: Number, default: 0 },
    toneScore: { type: Number, default: 0 },
    cefrAssessment: { type: String, default: 'B1' },
    errors: [
      {
        type: { type: String },
        original: String,
        suggestion: String,
        explanation: String,
        section: String,
      },
    ],
    vocabUpgrades: [
      {
        original: String,
        suggestion: String,
        level: String,
      },
    ],
    polishedEssay: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

// --- Conversation Session Schema ---
const ConversationSessionSchema = new Schema<ConversationSession>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    topicId: { type: String, default: '' },
    topicTitle: { type: String, default: '' },
    topicBadge: { type: String, default: '' },
    tutorName: { type: String, default: '' },
    tutorAccent: { type: String, default: '' },
    tutorAvatar: { type: String, default: '' },
    messages: [
      {
        id: String,
        role: String,
        content: String,
        translation: String,
        audioDuration: String,
        naturalnessScore: Number,
        praise: String,
        suggestion: String,
        suggestedAnswers: [String],
        timestamp: String,
      },
    ],
    score: {
      overall: Number,
      fluency: Number,
      pronunciation: Number,
      lexical: Number,
    },
    scoredWords: [
      {
        word: String,
        phonetic: String,
        points: Number,
      },
    ],
    grammarNotes: [String],
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// --- User Settings Schema ---
const UserSettingsSchema = new Schema<UserSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    speechSpeed: { type: Number, default: 1.0 },
    preferredAccent: { type: String, default: 'us' },
    grammarDepth: { type: String, default: 'detail' },
    autoParaphrase: { type: Boolean, default: true },
    dailyReminderEnabled: { type: Boolean, default: true },
    dailyReminderTime: { type: String, default: '20:00' },
    streakProtectionAlert: { type: Boolean, default: true },
    weeklyEmailDigest: { type: Boolean, default: true },
    soundEffects: { type: Boolean, default: true },
    uiLanguage: { type: String, default: 'vi' },
    themeMode: { type: String, default: 'light' },
  },
  { timestamps: true }
);

// --- Learning Activity Schema ---
const LearningActivitySchema = new Schema<LearningActivity>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    badge: { type: String, default: '' },
    scoreText: { type: String, default: '' },
    subText: { type: String, default: '' },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// --- Listening Progress Schema ---
const UserListeningProgressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    exerciseId: { type: String, required: true, index: true },
    isCompleted: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    scorePercent: { type: Number, default: 0 },
    mcqAnswers: { type: Schema.Types.Mixed, default: {} },
    dictationAnswers: { type: Schema.Types.Mixed, default: {} },
    completedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);
UserListeningProgressSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

export const UserModel = mongoose.model<User>('User', UserSchema);
export const LearningProfileModel = mongoose.model<LearningProfile>('LearningProfile', LearningProfileSchema);
export const VocabularyModel = mongoose.model<VocabularyItem>('Vocabulary', VocabularyItemSchema);
export const VocabProgressModel = mongoose.model<UserVocabProgress>('VocabProgress', UserVocabProgressSchema);
export const ListeningExerciseModel = mongoose.model<ListeningExercise>('ListeningExercise', ListeningExerciseSchema);
export const ListeningProgressModel = mongoose.model('ListeningProgress', UserListeningProgressSchema);
export const WritingSubmissionModel = mongoose.model<WritingSubmission>('WritingSubmission', WritingSubmissionSchema);
export const ConversationSessionModel = mongoose.model<ConversationSession>('ConversationSession', ConversationSessionSchema);
export const UserSettingsModel = mongoose.model<UserSettings>('UserSettings', UserSettingsSchema);
export const LearningActivityModel = mongoose.model<LearningActivity>('LearningActivity', LearningActivitySchema);
