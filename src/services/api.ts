import {
  User,
  LearningProfile,
  VocabularyItem,
  ListeningExercise,
  WritingSubmission,
  ConversationSession,
  UserSettings,
  ProgressReport,
  DashboardData,
} from '../types';

const TOKEN_KEY = 'linguanext_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const clearToken = removeToken;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Lỗi mạng (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const data = await request<{ token: string; user: User; profile: LearningProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  async register(fullName: string, email: string, password: string) {
    const data = await request<{ token: string; user: User; profile: LearningProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
    setToken(data.token);
    return data;
  },

  async getMe() {
    return request<{ user: User; profile: LearningProfile; settings: UserSettings }>('/api/auth/me');
  },

  async getCurrentUser() {
    const res = await this.getMe();
    return { user: res.user, profile: res.profile };
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
    }
  },

  // Profile & Onboarding
  async getProfile(): Promise<LearningProfile> {
    return request<LearningProfile>('/api/profile');
  },

  async updateProfile(updates: Partial<LearningProfile>): Promise<LearningProfile> {
    const res = await request<{ success: boolean; profile: LearningProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.profile;
  },

  async updateUser(data: { fullName?: string; avatar?: string }): Promise<User> {
    const res = await request<{ success: boolean; user: User }>('/api/user', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.user;
  },

  async saveOnboarding(data: {
    currentLevel?: string;
    targetLevel?: string;
    targetCertificate?: string;
    dailyGoalMinutes?: number;
    dailyCommitmentMinutes?: number;
    learningGoals?: string[];
    primaryGoal?: string;
    focusSkills?: string[];
  }): Promise<LearningProfile> {
    const res = await request<{ success: boolean; profile: LearningProfile }>('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.profile;
  },

  async submitOnboarding(data: {
    currentLevel?: string;
    targetLevel?: string;
    targetCertificate?: string;
    dailyGoalMinutes?: number;
    learningGoals?: string[];
    primaryGoal?: string;
    focusSkills?: string[];
  }): Promise<{ success: boolean; profile: LearningProfile }> {
    return request<{ success: boolean; profile: LearningProfile }>('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Settings
  async getSettings(): Promise<UserSettings> {
    return request<UserSettings>('/api/settings');
  },

  async saveSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const res = await request<{ success: boolean; settings: UserSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.settings;
  },

  async updateSettings(updates: Partial<UserSettings>): Promise<{ success: boolean; settings: UserSettings }> {
    return request<{ success: boolean; settings: UserSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Vocabulary
  async getVocabulary(): Promise<{ items: VocabularyItem[]; stats?: any }> {
    const res = await request<any>('/api/vocabulary');
    if (Array.isArray(res)) {
      return { items: res };
    }
    return {
      items: res?.items || [],
      stats: res?.stats,
    };
  },

  async reviewVocabularySRS(vocabId: string, rating: number): Promise<{ success: boolean; progress: any }> {
    return request<{ success: boolean; progress: any }>('/api/vocabulary/review', {
      method: 'POST',
      body: JSON.stringify({ vocabId, rating }),
    });
  },

  async reviewVocab(vocabId: string, rating: number): Promise<{ success: boolean; progress: any }> {
    return this.reviewVocabularySRS(vocabId, rating);
  },

  async toggleVocabBookmark(vocabId: string): Promise<{ success: boolean; isFavorite: boolean }> {
    return request<{ success: boolean; isFavorite: boolean }>('/api/vocabulary/bookmark', {
      method: 'POST',
      body: JSON.stringify({ vocabId }),
    });
  },

  async submitVocabQuiz(payload: {
    score: number;
    total: number;
    results: Array<{ vocabId: string; isCorrect: boolean }>;
  }): Promise<{ success: boolean; todayMinutesSpent?: number }> {
    return request<{ success: boolean; todayMinutesSpent?: number }>('/api/vocabulary/quiz-submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async addVocabulary(data: {
    word: string;
    vietnameseMeaning: string;
    phonetic?: string;
    partOfSpeech?: string;
    cefrLevel?: string;
    topic?: string;
    exampleEn?: string;
    exampleVi?: string;
    aiTip?: string;
  }): Promise<{ success: boolean; item: VocabularyItem }> {
    return request<{ success: boolean; item: VocabularyItem }>('/api/vocabulary', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateVocabulary(id: string, data: Partial<VocabularyItem>): Promise<{ success: boolean; item: VocabularyItem }> {
    return request<{ success: boolean; item: VocabularyItem }>(`/api/vocabulary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteVocabulary(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/vocabulary/${id}`, {
      method: 'DELETE',
    });
  },

  // Listening
  async getListeningExercises(): Promise<ListeningExercise[]> {
    return request<ListeningExercise[]>('/api/listening');
  },

  async submitListening(exerciseId: string, payload: any) {
    return request<any>('/api/listening/submit', {
      method: 'POST',
      body: JSON.stringify({
        exerciseId,
        answers: payload.answers || payload,
        submissionId: payload.submissionId,
      }),
    });
  },

  async resetListening(exerciseId: string) {
    return request<any>('/api/listening/reset', {
      method: 'POST',
      body: JSON.stringify({ exerciseId }),
    });
  },

  // Writing
  async getWritingHistory(): Promise<WritingSubmission[]> {
    return request<WritingSubmission[]>('/api/writing/submissions');
  },

  async getWritingSubmissions(): Promise<WritingSubmission[]> {
    return this.getWritingHistory();
  },

  async deleteWritingSubmission(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/writing/submissions/${id}`, {
      method: 'DELETE',
    });
  },

  async analyzeWriting(topic: string, content: string): Promise<WritingSubmission> {
    const res = await request<{
      success: boolean;
      submission: WritingSubmission;
      todayMinutesSpent: number;
    }>('/api/writing/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        topicId: 'custom',
        topicTitle: topic.slice(0, 50),
        prompt: topic,
        content,
      }),
    });
    return res.submission;
  },

  async evaluateWriting(data: {
    topicId: string;
    topicTitle: string;
    prompt: string;
    content: string;
  }): Promise<{ success: boolean; submission: WritingSubmission; todayMinutesSpent: number }> {
    return request<{ success: boolean; submission: WritingSubmission; todayMinutesSpent: number }>('/api/writing/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Conversation
  async getConversationSessions(): Promise<ConversationSession[]> {
    return request<ConversationSession[]>('/api/conversation/sessions');
  },

  async getConversations(): Promise<ConversationSession[]> {
    return this.getConversationSessions();
  },

  async createConversationSession(topicTitle: string): Promise<ConversationSession> {
    const res = await request<{
      success: boolean;
      session: ConversationSession;
    }>('/api/conversation/chat', {
      method: 'POST',
      body: JSON.stringify({
        topicTitle,
        topicId: topicTitle.toLowerCase().replace(/\s+/g, '_'),
        userMessage: 'Hello! I am ready to practice.',
      }),
    });
    return res.session;
  },

  async sendConversationMessage(sessionId: string, userMessage: string): Promise<ConversationSession> {
    const res = await request<{
      success: boolean;
      session: ConversationSession;
    }>('/api/conversation/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        userMessage,
      }),
    });
    return res.session;
  },

  async deleteConversationSession(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/conversation/sessions/${id}`, {
      method: 'DELETE',
    });
  },

  // Dashboard & Progress
  async getDashboardData(): Promise<DashboardData> {
    return request<DashboardData>('/api/dashboard');
  },

  async getProgress(): Promise<ProgressReport> {
    return request<ProgressReport>('/api/progress');
  },

  // Quick Tutor Assistant
  async askQuickAITutor(query: string, type: string = 'grammar'): Promise<{ answer: string }> {
    return request<{ answer: string }>('/api/ai/quick-tutor', {
      method: 'POST',
      body: JSON.stringify({ query, type }),
    });
  },

  async askQuickTutor(query: string, type: string = 'grammar'): Promise<{ answer: string }> {
    return this.askQuickAITutor(query, type);
  },

  // Database status
  async getDatabaseStatus(): Promise<{
    isConnected: boolean;
    readyState: number;
    databaseName: string | null;
    hasConfiguredUri: boolean;
    error: string | null;
    localCacheCounts: {
      users: number;
      vocabularies: number;
      vocabProgress: number;
      listeningExercises: number;
      writingSubmissions: number;
      activities: number;
    };
  }> {
    return request('/api/database/status');
  },
};

