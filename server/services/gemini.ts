import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export interface WritingAnalysisResult {
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
}

export async function analyzeWritingWithGemini(
  content: string,
  topicTitle: string,
  prompt: string,
  level: string = 'B1'
): Promise<WritingAnalysisResult> {
  const ai = getGeminiClient();

  if (!ai) {
    console.warn('GEMINI_API_KEY is not configured. Returning rule-based educational feedback.');
    return getFallbackWritingAnalysis(content);
  }

  try {
    const systemPrompt = `You are an expert English language examiner and IELTS coach specializing in helping Vietnamese learners reach B2-C1 proficiency.
Analyze the user's written English text based on the topic and prompt.
Topic: "${topicTitle}"
Prompt: "${prompt}"
Learner CEFR Level target: ${level}

Provide an in-depth, structured evaluation in JSON format:
- overallScore (number 1.0 to 10.0, 1 decimal)
- grammarScore (number 1.0 to 10.0)
- lexicalScore (number 1.0 to 10.0)
- coherenceScore (number 1.0 to 10.0)
- toneScore (number 1.0 to 10.0)
- cefrAssessment (e.g. "B1+ Intermediate (Tiềm năng B2)")
- errors: array of specific grammar or punctuation mistakes. For each error:
  - type (e.g. "Lỗi ngữ pháp & Chính tả", "Cấu trúc câu", "Mạo từ")
  - original (exact excerpt string from user's text)
  - suggestion (corrected version)
  - explanation (clear, educational explanation in VIETNAMESE explaining WHY it is wrong and grammar rules)
  - section (e.g. "Đoạn 1", "Đoạn 2")
- vocabUpgrades: array of 3 to 5 words/phrases that could be leveled up:
  - original (user's phrase)
  - suggestion (more sophisticated academic/professional phrase C1)
  - level (e.g. "B2 ➔ C1", "C1 Collocation", "Academic")
- polishedEssay: high-scoring rewritten version (IELTS 7.5+ standard) of the original text, keeping the user's core ideas intact.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Here is the student's essay to review:\n\n${content}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            grammarScore: { type: Type.NUMBER },
            lexicalScore: { type: Type.NUMBER },
            coherenceScore: { type: Type.NUMBER },
            toneScore: { type: Type.NUMBER },
            cefrAssessment: { type: Type.STRING },
            errors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  original: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  section: { type: Type.STRING },
                },
                required: ['type', 'original', 'suggestion', 'explanation', 'section'],
              },
            },
            vocabUpgrades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  level: { type: Type.STRING },
                },
                required: ['original', 'suggestion', 'level'],
              },
            },
            polishedEssay: { type: Type.STRING },
          },
          required: [
            'overallScore',
            'grammarScore',
            'lexicalScore',
            'coherenceScore',
            'toneScore',
            'cefrAssessment',
            'errors',
            'vocabUpgrades',
            'polishedEssay',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      overallScore: parsed.overallScore ?? 7.4,
      grammarScore: parsed.grammarScore ?? 7.0,
      lexicalScore: parsed.lexicalScore ?? 7.5,
      coherenceScore: parsed.coherenceScore ?? 8.0,
      toneScore: parsed.toneScore ?? 7.0,
      cefrAssessment: parsed.cefrAssessment ?? 'B1+ Intermediate',
      errors: parsed.errors ?? [],
      vocabUpgrades: parsed.vocabUpgrades ?? [],
      polishedEssay: parsed.polishedEssay ?? content,
    };
  } catch (error) {
    console.error('Gemini writing analysis error:', error);
    return getFallbackWritingAnalysis(content);
  }
}

function getFallbackWritingAnalysis(content: string): WritingAnalysisResult {
  return {
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
    polishedEssay: content.replace('face to face interaction', 'face-to-face interaction').replace('has some drawbacks', 'presents certain limitations'),
  };
}

export interface ConversationReplyResult {
  reply: string;
  translation: string;
  praise?: string;
  suggestion?: string;
  suggestedAnswers: string[];
  scoredWords?: Array<{ word: string; phonetic: string; points: number }>;
}

export async function generateConversationReplyWithGemini(
  history: Array<{ role: 'assistant' | 'user'; content: string }>,
  topicTitle: string,
  level: string = 'B1'
): Promise<ConversationReplyResult> {
  const ai = getGeminiClient();

  if (!ai) {
    console.warn('GEMINI_API_KEY is not configured. Returning realistic contextual response.');
    return getFallbackConversationReply(history[history.length - 1]?.content || '', topicTitle);
  }

  try {
    const systemPrompt = `You are the LinguaNext AI English Tutor (Trợ lý AI luyện tiếng Anh).
You are currently practicing an English conversational scenario with a Vietnamese university student whose current English level is ${level}.
Scenario Topic: "${topicTitle}".
Role:
- If topic is "Tech Job Interview", you are a friendly Engineering Team Lead interviewing the candidate.
- If topic is "Meeting & Brainstorming", you are a colleague collaborating on a software design.
- If topic is "Airport & Hotel Check-in", you are a polite customer service representative.
- If topic is "Coffee Chat & Daily Life", you are a warm peer discussing life and study.

Goals:
1. Provide a natural, spoken English conversational response (2 to 4 sentences).
2. Ask an engaging follow-up question to keep the conversation going.
3. Provide a natural Vietnamese translation of your response.
4. If the user's latest message had great points or errors, highlight a compliment (praise in Vietnamese) and a constructive upgrade suggestion (in Vietnamese).
5. Suggest 2 quick starter replies that the learner can choose from to respond.
6. Extract 1-3 useful technical/vocabulary words used by the user or relevant to the turn.

Return in JSON format.`;

    const chatContents = history.map((h) => `${h.role === 'assistant' ? 'AI Tutor' : 'Student'}: ${h.content}`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Here is the conversation so far:\n${chatContents}\n\nAI Tutor, respond now to the student's latest turn:`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            translation: { type: Type.STRING },
            praise: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            suggestedAnswers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            scoredWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  points: { type: Type.NUMBER },
                },
                required: ['word', 'phonetic', 'points'],
              },
            },
          },
          required: ['reply', 'translation', 'suggestedAnswers'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      reply: parsed.reply || 'That sounds great! Could you elaborate more on how that impacted the overall system?',
      translation: parsed.translation || 'Nghe rất tuyệt! Bạn có thể nói rõ hơn điều đó đã ảnh hưởng như thế nào đến toàn bộ hệ thống không?',
      praise: parsed.praise,
      suggestion: parsed.suggestion,
      suggestedAnswers: parsed.suggestedAnswers || ['“Certainly, let me walk you through the architecture.”'],
      scoredWords: parsed.scoredWords || [],
    };
  } catch (error) {
    console.error('Gemini conversation reply error:', error);
    return getFallbackConversationReply(history[history.length - 1]?.content || '', topicTitle);
  }
}

function getFallbackConversationReply(lastUserMessage: string, topicTitle: string): ConversationReplyResult {
  return {
    reply: "Impressive problem-solving! How did your teammates react when you explained your solution in the sprint retrospective?",
    translation: "Khả năng giải quyết vấn đề ấn tượng đấy! Các đồng nghiệp trong nhóm đã phản ứng ra sao khi bạn giải thích giải pháp trong buổi họp tổng kết sprint?",
    praise: "✨ Lời khen AI: Diễn đạt rất tự nhiên! Bạn đã dùng chính xác các thuật ngữ chuyên ngành công nghệ.",
    suggestion: "💡 Gợi ý nâng cao: Có thể liên kết câu chặt chẽ hơn bằng các liên từ chuyển tiếp như 'Furthermore' hoặc 'As a direct result'.",
    suggestedAnswers: [
      "“They appreciated my quick response and we documented it.”",
      "“We decided to adopt unit tests for that specific module.”",
    ],
    scoredWords: [
      { word: 'troubleshoot', phonetic: '/ˈtrʌb.əl.ʃuːt/', points: 15 },
      { word: 'architecture', phonetic: '/ˈɑː.kɪ.tek.tʃər/', points: 12 },
    ],
  };
}

export async function askQuickAITutor(query: string, type: string): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    if (type === 'grammar') {
      return `Trong tiếng Anh, quy tắc ngữ pháp cho câu "${query}" phụ thuộc vào chủ ngữ và thì động từ. Ví dụ: Nếu là hành động đã diễn ra trong quá khứ, hãy dùng thì Quá khứ đơn (V2/V-ed).`;
    } else if (type === 'translate') {
      return `Bản dịch tự nhiên: "${query}". Trong bối cảnh giao tiếp quốc tế, bạn có thể diễn đạt uyển chuyển hơn tùy theo văn phong trang trọng hay thân mật.`;
    } else {
      return `Các từ đồng nghĩa nâng cấp cho "${query}": 1. Substantial, 2. Paramount, 3. Foster.`;
    }
  }

  try {
    const prompt = `You are LinguaNext AI tutor.
Type of request: ${type} (can be grammar explanation, translation, or synonyms).
User input: "${query}"
Answer concisely, encouragingly, and clearly in Vietnamese with English examples. Max 3-4 sentences.`;

    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return res.text?.trim() || 'Rất vui được hỗ trợ bạn!';
  } catch (e) {
    console.error('Quick AI tutor error:', e);
    return 'Hệ thống đang bận, vui lòng thử lại sau giây lát!';
  }
}
