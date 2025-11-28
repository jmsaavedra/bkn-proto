/**
 * MongoDB Connection Singleton for Next.js
 *
 * This file provides a cached MongoDB connection for Next.js to prevent
 * connection exhaustion during development (hot reloading) and in production.
 */

import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const MONGODB_URI: string = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  console.log('[MongoDB] connectDB called');
  console.log('[MongoDB] MONGODB_URI exists:', !!MONGODB_URI);
  console.log('[MongoDB] URI preview:', MONGODB_URI?.substring(0, 40) + '...');

  if (cached.conn) {
    console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[MongoDB] Creating new connection...');
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MongoDB] Connected successfully!');
      console.log('[MongoDB] Database name:', mongoose.connection.db?.databaseName);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('[MongoDB] Connection established');
  } catch (e) {
    console.error('[MongoDB] Connection error:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
