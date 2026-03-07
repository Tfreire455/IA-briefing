import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI não definido no .env');

let cached = global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      dbName: 'briefing-tmdev',
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}