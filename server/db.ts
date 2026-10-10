import fs from 'fs';
import path from 'path';
import {
  mongoUpsertUser,
  mongoUpsertProfile,
  mongoUpsertSettings,
  mongoUpsertVocabProgress,
  mongoAddActivity,
} from './mongo.js';

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  avatar: string;
  createdAt: string;
}

export interface LearningProfile {
  userId: string;
  currentLevel: string; // e.g. 'B1'
  levelLabel: string; // 'B1 Intermediate'
  targetLevel: string; // 'B2 Vantage'
  targetCertificate: string; // 'IELTS 6.5+ / VSTEP B2'
  certificateTargetDate: string; // 'Q4 / 2025'
  priorityTopic: string; // 'Tech Job Interview & Công sở'
  priorityTopicDesc: string;
  dailyCommitmentMinutes: number; // 20
  todayMinutesSpent: number; // 15
  streakDays: number; // 7
  phone: string;
  institution: string; // 'Đại học Công Nghiệp Hà Nội'
  gender: string; // 'Nữ'
  birthDate: string; // '15/08/2003'
  bio: string;
  skillsRadar: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
    grammar: number;
    vocabulary: number;
  };
  dailyGoalMinutes?: number;
  learningGoals?: string[];
  primaryGoal?: string;
  focusSkills?: string[];
  wordsLearnedCount?: number;
  onboardingCompleted?: boolean;
  updatedAt: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  cefrLevel: string;
  frequency: string;
  vietnameseMeaning: string;
  wordFamily: Array<{ form: string; type: string; meaning: string }>;
  collocations: Array<{ phrase: string; meaning: string; example: string }>;
  exampleEn: string;
  exampleVi: string;
  aiTip: string;
  topic: string;
}

export interface UserVocabProgress {
  userId: string;
  vocabId: string;
  srsLevel: number; // 0..5
  status: 'mastered' | 'review' | 'pending';
  nextReviewText: string;
  isFavorite: boolean;
  repetitions: number;
  lastReviewedAt: string;
}

export interface ListeningExercise {
  id: string;
  title: string;
  section: string;
  speaker: string;
  speakerRole: string;
  speakerAvatar: string;
  duration: string;
  audioUrl?: string;
  level: string;
  difficulty: string;
  accent: string;
  topic?: string;
  audioTranscriptEn: string;
  audioTranscriptVi: string;
  transcript?: Array<{
    timestamp: string;
    speaker?: string;
    text: string;
    vietnamese?: string;
  }>;
  paragraphWithBlanks: string;
  blanks: Array<{
    id: string;
    index: number;
    targetWord: string;
    phonetic: string;
    partOfSpeech: string;
    meaning: string;
    hint: string;
  }>;
  fillInBlanks?: Array<{
    id: number | string;
    sentence: string;
    targetWord: string;
    hint?: string;
  }>;
  questions?: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  keyVocab: Array<{
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
  topicId: string;
  topicTitle: string;
  prompt: string;
  content: string;
  wordCount: number;
  overallScore: number;
  grammarScore: number;
  lexicalScore: number;
  coherenceScore: number;
  toneScore: number;
  cefrAssessment: string;
  errors: Array<{
    type: string;
    original: string;
    suggestion: string;
    explanation: string;
    section: string;
  }>;
  vocabUpgrades: Array<{
    original: string;
    suggestion: string;
    level: string;
  }>;
  polishedEssay: string;
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
  suggestedAnswers?: string[];
  timestamp: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  topicBadge: string;
  tutorName: string;
  tutorAccent: string;
  tutorAvatar: string;
  messages: ChatMessage[];
  score: {
    overall: number;
    fluency: number;
    pronunciation: number;
    lexical: number;
  };
  scoredWords: Array<{ word: string; phonetic: string; points: number }>;
  grammarNotes: string[];
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  speechSpeed: number; // 0.75, 1.0, 1.25
  preferredAccent: 'us' | 'uk';
  grammarDepth: 'short' | 'detail' | 'academic';
  autoParaphrase: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  streakProtectionAlert: boolean;
  weeklyEmailDigest: boolean;
  soundEffects: boolean;
  uiLanguage: 'vi' | 'en';
  themeMode: 'light' | 'dark';
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

export interface UserListeningProgress {
  userId: string;
  exerciseId: string;
  isCompleted: boolean;
  score: number;
  maxScore: number;
  scorePercent: number;
  mcqAnswers?: Record<number, number>;
  dictationAnswers?: Record<string, string>;
  completedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  profiles: LearningProfile[];
  vocabularies: VocabularyItem[];
  vocabProgress: UserVocabProgress[];
  listeningExercises: ListeningExercise[];
  listeningProgress?: UserListeningProgress[];
  writingSubmissions: WritingSubmission[];
  conversations: ConversationSession[];
  settings: UserSettings[];
  activities: LearningActivity[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

function getSeedData(): DatabaseSchema {
  const defaultUserId = 'user_minh_thao_01';

  const vocabularies: VocabularyItem[] = [
    {
      id: 'vocab_01',
      word: 'Entrepreneurship',
      phonetic: '/ˌɒn.trə.prəˈnɜː.ʃɪp/',
      partOfSpeech: 'noun [C/U]',
      cefrLevel: 'CEFR B2',
      frequency: 'Tần suất 4/5',
      vietnameseMeaning: 'Tinh thần khởi nghiệp; sự thành lập và điều hành doanh nghiệp mạo hiểm.',
      wordFamily: [
        { form: 'Entrepreneur', type: 'n', meaning: 'Người khởi nghiệp, doanh nhân' },
        { form: 'Entrepreneurial', type: 'adj', meaning: 'Mang tính khởi nghiệp, sáng tạo' },
        { form: 'Entrepreneurship', type: 'n, unc', meaning: 'Nghề kinh doanh mạo hiểm' },
      ],
      collocations: [
        { phrase: 'serial entrepreneur', meaning: 'Doanh nhân nối tiếp (nhiều startup)', example: 'He is a serial entrepreneur who launched 4 startups.' },
        { phrase: 'foster entrepreneurship', meaning: 'Thúc đẩy khởi nghiệp', example: 'Government policies that foster entrepreneurship.' },
        { phrase: 'social entrepreneurship', meaning: 'Khởi nghiệp xã hội', example: 'Solving environmental crises via startups.' },
      ],
      exampleEn: 'The university offers special grants to encourage student entrepreneurship in technology.',
      exampleVi: 'Trường đại học cung cấp các khoản tài trợ đặc biệt để khuyến khích sinh viên khởi nghiệp trong lĩnh vực công nghệ.',
      aiTip: 'Từ này có gốc từ tiếng Pháp. Lưu ý trọng âm chính rơi vào âm tiết thứ 4 (-ship /ʃɪp/) và âm tiết phụ ở âm đầu tiên. Tránh nhầm lẫn với danh từ chỉ người entrepreneur.',
      topic: 'Kinh tế & Khởi nghiệp',
    },
    {
      id: 'vocab_02',
      word: 'Resilient',
      phonetic: '/rɪˈzɪl.jənt/',
      partOfSpeech: 'adj',
      cefrLevel: 'CEFR C1',
      frequency: 'Tần suất 4/5',
      vietnameseMeaning: 'Kiên cường, có khả năng phục hồi nhanh chóng sau khó khăn.',
      wordFamily: [
        { form: 'Resilience', type: 'n', meaning: 'Khả năng phục hồi, tính kiên cường' },
        { form: 'Resiliently', type: 'adv', meaning: 'Một cách kiên cường' },
      ],
      collocations: [
        { phrase: 'remain resilient', meaning: 'Vẫn kiên cường, giữ vững phong độ', example: 'Our software team remained resilient despite the tight deadline.' },
        { phrase: 'resilient economy', meaning: 'Nền kinh tế có sức chống chịu cao', example: 'Building a resilient economy in the post-pandemic era.' },
      ],
      exampleEn: 'Vietnamese students are remarkably resilient when adapting to new AI learning technologies.',
      exampleVi: 'Sinh viên Việt Nam kiên cường và linh hoạt đáng kinh ngạc khi thích nghi với các công nghệ học AI mới.',
      aiTip: 'Phát âm đuôi /-jənt/, trọng âm nhấn vào âm tiết thứ 2 (zil). Thường đi kèm với giới từ to hoặc in the face of.',
      topic: 'Kỹ năng & Tính cách',
    },
    {
      id: 'vocab_03',
      word: 'Sustainable',
      phonetic: '/səˈsteɪ.nə.bəl/',
      partOfSpeech: 'adj',
      cefrLevel: 'CEFR B2',
      frequency: 'Tần suất 5/5',
      vietnameseMeaning: 'Bền vững, có thể duy trì lâu dài mà không gây hại đến môi trường.',
      wordFamily: [
        { form: 'Sustain', type: 'v', meaning: 'Duy trì, chống đỡ' },
        { form: 'Sustainability', type: 'n', meaning: 'Tính bền vững' },
      ],
      collocations: [
        { phrase: 'sustainable development', meaning: 'Phát triển bền vững', example: 'Balancing economic growth with sustainable development.' },
        { phrase: 'sustainable competitive advantage', meaning: 'Lợi thế cạnh tranh bền vững', example: 'Innovation is key to a sustainable competitive advantage.' },
      ],
      exampleEn: 'Companies must develop sustainable strategies to thrive in the modern tech ecosystem.',
      exampleVi: 'Các công ty phải phát triển chiến lược bền vững để phát triển thịnh vượng trong hệ sinh thái công nghệ hiện đại.',
      aiTip: 'Ghi nhớ tiền tố sus- (dưới) + tain (giữ) + -able (có thể).',
      topic: 'Kinh tế & Môi trường',
    },
    {
      id: 'vocab_04',
      word: 'Innovative',
      phonetic: '/ˈɪn.ə.veɪ.tɪv/',
      partOfSpeech: 'adj',
      cefrLevel: 'CEFR B2',
      frequency: 'Tần suất 5/5',
      vietnameseMeaning: 'Đột phá, đổi mới sáng tạo, áp dụng phương pháp hoàn toàn mới.',
      wordFamily: [
        { form: 'Innovate', type: 'v', meaning: 'Đổi mới, sáng tạo' },
        { form: 'Innovation', type: 'n', meaning: 'Sự đổi mới, sáng kiến' },
      ],
      collocations: [
        { phrase: 'innovative solution', meaning: 'Giải pháp đột phá', example: 'They delivered an innovative solution to cloud latency.' },
        { phrase: 'innovative approach', meaning: 'Cách tiếp cận sáng tạo', example: 'An innovative approach to English pedagogy.' },
      ],
      exampleEn: 'The startup introduced an innovative method for automated voice speech recognition.',
      exampleVi: 'Công ty khởi nghiệp đã giới thiệu một phương pháp đột phá trong nhận diện giọng nói tự động.',
      aiTip: 'Trọng âm thứ nhất IN-no-va-tive. Giọng UK đọc /ˈɪn.ə.və.tɪv/, giọng US đọc /ˈɪn.ə.veɪ.tɪv/.',
      topic: 'Công nghệ & Đổi mới',
    },
    {
      id: 'vocab_05',
      word: 'Collaborate',
      phonetic: '/kəˈlæb.ə.reɪt/',
      partOfSpeech: 'verb',
      cefrLevel: 'CEFR B2',
      frequency: 'Tần suất 4/5',
      vietnameseMeaning: 'Cộng tác, phối hợp cùng nhau để đạt được mục tiêu chung.',
      wordFamily: [
        { form: 'Collaboration', type: 'n', meaning: 'Sự hợp tác' },
        { form: 'Collaborative', type: 'adj', meaning: 'Có tính cộng tác' },
      ],
      collocations: [
        { phrase: 'collaborate with colleagues', meaning: 'Cộng tác cùng đồng nghiệp', example: 'Engineers collaborate with designers daily.' },
        { phrase: 'collaborate on a project', meaning: 'Hợp tác trong một dự án', example: 'Both universities collaborated on the research.' },
      ],
      exampleEn: 'Software engineers collaborate closely with product managers to deliver timely releases.',
      exampleVi: 'Các kỹ sư phần mềm cộng tác chặt chẽ với quản lý sản phẩm để phát hành đúng tiến độ.',
      aiTip: 'Luôn chú ý giới từ: collaborate WITH someone, collaborate ON something.',
      topic: 'Công việc & Nhóm',
    },
    {
      id: 'vocab_06',
      word: 'Productivity',
      phonetic: '/ˌprɒd.ʌkˈtɪv.ə.ti/',
      partOfSpeech: 'noun [U]',
      cefrLevel: 'CEFR B1+',
      frequency: 'Tần suất 5/5',
      vietnameseMeaning: 'Năng suất lao động, hiệu suất làm việc.',
      wordFamily: [
        { form: 'Produce', type: 'v', meaning: 'Sản xuất' },
        { form: 'Productive', type: 'adj', meaning: 'Năng suất, hiệu quả' },
      ],
      collocations: [
        { phrase: 'boost productivity', meaning: 'Tăng cường năng suất', example: 'AI tools can significantly boost productivity.' },
        { phrase: 'worker productivity', meaning: 'Năng suất của người lao động', example: 'Remote work impacts worker productivity.' },
      ],
      exampleEn: 'Modern automation tools help increase developer productivity by 35 percent.',
      exampleVi: 'Các công cụ tự động hóa hiện đại giúp tăng năng suất lập trình viên thêm 35 phần trăm.',
      aiTip: 'Trọng âm chính ở âm tiết thứ 3: pro-duc-TI-vi-ty.',
      topic: 'Kinh tế & Công sở',
    },
    {
      id: 'vocab_07',
      word: 'Integrate',
      phonetic: '/ˈɪn.tə.ɡreɪt/',
      partOfSpeech: 'verb',
      cefrLevel: 'CEFR B2',
      frequency: 'Tần suất 4/5',
      vietnameseMeaning: 'Tích hợp, kết hợp nhuần nhuyễn vào hệ thống chung.',
      wordFamily: [
        { form: 'Integration', type: 'n', meaning: 'Sự tích hợp, hội nhập' },
        { form: 'Integrated', type: 'adj', meaning: 'Được tích hợp' },
      ],
      collocations: [
        { phrase: 'integrate into workflow', meaning: 'Tích hợp vào quy trình làm việc', example: 'Integrate generative AI directly into the pipeline.' },
        { phrase: 'seamlessly integrate', meaning: 'Tích hợp liền mạch', example: 'The plugin seamlessly integrates with Chrome.' },
      ],
      exampleEn: 'Companies must integrate modern machine learning models to stay ahead in competitive markets.',
      exampleVi: 'Các công ty phải tích hợp các mô hình máy học hiện đại để dẫn đầu trong thị trường cạnh tranh.',
      aiTip: 'Cấu trúc thường gặp: integrate A INTO B hoặc integrate with B.',
      topic: 'Công nghệ & Hệ thống',
    },
  ];

  const vocabProgress: UserVocabProgress[] = vocabularies.map((v, i) => {
    if (i < 3) {
      return {
        userId: defaultUserId,
        vocabId: v.id,
        srsLevel: 4,
        status: 'mastered',
        nextReviewText: 'Ôn sau 4 ngày',
        isFavorite: true,
        repetitions: 4,
        lastReviewedAt: new Date(Date.now() - 86400000).toISOString(),
      };
    } else if (i === 3) {
      return {
        userId: defaultUserId,
        vocabId: v.id,
        srsLevel: 2,
        status: 'review',
        nextReviewText: 'Ôn lại hôm nay',
        isFavorite: false,
        repetitions: 2,
        lastReviewedAt: new Date(Date.now() - 172800000).toISOString(),
      };
    } else {
      return {
        userId: defaultUserId,
        vocabId: v.id,
        srsLevel: 0,
        status: 'pending',
        nextReviewText: 'Chưa học',
        isFavorite: false,
        repetitions: 0,
        lastReviewedAt: '',
      };
    }
  });

  const listeningExercises: ListeningExercise[] = [
    {
      id: 'listen_01',
      title: 'Luyện nghe chép chính tả & Điền khuyết',
      section: 'Đoạn 02: Xu hướng Chuyển đổi Số',
      speaker: 'Dr. Rachel Adams',
      speakerRole: 'Giám đốc Công nghệ & Đổi mới sáng tạo (Keynote Speaker)',
      speakerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8VfhirzfQKQRiY07dudXqkMErtrMDjc4C4j19bZUeriEloBgNYO1DcTMY0FQqz9WpSu1xViwl0R6ntV9USmzzwLSGv1IimerQXP8aD2EzIp7vM7aMz6QTHkoEUDtxUA-IEePnBApOlmKrecwMAU20z2q5T4K8LXQxow-9dsZdwnteWbu8_AZYOKdUiBtH-Wz9jtPMppRgIRWEePrlBP2-lJrKw2uXJrVBd35AMSwvbG2KOgU_1d3gwA',
      duration: '03:45',
      audioUrl: '/audio/listen_01.wav',
      level: 'Trình độ B1+',
      difficulty: 'Độ khó 3/5',
      accent: 'Giọng chuẩn Mỹ (US Accent - Natural)',
      topic: 'AI & Chuyển đổi số',
      audioTranscriptEn: 'In the upcoming decade, artificial intelligence will fundamentally change how businesses approach productivity and workflow automation. Companies that fail to integrate modern language models will struggle to maintain their competitive advantage in global markets.',
      audioTranscriptVi: 'Trong thập kỷ tới, trí tuệ nhân tạo sẽ thay đổi căn bản cách các doanh nghiệp tiếp cận năng suất và tự động hóa quy trình làm việc. Những công ty không tích hợp các mô hình ngôn ngữ hiện đại sẽ phải chật vật duy trì lợi thế cạnh tranh của mình trên thị trường toàn cầu.',
      transcript: [
        {
          timestamp: '00:03',
          speaker: 'Dr. Rachel Adams',
          text: 'In the upcoming decade, artificial intelligence will fundamentally change how businesses approach productivity and workflow automation.',
          vietnamese: 'Trong thập kỷ tới, trí tuệ nhân tạo sẽ thay đổi căn bản cách các doanh nghiệp tiếp cận năng suất và tự động hóa quy trình làm việc.',
        },
        {
          timestamp: '00:20',
          speaker: 'Dr. Rachel Adams',
          text: 'Companies that fail to integrate modern language models will struggle to maintain their competitive advantage in global markets.',
          vietnamese: 'Những công ty không tích hợp các mô hình ngôn ngữ hiện đại sẽ phải chật vật duy trì lợi thế cạnh tranh của mình trên thị trường toàn cầu.',
        },
      ],
      paragraphWithBlanks: 'In the upcoming decade, artificial intelligence will fundamentally change how businesses approach [productivity] and workflow automation. Companies that fail to [integrate] modern language models will struggle to maintain their [competitive] advantage in global markets.',
      blanks: [
        {
          id: 'blank_1',
          index: 1,
          targetWord: 'productivity',
          phonetic: '/ˌprɒd.ʌkˈtɪv.ə.ti/',
          partOfSpeech: 'noun',
          meaning: 'Năng suất lao động trong kinh tế',
          hint: 'Danh từ bắt đầu bằng "pro..."',
        },
        {
          id: 'blank_2',
          index: 2,
          targetWord: 'integrate',
          phonetic: '/ˈɪn.tə.ɡreɪt/',
          partOfSpeech: 'verb',
          meaning: 'Tích hợp, kết hợp nhuần nhuyễn vào hệ thống',
          hint: 'Động từ nguyên mẫu sau fail to',
        },
        {
          id: 'blank_3',
          index: 3,
          targetWord: 'competitive',
          phonetic: '/kəmˈpet.ɪ.tɪv/',
          partOfSpeech: 'adj',
          meaning: 'Có tính cạnh tranh',
          hint: 'Tính từ đứng trước "advantage"',
        },
      ],
      fillInBlanks: [
        {
          id: 'blank_1',
          sentence: 'Businesses will fundamentally change how they approach [productivity] and automation.',
          targetWord: 'productivity',
          hint: 'Năng suất lao động trong kinh tế (pro...)',
        },
        {
          id: 'blank_2',
          sentence: 'Companies that fail to [integrate] modern language models will struggle.',
          targetWord: 'integrate',
          hint: 'Động từ nguyên mẫu: Tích hợp (in...)',
        },
        {
          id: 'blank_3',
          sentence: 'They will struggle to maintain their [competitive] advantage in global markets.',
          targetWord: 'competitive',
          hint: 'Tính từ: Mang tính cạnh tranh (com...)',
        },
      ],
      questions: [
        {
          id: 1,
          question: 'Theo diễn giả, công nghệ nào sẽ làm thay đổi căn bản cách vận hành doanh nghiệp trong thập kỷ tới?',
          options: [
            'Trí tuệ nhân tạo (Artificial Intelligence)',
            'Điện toán đám mây truyền thống',
            'Công nghệ chuỗi khối Blockchain',
            'Thực tế ảo tăng cường VR',
          ],
          correctAnswer: 0,
          explanation: 'Trong câu mở đầu, diễn giả nhấn mạnh: "In the upcoming decade, artificial intelligence will fundamentally change how businesses approach productivity..."',
        },
        {
          id: 2,
          question: 'Hậu quả chính đối với những doanh nghiệp không tích hợp các mô hình ngôn ngữ hiện đại là gì?',
          options: [
            'Chật vật duy trì lợi thế cạnh tranh trên thị trường toàn cầu',
            'Phải gia tăng chi phí quảng cáo gấp đôi',
            'Mất chứng chỉ bảo mật quốc tế',
            'Bị buộc phải chuyển toàn bộ nhân sự sang làm việc từ xa',
          ],
          correctAnswer: 0,
          explanation: 'Diễn giả nêu rõ: "Companies that fail to integrate modern language models will struggle to maintain their competitive advantage in global markets."',
        },
      ],
      keyVocab: [
        {
          word: 'productivity',
          phonetic: '/ˌprɒd.ʌkˈtɪv.ə.ti/',
          partOfSpeech: 'n',
          meaning: 'Năng suất lao động',
          status: 'correct',
        },
        {
          word: 'integrate',
          phonetic: '/ˈɪn.tə.ɡreɪt/',
          partOfSpeech: 'v',
          meaning: 'Tích hợp, kết hợp',
          status: 'active',
        },
        {
          word: 'competitive',
          phonetic: '/kəmˈpet.ɪ.tɪv/',
          partOfSpeech: 'adj',
          meaning: 'Có tính cạnh tranh',
          status: 'pending',
        },
      ],
      collocationHighlight: {
        phrase: 'competitive advantage',
        meaning: 'Lợi thế cạnh tranh vượt trội trên thị trường.',
      },
      insights: {
        structure: 'Cấu trúc "fail to + V(infinitive)"',
        structureExplanation: 'Không làm được điều gì, thất bại trong việc... Do đó từ cần điền ở Chỗ trống 2 bắt buộc là động từ nguyên mẫu (integrate).',
        pronunciation: 'Hiện tượng nối âm & Giảm âm',
        pronunciationExplanation: 'Âm đuôi /t/ trong integrate nối nhẹ với âm /m/ trong modern; âm approach /tʃ/ nuốt nhẹ trước nguyên âm.',
      },
    },
    {
      id: 'listen_02',
      title: 'Product Strategy Meeting at Tech Startup',
      section: 'Đoạn 01: Thống nhất Lộ trình Quý & Tối ưu Trải nghiệm',
      speaker: 'Marcus Vance',
      speakerRole: 'Head of Product (Senior PM)',
      speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      duration: '04:15',
      audioUrl: '/audio/listen_02.wav',
      level: 'Trình độ B2',
      difficulty: 'Độ khó 4/5',
      accent: 'Giọng chuẩn Mỹ (US Accent - Professional)',
      topic: 'Tech & Product Management',
      audioTranscriptEn: 'Good morning everyone. Today we are aligning our roadmap for the next quarter. Our primary objective is streamlining user onboarding and reducing customer churn rate through proactive feedback loops.',
      audioTranscriptVi: 'Chào buổi sáng mọi người. Hôm nay chúng ta thống nhất lộ trình phát triển cho quý tới. Mục tiêu hàng đầu là tinh giản quy trình nhập môn người dùng và giảm tỷ lệ rời bỏ dịch vụ thông qua chu trình phản hồi chủ động.',
      transcript: [
        {
          timestamp: '00:02',
          speaker: 'Marcus Vance',
          text: 'Good morning everyone. Today we are aligning our roadmap for the next quarter.',
          vietnamese: 'Chào buổi sáng mọi người. Hôm nay chúng ta thống nhất lộ trình phát triển cho quý tới.',
        },
        {
          timestamp: '00:14',
          speaker: 'Marcus Vance',
          text: 'Our primary objective is streamlining user onboarding and reducing customer churn rate through proactive feedback loops.',
          vietnamese: 'Mục tiêu hàng đầu là tinh giản quy trình nhập môn và giảm tỷ lệ rời bỏ dịch vụ thông qua các chu trình phản hồi chủ động.',
        },
      ],
      paragraphWithBlanks: 'Good morning everyone. Today we are aligning our [roadmap] for the next quarter. Our primary objective is [streamlining] user onboarding and reducing customer [churn] rate through proactive feedback loops.',
      blanks: [
        {
          id: 'blank_1',
          index: 1,
          targetWord: 'roadmap',
          phonetic: '/ˈroʊd.mæp/',
          partOfSpeech: 'noun',
          meaning: 'Lộ trình phát triển sản phẩm',
          hint: 'Danh từ bắt đầu bằng "road..."',
        },
        {
          id: 'blank_2',
          index: 2,
          targetWord: 'streamlining',
          phonetic: '/ˈstriːm.laɪ.nɪŋ/',
          partOfSpeech: 'verb (gerund)',
          meaning: 'Tinh giản hóa, rút gọn quy trình',
          hint: 'Dạng V-ing của streamline',
        },
        {
          id: 'blank_3',
          index: 3,
          targetWord: 'churn',
          phonetic: '/tʃɜːrn/',
          partOfSpeech: 'noun',
          meaning: 'Tỷ lệ khách hàng rời bỏ dịch vụ',
          hint: 'Từ đi trước "... rate"',
        },
      ],
      fillInBlanks: [
        {
          id: 'blank_1',
          sentence: 'Today we are aligning our [roadmap] for the next quarter.',
          targetWord: 'roadmap',
          hint: 'Lộ trình phát triển sản phẩm (road...)',
        },
        {
          id: 'blank_2',
          sentence: 'Our primary objective is [streamlining] user onboarding.',
          targetWord: 'streamlining',
          hint: 'Tinh giản hóa quy trình (streamline...)',
        },
        {
          id: 'blank_3',
          sentence: 'And reducing customer [churn] rate through feedback loops.',
          targetWord: 'churn',
          hint: 'Tỷ lệ rời bỏ dịch vụ (ch...)',
        },
      ],
      questions: [
        {
          id: 1,
          question: 'Mục tiêu chính của cuộc họp sản phẩm là gì?',
          options: [
            'Thống nhất lộ trình phát triển quý tới',
            'Kêu gọi vốn đầu tư vòng tiếp theo',
            'Giải quyết sự cố máy chủ ứng dụng',
            'Phỏng vấn nhân sự mới',
          ],
          correctAnswer: 0,
          explanation: 'Marcus mở đầu bài nói: "Today we are aligning our roadmap for the next quarter."',
        },
        {
          id: 2,
          question: 'Giải pháp nào được đề xuất để giảm tỷ lệ khách hàng rời bỏ (churn rate)?',
          options: [
            'Thiết lập chu trình phản hồi chủ động từ khách hàng (feedback loops)',
            'Giảm giá dịch vụ vô điều kiện',
            'Tạm ngưng tiếp nhận khách hàng mới',
            'Tăng ngân sách quảng cáo truyền thông',
          ],
          correctAnswer: 0,
          explanation: 'Marcus nêu rõ: "reducing customer churn rate through proactive feedback loops."',
        },
      ],
      keyVocab: [
        {
          word: 'roadmap',
          phonetic: '/ˈroʊd.mæp/',
          partOfSpeech: 'n',
          meaning: 'Lộ trình phát triển sản phẩm',
          status: 'active',
        },
        {
          word: 'streamlining',
          phonetic: '/ˈstriːm.laɪ.nɪŋ/',
          partOfSpeech: 'v',
          meaning: 'Tinh giản hóa quy trình',
          status: 'correct',
        },
        {
          word: 'churn',
          phonetic: '/tʃɜːrn/',
          partOfSpeech: 'n',
          meaning: 'Tỷ lệ khách hàng rời bỏ dịch vụ',
          status: 'pending',
        },
      ],
      collocationHighlight: {
        phrase: 'churn rate',
        meaning: 'Tỷ lệ khách hàng rời bỏ dịch vụ hoặc hủy gói đăng ký trong một khoảng thời gian.',
      },
      insights: {
        structure: 'Collocation "aligning our roadmap"',
        structureExplanation: 'Thống nhất và đồng bộ kế hoạch/lộ trình phát triển giữa các phòng ban.',
        pronunciation: 'Chặn âm và nối âm trong cụm từ chuyên môn',
        pronunciationExplanation: 'Âm /k/ trong feedback nối tự nhiên với âm /l/ trong loops.',
      },
    },
    {
      id: 'listen_03',
      title: 'STAR Method in Tech Job Interviews',
      section: 'Đoạn 01: Phương pháp trả lời câu hỏi hành vi',
      speaker: 'Elena Rostova',
      speakerRole: 'Senior Talent Acquisition Manager',
      speakerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      duration: '03:10',
      audioUrl: '/audio/listen_03.wav',
      level: 'Trình độ B2',
      difficulty: 'Độ khó 3/5',
      accent: 'Giọng chuẩn Mỹ (US Accent - HR Professional)',
      topic: 'Career & Tech Interview',
      audioTranscriptEn: 'When answering behavioral interview questions, the STAR method provides a clear structured approach. You begin by outlining the situation, detailing your specific task, explaining the decisive actions you executed, and demonstrating tangible results.',
      audioTranscriptVi: 'Khi trả lời các câu hỏi phỏng vấn hành vi, phương pháp STAR mang lại cách tiếp cận rõ ràng và có cấu trúc. Bạn bắt đầu bằng việc phác thảo tình huống, chi tiết hoá nhiệm vụ cụ thể của bạn, giải thích các hành động quyết đoán bạn đã thực hiện, và chứng minh các kết quả hữu hình.',
      transcript: [
        {
          timestamp: '00:02',
          speaker: 'Elena Rostova',
          text: 'When answering behavioral interview questions, the STAR method provides a clear structured approach.',
          vietnamese: 'Khi trả lời các câu hỏi phỏng vấn hành vi, phương pháp STAR mang lại cách tiếp cận rõ ràng và có cấu trúc.',
        },
        {
          timestamp: '00:15',
          speaker: 'Elena Rostova',
          text: 'You begin by outlining the situation, detailing your specific task, explaining the decisive actions you executed, and demonstrating tangible results.',
          vietnamese: 'Bạn bắt đầu bằng việc phác thảo tình huống, chi tiết hoá nhiệm vụ cụ thể, giải thích các hành động quyết đoán đã thực hiện, và chứng minh kết quả hữu hình.',
        },
      ],
      paragraphWithBlanks: 'When answering behavioral interview questions, the STAR method provides a [structured] approach. You begin by outlining the [situation], explaining decisive actions, and demonstrating [tangible] results.',
      blanks: [
        {
          id: 'blank_1',
          index: 1,
          targetWord: 'structured',
          phonetic: '/ˈstrʌk.tʃəd/',
          partOfSpeech: 'adj',
          meaning: 'Có cấu trúc bài bản, mạch lạc',
          hint: 'Tính từ mô tả phương pháp (struc...)',
        },
        {
          id: 'blank_2',
          index: 2,
          targetWord: 'situation',
          phonetic: '/ˌsɪtʃ.uˈeɪ.ʃən/',
          partOfSpeech: 'noun',
          meaning: 'Tình huống, hoàn cảnh ban đầu',
          hint: 'Chữ S trong từ viết tắt STAR',
        },
        {
          id: 'blank_3',
          index: 3,
          targetWord: 'tangible',
          phonetic: '/ˈtæn.dʒə.bəl/',
          partOfSpeech: 'adj',
          meaning: 'Hữu hình, có thể đo lường rõ ràng',
          hint: 'Tính từ đi trước results (tan...)',
        },
      ],
      fillInBlanks: [
        {
          id: 'blank_1',
          sentence: 'The STAR method provides a clear [structured] approach.',
          targetWord: 'structured',
          hint: 'Có cấu trúc rõ ràng (struc...)',
        },
        {
          id: 'blank_2',
          sentence: 'You begin by outlining the [situation] and detailing your task.',
          targetWord: 'situation',
          hint: 'Tình huống (situ...)',
        },
        {
          id: 'blank_3',
          sentence: 'Explaining decisive actions and demonstrating [tangible] results.',
          targetWord: 'tangible',
          hint: 'Kết quả đo lường được (tan...)',
        },
      ],
      questions: [
        {
          id: 1,
          question: 'Phương pháp STAR được dùng nhằm mục đích gì trong buổi phỏng vấn?',
          options: [
            'Cung cấp cấu trúc rõ ràng khi trả lời câu hỏi hành vi',
            'Giới thiệu bản thân trong vòng 30 giây',
            'Đàm phán mức lương và phúc lợi công ty',
            'Kiểm tra kỹ năng lập trình trực tiếp',
          ],
          correctAnswer: 0,
          explanation: 'Elena khẳng định: "When answering behavioral interview questions, the STAR method provides a clear structured approach."',
        },
        {
          id: 2,
          question: 'Yếu tố quan trọng cuối cùng cần chứng minh trong câu trả lời theo STAR là gì?',
          options: [
            'Kết quả cụ thể và hữu hình (tangible results)',
            'Lời khen từ người quản lý cũ',
            'Danh sách các bằng cấp học thuật',
            'Số lượng đồng nghiệp trong nhóm',
          ],
          correctAnswer: 0,
          explanation: 'Elena nhấn mạnh việc kết thúc bằng: "demonstrating tangible results" (kết quả đo lường được).',
        },
      ],
      keyVocab: [
        {
          word: 'structured',
          phonetic: '/ˈstrʌk.tʃəd/',
          partOfSpeech: 'adj',
          meaning: 'Có cấu trúc chặt chẽ',
          status: 'correct',
        },
        {
          word: 'situation',
          phonetic: '/ˌsɪtʃ.uˈeɪ.ʃən/',
          partOfSpeech: 'n',
          meaning: 'Tình huống, hoàn cảnh',
          status: 'active',
        },
        {
          word: 'tangible',
          phonetic: '/ˈtæn.dʒə.bəl/',
          partOfSpeech: 'adj',
          meaning: 'Hữu hình, đo lường được',
          status: 'pending',
        },
      ],
      collocationHighlight: {
        phrase: 'tangible results',
        meaning: 'Kết quả rõ ràng, có số liệu minh chứng cụ thể.',
      },
      insights: {
        structure: 'Kỹ thuật phỏng vấn STAR',
        structureExplanation: 'S (Situation) -> T (Task) -> A (Action) -> R (Result).',
        pronunciation: 'Trọng âm từ 3 âm tiết',
        pronunciationExplanation: 'Tập trung trọng âm đầu vào SIT-u-ation và TAN-gi-ble.',
      },
    },
  ];

  const writingSubmissions: WritingSubmission[] = [
    {
      id: 'write_sub_01',
      userId: defaultUserId,
      topicId: 'topic_remote_work',
      topicTitle: 'Trình bày quan điểm Remote Work',
      prompt: 'Some people argue that working remotely increases worker productivity, while others believe it creates isolation. Discuss both views and give your opinion.',
      content: 'Recently, remote working has become increasingly popular in many countries worldwide. In my opinion, working from home provides great flexibility, allowing employees to manage their work-life balance effectively while saving considerable commuting hours each morning.\n\nHowever, it also has some drawbacks. Many team members frequently feel lonely and isolated when they do not have regular face to face interaction with their colleagues, ultimately resulting in reduced mental well-being and lower creative output.\n\nTherefore, a hybrid arrangement seems to be the most optimal compromise for modern organizations.',
      wordCount: 142,
      overallScore: 7.4,
      grammarScore: 7.0,
      lexicalScore: 7.5,
      coherenceScore: 8.0,
      toneScore: 7.0,
      cefrAssessment: 'B1+ Intermediate (Tiềm năng B2)',
      errors: [
        {
          type: 'Lỗi ngữ pháp & Chính tả',
          original: 'face to face interaction',
          suggestion: 'face-to-face interaction',
          explanation: 'Cụm "face-to-face" khi đứng trước danh từ đóng vai trò làm tính từ ghép (compound adjective) bổ nghĩa cho interaction, vì vậy bắt buộc phải có dấu gạch nối (hyphen).',
          section: 'Đoạn 2',
        },
        {
          type: 'Gợi ý nâng cấp từ vựng',
          original: 'has some drawbacks',
          suggestion: 'presents certain limitations',
          explanation: 'Cụm "has some drawbacks" quá phổ thông (A2-B1). Chuyển sang "presents certain limitations" hoặc "is not without its downsides" giúp câu văn chuẩn chỉnh và mang tính học thuật cao hơn.',
          section: 'Đoạn 2',
        },
        {
          type: 'Phong cách diễn đạt (Style)',
          original: 'lonely and isolated',
          suggestion: 'socially detached',
          explanation: 'Cặp từ "lonely and isolated" hơi thiên về cảm xúc đời thường. Trong bối cảnh công sở hiện đại, thuật ngữ "socially detached" hoặc "professionally isolated" diễn đạt chính xác tính khách quan.',
          section: 'Đoạn 2',
        },
      ],
      vocabUpgrades: [
        {
          original: 'manage work-life balance',
          suggestion: 'maintain an optimal equilibrium between work and personal life',
          level: 'B2 ➔ C1',
        },
        {
          original: 'saving considerable commuting hours',
          suggestion: 'eliminating tedious daily commutes',
          level: 'C1 Collocation',
        },
        {
          original: 'lower creative output',
          suggestion: 'diminishing collective innovation',
          level: 'B2 Academic',
        },
      ],
      polishedEssay: 'Recently, remote working has gained immense prominence worldwide. From my perspective, working from home delivers unparalleled schedule flexibility, empowering professionals to maintain a harmonious work-life equilibrium while eliminating arduous daily commutes.\n\nNonetheless, this model presents certain limitations. Numerous employees experience feeling socially detached in the absence of consistent face-to-face interaction with colleagues, potentially hindering both psychological well-being and collaborative creativity.\n\nConsequently, adopting a structured hybrid model offers the most balanced and sustainable trajectory forward.',
      createdAt: new Date().toISOString(),
    },
  ];

  const conversations: ConversationSession[] = [
    {
      id: 'conv_01',
      userId: defaultUserId,
      topicId: 'tech_job_interview',
      topicTitle: 'Tech Job Interview',
      topicBadge: 'Đang học',
      tutorName: 'Trợ lý AI',
      tutorAccent: 'Bắc Mỹ (Standard US)',
      tutorAvatar: '',
      messages: [
        {
          id: 'msg_1',
          role: 'assistant',
          content: "Welcome back, Thao! Let's continue practicing interview questions for software companies. Imagine I am your team lead. Can you tell me about a challenging technical bug you resolved recently?",
          translation: 'Chào mừng Thảo quay lại! Hãy tiếp tục luyện các câu hỏi phỏng vấn cho công ty phần mềm. Hãy tưởng tượng tôi là Trưởng nhóm của bạn. Bạn có thể kể về một lỗi kỹ thuật hóc búa mà bạn đã giải quyết gần đây không?',
          suggestedAnswers: [
            '“They appreciated my quick response and...”',
            '“I documented the solution in our internal wiki so...”',
          ],
          timestamp: '19:10',
        },
        {
          id: 'msg_2',
          role: 'user',
          content: 'In my last project, I encountered a tricky state management bug in React. The components were re-rendering repeatedly, which caused a memory leak. I used Chrome DevTools to profile the app and fixed it by memoizing the callback function.',
          audioDuration: '9.2s',
          naturalnessScore: 88,
          praise: "Diễn đạt rất tự nhiên! Bạn đã dùng chính xác các thuật ngữ chuyên ngành: 'memoizing' và 'memory leak'.",
          suggestion: "Có thể đổi cụm 'fixed it' thành 'pinpointed the root cause and eliminated the bug' để tạo ấn tượng sắc bén hơn trong phỏng vấn kỹ thuật.",
          timestamp: '19:12',
        },
        {
          id: 'msg_3',
          role: 'assistant',
          content: 'Impressive problem-solving! How did your teammates react when you explained your solution in the sprint retrospective?',
          translation: 'Khả năng giải quyết vấn đề ấn tượng đấy! Các đồng nghiệp trong nhóm đã phản ứng ra sao khi bạn giải thích giải pháp trong buổi họp tổng kết sprint?',
          suggestedAnswers: [
            '“They were relieved because it unblocked the release candidate.”',
            '“We agreed to set up automated linting rules to catch similar re-renders.”',
          ],
          timestamp: '19:13',
        },
      ],
      score: {
        overall: 85,
        fluency: 82,
        pronunciation: 88,
        lexical: 85,
      },
      scoredWords: [
        { word: 'memoizing', phonetic: '/ˈmɛm.oʊ.aɪ.zɪŋ/', points: 15 },
        { word: 'profile the app', phonetic: '/ˈproʊfaɪl/', points: 12 },
        { word: 'encounter', phonetic: '/ɪnˈkaʊn.tər/', points: 10 },
      ],
      grammarNotes: [
        'Cấu trúc mệnh đề quan hệ ‘which caused’: Bạn đã dùng đúng dấu phẩy trước ‘which’ để bổ nghĩa cho cả mệnh đề phía trước. Rất chính xác trong văn phong chuyên nghiệp!',
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  const activities: LearningActivity[] = [
    {
      id: 'act_01',
      userId: defaultUserId,
      type: 'writing',
      title: 'Luyện viết AI: "Remote Work Discussion"',
      badge: 'B1 Intermediate',
      scoreText: '7.4 / 10',
      subText: '142 từ • Hoàn thành hôm nay lúc 10:42',
      timestamp: 'Hôm nay lúc 10:42',
    },
    {
      id: 'act_02',
      userId: defaultUserId,
      type: 'conversation',
      title: 'Gia sư đàm thoại AI: "Tech Job Interview"',
      badge: 'Phản xạ tốt',
      scoreText: '85 / 100',
      subText: '12 câu phản xạ ngữ cảnh • Hôm qua lúc 19:15',
      timestamp: 'Hôm qua lúc 19:15',
    },
    {
      id: 'act_03',
      userId: defaultUserId,
      type: 'listening',
      title: 'Nghe chép chính tả: "AI Integration in Workplace"',
      badge: 'Tốc độ 1.0x',
      scoreText: '88%',
      subText: 'Đoạn tin vắn BBC • 2 ngày trước',
      timestamp: '2 ngày trước',
    },
    {
      id: 'act_04',
      userId: defaultUserId,
      type: 'vocabulary',
      title: 'Ôn từ vựng SRS: "Chủ đề Kinh tế & Khởi nghiệp"',
      badge: '20 Flashcards',
      scoreText: '16 / 20',
      subText: 'Ghi nhớ dài hạn • 3 ngày trước',
      timestamp: '3 ngày trước',
    },
  ];

  const defaultUser: User = {
    id: defaultUserId,
    fullName: 'Nguyễn Minh Thảo',
    email: 'minhthao@example.com',
    passwordHash: '$2b$10$ooh92gRdTnsYg0A0QomWGOE9RqLlupl8e26rqdg8icG9Qq1Tz9ZyO', // bcrypt hash for 'Lingua2025!'
    avatar: '',
    createdAt: '2024-09-01T08:00:00.000Z',
  };

  const defaultProfile: LearningProfile = {
    userId: defaultUserId,
    currentLevel: 'B1',
    levelLabel: 'B1 Intermediate',
    targetLevel: 'B2 Vantage',
    targetCertificate: 'IELTS 6.5+ / VSTEP B2',
    certificateTargetDate: 'Q4 / 2026',
    priorityTopic: 'Tech Job Interview & Công sở',
    priorityTopicDesc: 'Hội thoại mô phỏng tuyển dụng kỹ thuật và đàm phán hợp đồng quốc tế.',
    dailyCommitmentMinutes: 20,
    todayMinutesSpent: 15,
    streakDays: 7,
    phone: '0912 ••• 890',
    institution: 'Đại học Công Nghiệp Hà Nội',
    gender: 'Nữ',
    birthDate: '15/08/2003',
    bio: 'Sinh viên năm 3 ngành Công nghệ Thông tin, đang tự rèn luyện tiếng Anh chuyên ngành và phỏng vấn việc làm cùng trợ lý LinguaNext AI.',
    skillsRadar: {
      listening: 78,
      reading: 75,
      writing: 65,
      speaking: 60,
      grammar: 70,
      vocabulary: 85,
    },
    updatedAt: new Date().toISOString(),
  };

  const defaultSettings: UserSettings = {
    userId: defaultUserId,
    speechSpeed: 1.0,
    preferredAccent: 'us',
    grammarDepth: 'detail',
    autoParaphrase: true,
    dailyReminderEnabled: true,
    dailyReminderTime: '20:00',
    streakProtectionAlert: true,
    weeklyEmailDigest: true,
    soundEffects: true,
    uiLanguage: 'vi',
    themeMode: 'light',
  };

  return {
    users: [defaultUser],
    profiles: [defaultProfile],
    vocabularies,
    vocabProgress,
    listeningExercises,
    writingSubmissions,
    conversations,
    settings: [defaultSettings],
    activities,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed) {
          const seed = getSeedData();
          let needsSave = false;
          // Ensure listening exercises have rich fields (questions, fillInBlanks, transcript)
          if (!parsed.listeningExercises || parsed.listeningExercises.length === 0 || !parsed.listeningExercises[0]?.questions) {
            parsed.listeningExercises = seed.listeningExercises;
            needsSave = true;
          }
          if (!parsed.listeningProgress) {
            parsed.listeningProgress = [];
          }
          if (needsSave) {
            this.save(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading database.json, initializing seed data:', e);
    }
    const seed = getSeedData();
    this.save(seed);
    return seed;
  }

  public save(dataToSave?: DatabaseSchema) {
    try {
      this.ensureDirectory();
      const content = JSON.stringify(dataToSave || this.data, null, 2);
      fs.writeFileSync(DB_FILE, content, 'utf-8');
    } catch (e) {
      console.error('Failed to persist database.json:', e);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // --- Helpers for CRUD ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    mongoUpsertUser(user);
    return user;
  }

  public getProfile(userId: string): LearningProfile {
    let profile = this.data.profiles.find((p) => p.userId === userId);
    if (!profile) {
      profile = {
        userId,
        currentLevel: 'B1',
        levelLabel: 'B1 Intermediate',
        targetLevel: 'B2 Vantage',
        targetCertificate: 'IELTS 6.5+ / VSTEP B2',
        certificateTargetDate: 'Q4 / 2025',
        priorityTopic: 'Tech Job Interview & Công sở',
        priorityTopicDesc: 'Hội thoại mô phỏng tuyển dụng kỹ thuật và đàm phán hợp đồng quốc tế.',
        dailyCommitmentMinutes: 20,
        todayMinutesSpent: 0,
        streakDays: 1,
        phone: '',
        institution: '',
        gender: 'Khác / Không công khai',
        birthDate: '2003-01-01',
        bio: '',
        skillsRadar: {
          listening: 70,
          reading: 70,
          writing: 60,
          speaking: 55,
          grammar: 65,
          vocabulary: 75,
        },
        updatedAt: new Date().toISOString(),
      };
      this.data.profiles.push(profile);
      this.save();
      mongoUpsertProfile(profile);
    }
    return profile;
  }

  public updateProfile(userId: string, updates: Partial<LearningProfile>): LearningProfile {
    const profile = this.getProfile(userId);
    Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
    this.save();
    mongoUpsertProfile(profile);
    return profile;
  }

  public getSettings(userId: string): UserSettings {
    let setting = this.data.settings.find((s) => s.userId === userId);
    if (!setting) {
      setting = {
        userId,
        speechSpeed: 1.0,
        preferredAccent: 'us',
        grammarDepth: 'detail',
        autoParaphrase: true,
        dailyReminderEnabled: true,
        dailyReminderTime: '20:00',
        streakProtectionAlert: true,
        weeklyEmailDigest: true,
        soundEffects: true,
        uiLanguage: 'vi',
        themeMode: 'light',
      };
      this.data.settings.push(setting);
      this.save();
      mongoUpsertSettings(setting);
    }
    return setting;
  }

  public updateSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
    const setting = this.getSettings(userId);
    Object.assign(setting, updates);
    this.save();
    mongoUpsertSettings(setting);
    return setting;
  }

  public addActivity(activity: Omit<LearningActivity, 'id'>): LearningActivity {
    const newAct: LearningActivity = {
      id: 'act_' + Date.now(),
      ...activity,
    };
    this.data.activities.unshift(newAct);
    this.save();
    mongoAddActivity(newAct);
    return newAct;
  }

  public recordVocabProgress(userId: string, vocabId: string, srsChoice: number): UserVocabProgress {
    let progress = this.data.vocabProgress.find((p) => p.userId === userId && p.vocabId === vocabId);
    if (!progress) {
      progress = {
        userId,
        vocabId,
        srsLevel: 0,
        status: 'pending',
        nextReviewText: 'Chưa học',
        isFavorite: false,
        repetitions: 0,
        lastReviewedAt: new Date().toISOString(),
      };
      this.data.vocabProgress.push(progress);
    }

    progress.repetitions += 1;
    progress.lastReviewedAt = new Date().toISOString();

    if (srsChoice === 1) {
      progress.srsLevel = 1;
      progress.status = 'review';
      progress.nextReviewText = 'Ôn lại sau 10p';
    } else if (srsChoice === 2) {
      progress.srsLevel = 2;
      progress.status = 'review';
      progress.nextReviewText = 'Ôn lại ngày mai';
    } else if (srsChoice === 3) {
      progress.srsLevel = 3;
      progress.status = 'mastered';
      progress.nextReviewText = 'Ôn sau 4 ngày';
    } else {
      progress.srsLevel = 4;
      progress.status = 'mastered';
      progress.nextReviewText = 'Ôn sau 7 ngày';
    }

    this.save();
    mongoUpsertVocabProgress(progress);
    return progress;
  }

  public toggleVocabBookmark(userId: string, vocabId: string): UserVocabProgress {
    let progress = this.data.vocabProgress.find((p) => p.userId === userId && p.vocabId === vocabId);
    if (!progress) {
      progress = {
        userId,
        vocabId,
        srsLevel: 0,
        status: 'pending',
        nextReviewText: 'Chưa học',
        isFavorite: false,
        repetitions: 0,
        lastReviewedAt: new Date().toISOString(),
      };
      this.data.vocabProgress.push(progress);
    }
    progress.isFavorite = !progress.isFavorite;
    this.save();
    mongoUpsertVocabProgress(progress);
    return progress;
  }

  public recordListeningProgress(progress: UserListeningProgress): UserListeningProgress {
    if (!this.data.listeningProgress) {
      this.data.listeningProgress = [];
    }
    const idx = this.data.listeningProgress.findIndex(
      (p) => p.userId === progress.userId && p.exerciseId === progress.exerciseId
    );
    if (idx >= 0) {
      this.data.listeningProgress[idx] = progress;
    } else {
      this.data.listeningProgress.push(progress);
    }
    this.save();
    return progress;
  }

  public getListeningProgress(userId: string): UserListeningProgress[] {
    if (!this.data.listeningProgress) {
      this.data.listeningProgress = [];
    }
    return this.data.listeningProgress.filter((p) => p.userId === userId);
  }

  public addVocabulary(item: VocabularyItem): VocabularyItem {
    this.data.vocabularies.unshift(item);
    this.save();
    return item;
  }

  public updateVocabulary(id: string, updates: Partial<VocabularyItem>): VocabularyItem | null {
    const item = this.data.vocabularies.find((v) => v.id === id);
    if (!item) return null;
    Object.assign(item, updates);
    this.save();
    return item;
  }

  public deleteVocabulary(id: string): boolean {
    const prevLen = this.data.vocabularies.length;
    this.data.vocabularies = this.data.vocabularies.filter((v) => v.id !== id);
    this.data.vocabProgress = this.data.vocabProgress.filter((p) => p.vocabId !== id);
    this.save();
    return this.data.vocabularies.length < prevLen;
  }

  public deleteWritingSubmission(userId: string, id: string): boolean {
    const prevLen = this.data.writingSubmissions.length;
    this.data.writingSubmissions = this.data.writingSubmissions.filter(
      (s) => !(s.userId === userId && s.id === id)
    );
    this.save();
    return this.data.writingSubmissions.length < prevLen;
  }

  public deleteConversation(userId: string, id: string): boolean {
    const prevLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter(
      (c) => !(c.userId === userId && c.id === id)
    );
    this.save();
    return this.data.conversations.length < prevLen;
  }

  public hydrateFromMongo(mongoData: Partial<DatabaseSchema>) {
    if (mongoData.users?.length) this.data.users = mongoData.users;
    if (mongoData.profiles?.length) this.data.profiles = mongoData.profiles;
    if (mongoData.vocabularies?.length) this.data.vocabularies = mongoData.vocabularies;
    if (mongoData.vocabProgress?.length) this.data.vocabProgress = mongoData.vocabProgress;
    if (mongoData.listeningExercises?.length) this.data.listeningExercises = mongoData.listeningExercises;
    if (mongoData.writingSubmissions?.length) this.data.writingSubmissions = mongoData.writingSubmissions;
    if (mongoData.conversations?.length) this.data.conversations = mongoData.conversations;
    if (mongoData.settings?.length) this.data.settings = mongoData.settings;
    if (mongoData.activities?.length) this.data.activities = mongoData.activities;
    this.save();
  }
}

export const db = new Database();
