import clientPromise from "./mongodb";
import { MongoClient, Db, Collection, Document } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await clientPromise;
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export const getCollection = async <T extends Document>(
  collectionName: string
): Promise<Collection<T>> => {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
};

export const getDB = async () => {
  const { db } = await connectToDatabase();
  return db;
};
