import { MongoClient, Db } from "mongodb";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://testUser:devilkumar123@cluster0.ogsfrpj.mongodb.net/BhansaMart_backend";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("BhansaMart_backend");

  cachedClient = client;
  cachedDb = db;
  return db;
}
