import mongoose from 'mongoose'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

const globalForMongoose = globalThis as unknown as {
  mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (globalForMongoose.mongoose.conn) {
    return globalForMongoose.mongoose.conn
  }
  if (!globalForMongoose.mongoose.promise) {
    globalForMongoose.mongoose.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }
  globalForMongoose.mongoose.conn = await globalForMongoose.mongoose.promise
  return globalForMongoose.mongoose.conn
}

const globalForClient = globalThis as unknown as {
  _mongoClient: MongoClient | undefined
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  if (!globalForClient._mongoClient) {
    globalForClient._mongoClient = new MongoClient(MONGODB_URI)
  }
  clientPromise = globalForClient._mongoClient.connect()
} else {
  clientPromise = new MongoClient(MONGODB_URI).connect()
}

export { clientPromise }
