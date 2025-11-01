import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  console.error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI || "";
const options = {};

let client: MongoClient;

// In development mode, use a global variable so that the value
// is preserved across module reloads caused by HMR (Hot Module Replacement)
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(uri, options);
  globalWithMongo._mongoClientPromise = client.connect();
}
const clientPromise = globalWithMongo._mongoClientPromise;

// Export a module-scoped MongoClient promise
export default clientPromise;
