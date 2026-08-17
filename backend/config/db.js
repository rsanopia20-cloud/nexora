import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);

  // Mobile is no longer unique. Drop the old unique index if it still exists.
  try {
    await mongoose.connection.collection('users').dropIndex('mobile_1');
    console.log('Dropped unique index on users.mobile');
  } catch (error) {
    const missing = error?.code === 27 || /index not found/i.test(error?.message || '');
    if (!missing) {
      console.warn('Could not drop users.mobile index:', error.message);
    }
  }

  console.log('MongoDB connected');
}
