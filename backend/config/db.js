import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  mongoose.set('strictQuery', true);

  const attempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected');
      return;
    } catch (error) {
      lastError = error;
      const transient = /EREFUSED|EAI_AGAIN|ENOTFOUND|ETIMEDOUT|queryTxt/i.test(
        error?.message || ''
      );
      if (!transient || attempt === attempts) break;
      console.error(
        `MongoDB connection attempt ${attempt} failed. Retrying...`
      );
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }

  throw lastError;
}
