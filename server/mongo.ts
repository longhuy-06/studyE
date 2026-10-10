import mongoose from 'mongoose';
import {
  UserModel,
  LearningProfileModel,
  VocabularyModel,
  VocabProgressModel,
  ListeningExerciseModel,
  WritingSubmissionModel,
  ConversationSessionModel,
  UserSettingsModel,
  LearningActivityModel,
} from './models/index.js';
import type {
  User,
  LearningProfile,
  UserVocabProgress,
  UserSettings,
  LearningActivity,
  WritingSubmission,
  ConversationSession,
  DatabaseSchema,
} from './db.js';

let isConnected = false;
let mongoDbName = '';
let connectionError: string | null = null;

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getMongoStatus() {
  return {
    isConnected: isMongoConnected(),
    readyState: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    databaseName: mongoDbName || null,
    hasConfiguredUri: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0),
    error: connectionError,
  };
}

let retryTimer: NodeJS.Timeout | null = null;

function scheduleRetry(seedFallbackData?: DatabaseSchema) {
  if (retryTimer || isConnected) return;
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    if (isConnected) return;
    console.log('🔄 [MongoDB] Đang tự động thử kết nối lại với MongoDB Atlas...');
    const ok = await initMongoDB(seedFallbackData);
    if (!ok && !isConnected) {
      scheduleRetry(seedFallbackData);
    }
  }, 12000);
}

/**
 * Initializes MongoDB connection if MONGODB_URI is provided.
 * Gracefully logs and falls back to local file storage if not configured or connection fails.
 */
export async function initMongoDB(seedFallbackData?: DatabaseSchema): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '' || uri.includes('<username>') || uri.includes('<db_password>')) {
    console.log('ℹ️ [MongoDB] MONGODB_URI chưa được cấu hình. Sử dụng cơ chế lưu trữ JSON cục bộ (data/database.json).');
    return false;
  }

  try {
    console.log('🔄 [MongoDB] Đang kết nối tới MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    isConnected = true;
    connectionError = null;
    mongoDbName = mongoose.connection.name || 'linguanext';
    console.log(`✅ [MongoDB] Kết nối thành công tới database "${mongoDbName}"!`);

    // Listen for disconnects
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ [MongoDB] Mất kết nối tới MongoDB. Sẽ tự động thử kết nối lại...');
      isConnected = false;
      scheduleRetry(seedFallbackData);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ [MongoDB] Đã kết nối lại thành công tới MongoDB!');
      isConnected = true;
    });

    // Auto-seed if collections are empty and seed data provided
    if (seedFallbackData) {
      await syncInitialSeedIfEmpty(seedFallbackData);
    }

    return true;
  } catch (err: any) {
    isConnected = false;
    connectionError = err?.message || String(err);
    console.warn('⚠️ [MongoDB] Chưa thể kết nối MongoDB (thường do chưa mở IP 0.0.0.0/0 trên Atlas):', connectionError);
    console.log('ℹ️ [MongoDB] Đang tạm dùng bộ nhớ cục bộ và sẽ tự động thử kết nối lại mỗi 12 giây...');
    scheduleRetry(seedFallbackData);
    return false;
  }
}

/**
 * Seeds initial collections from local data if MongoDB collections are empty.
 */
async function syncInitialSeedIfEmpty(seed: DatabaseSchema) {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0 && seed.users?.length) {
      console.log('🌱 [MongoDB] Seeding initial users...');
      await UserModel.insertMany(seed.users);
    }

    const profileCount = await LearningProfileModel.countDocuments();
    if (profileCount === 0 && seed.profiles?.length) {
      console.log('🌱 [MongoDB] Seeding initial profiles...');
      await LearningProfileModel.insertMany(seed.profiles);
    }

    const vocabCount = await VocabularyModel.countDocuments();
    if (vocabCount === 0 && seed.vocabularies?.length) {
      console.log('🌱 [MongoDB] Seeding initial vocabularies...');
      await VocabularyModel.insertMany(seed.vocabularies);
    }

    const listeningCount = await ListeningExerciseModel.countDocuments();
    if (listeningCount === 0 && seed.listeningExercises?.length) {
      console.log('🌱 [MongoDB] Seeding initial listening exercises...');
      await ListeningExerciseModel.insertMany(seed.listeningExercises);
    }

    const settingsCount = await UserSettingsModel.countDocuments();
    if (settingsCount === 0 && seed.settings?.length) {
      await UserSettingsModel.insertMany(seed.settings);
    }

    const progressCount = await VocabProgressModel.countDocuments();
    if (progressCount === 0 && seed.vocabProgress?.length) {
      await VocabProgressModel.insertMany(seed.vocabProgress);
    }

    const actCount = await LearningActivityModel.countDocuments();
    if (actCount === 0 && seed.activities?.length) {
      await LearningActivityModel.insertMany(seed.activities);
    }

    console.log('✨ [MongoDB] Hoàn tất kiểm tra và khởi tạo dữ liệu mẫu trên MongoDB.');
  } catch (e) {
    console.error('❌ [MongoDB] Lỗi khi seed dữ liệu ban đầu:', e);
  }
}

/**
 * Hydrates in-memory / JSON cache from MongoDB when MongoDB has data.
 */
export async function loadDataFromMongo(): Promise<Partial<DatabaseSchema> | null> {
  if (!isMongoConnected()) return null;

  try {
    const [users, profiles, vocabularies, vocabProgress, listeningExercises, writingSubmissions, conversations, settings, activities] =
      await Promise.all([
        UserModel.find().lean(),
        LearningProfileModel.find().lean(),
        VocabularyModel.find().lean(),
        VocabProgressModel.find().lean(),
        ListeningExerciseModel.find().lean(),
        WritingSubmissionModel.find().lean(),
        ConversationSessionModel.find().lean(),
        UserSettingsModel.find().lean(),
        LearningActivityModel.find().lean(),
      ]);

    return {
      users: (users as any[]) || [],
      profiles: (profiles as any[]) || [],
      vocabularies: (vocabularies as any[]) || [],
      vocabProgress: (vocabProgress as any[]) || [],
      listeningExercises: (listeningExercises as any[]) || [],
      writingSubmissions: (writingSubmissions as any[]) || [],
      conversations: (conversations as any[]) || [],
      settings: (settings as any[]) || [],
      activities: (activities as any[]) || [],
    };
  } catch (err) {
    console.error('❌ [MongoDB] Lỗi khi đọc dữ liệu từ MongoDB:', err);
    return null;
  }
}

// --- Asynchronous Write Sync Helpers ---

export async function mongoUpsertUser(user: User) {
  if (!isMongoConnected()) return;
  try {
    await UserModel.findOneAndUpdate({ id: user.id }, user, { upsert: true, new: true });
  } catch (err) {
    console.error('❌ [MongoDB] Lỗi lưu User:', err);
  }
}

export async function mongoUpsertProfile(profile: LearningProfile) {
  if (!isMongoConnected()) return;
  try {
    await LearningProfileModel.findOneAndUpdate({ userId: profile.userId }, profile, { upsert: true, new: true });
  } catch (err) {
    console.error('❌ [MongoDB] Lỗi lưu Profile:', err);
  }
}

export async function mongoUpsertSettings(settings: UserSettings) {
  if (!isMongoConnected()) return;
  try {
    await UserSettingsModel.findOneAndUpdate({ userId: settings.userId }, settings, { upsert: true, new: true });
  } catch (err) {
    console.error('❌ [MongoDB] Lỗi lưu Settings:', err);
  }
}

export async function mongoUpsertVocabProgress(progress: UserVocabProgress) {
  if (!isMongoConnected()) return;
  try {
    await VocabProgressModel.findOneAndUpdate(
      { userId: progress.userId, vocabId: progress.vocabId },
      progress,
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('❌ [MongoDB] Lỗi lưu VocabProgress:', err);
  }
}

export async function mongoAddActivity(activity: LearningActivity) {
  if (!isMongoConnected()) return;
  try {
    await LearningActivityModel.create(activity);
  } catch (err) {
    console.error('❌ [MongoDB] Lỗi lưu Activity:', err);
  }
}

export async function mongoAddWritingSubmission(sub: WritingSubmission) {
  if (!isMongoConnected()) return;
  try {
    await WritingSubmissionModel.findOneAndUpdate({ id: sub.id }, sub, { upsert: true, new: true });
  } catch (err) {
    console.error('❌ [MongoDB] Lỗi lưu WritingSubmission:', err);
  }
}

export async function mongoAddConversation(conv: ConversationSession) {
  if (!isMongoConnected()) return;
  try {
    await ConversationSessionModel.findOneAndUpdate({ id: conv.id }, conv, { upsert: true, new: true });
  } catch (err) {
    console.error('❌ [MongoDB] Lỗi lưu Conversation:', err);
  }
}
