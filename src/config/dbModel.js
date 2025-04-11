const { MongoClient } = require('mongodb');

const mongoURI = process.env.MONGODB_URI;
const dbName = 'models';

let db = null;

const connectDB = async () => {
  if (db) return db;

  const client = new MongoClient(mongoURI, { useUnifiedTopology: true });
  await client.connect();
  db = client.db(dbName);
  return db;
};

module.exports = connectDB;
