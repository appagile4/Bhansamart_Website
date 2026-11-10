import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Please configure it in your .env file."
    );
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("BhansaMart_backend");

  cachedClient = client;
  cachedDb = db;
  return db;
}
