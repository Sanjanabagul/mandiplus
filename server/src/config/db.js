import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { config } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongodInstance = null;

/**
 * Returns a sanitized MongoDB host and database string without any username or password.
 */
export const getSanitizedMongoUri = (rawUri = config.mongodbUri) => {
  if (!rawUri) return 'unknown';
  try {
    const isSrv = rawUri.startsWith('mongodb+srv://');
    const cleanScheme = isSrv ? 'https://' : 'http://';
    const parsed = new URL(rawUri.replace(/^mongodb(\+srv)?:\/\//, cleanScheme));
    const dbName = parsed.pathname.replace(/^\//, '') || 'mandiplus';
    return `${isSrv ? 'mongodb+srv://' : 'mongodb://'}${parsed.host}/${dbName}`;
  } catch {
    return 'configured-mongodb-cluster';
  }
};

/**
 * Returns safe diagnostic information about active MongoDB connection.
 * Guaranteed never to expose credentials or secrets.
 */
export const getSafeDatabaseDiagnostics = async () => {
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const state = readyStateMap[mongoose.connection.readyState] || 'unknown';
  const isConnected = mongoose.connection.readyState === 1;

  const diagnostics = {
    connected: isConnected,
    connectionState: state,
    databaseName: mongoose.connection.name || (isConnected ? 'mandiplus' : 'none'),
    clusterHost: getSanitizedMongoUri(config.mongodbUri),
    isMemoryFallback: Boolean(mongodInstance),
    timestamp: new Date().toISOString()
  };

  if (isConnected && mongoose.connection.db) {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      diagnostics.collections = collections.map(c => c.name);
    } catch {
      diagnostics.collections = [];
    }
  }

  return diagnostics;
};

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Automated test isolation: Always use an isolated in-memory database during tests
  // to avoid mutating or wiping production/live Atlas collections.
  if (config.nodeEnv === 'test') {
    if (!mongodInstance) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'mandiplus_test'
        }
      });
    }
    const baseUri = mongodInstance.getUri();
    const testUri = baseUri.endsWith('/') ? `${baseUri}mandiplus_test` : `${baseUri}/mandiplus_test`;
    await mongoose.connect(testUri);
    return mongoose.connection;
  }

  const sanitizedTarget = getSanitizedMongoUri(config.mongodbUri);

  try {
    console.log(`[MongoDB] Connecting to database at: ${sanitizedTarget}...`);
    await mongoose.connect(config.mongodbUri, {
      dbName: 'mandiplus',
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Successfully connected to database: ${mongoose.connection.name} (${sanitizedTarget})`);
    return mongoose.connection;
  } catch (err) {
    if (config.useEmbeddedDbFallback) {
      console.warn(`[MongoDB] Configured database (${sanitizedTarget}) not reachable (${err.message}). Isolated test environment detected.`);
      console.log('[MongoDB] Initializing embedded in-memory database for isolated test runner...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create({
          instance: {
            dbName: 'mandiplus'
          }
        });
        const baseUri = mongodInstance.getUri();
        const embeddedUri = baseUri.endsWith('/') ? `${baseUri}mandiplus` : `${baseUri}/mandiplus`;
        await mongoose.connect(embeddedUri);
        console.log(`[MongoDB] Connected to isolated test in-memory database.`);
        return mongoose.connection;
      } catch (embeddedErr) {
        console.error('[MongoDB] Failed to initialize isolated test database:', embeddedErr.message);
        throw embeddedErr;
      }
    } else {
      console.error(`[MongoDB] Connection failed to ${sanitizedTarget}:`, err.message);
      throw new Error(`Database connection failed: Could not connect to MongoDB at ${sanitizedTarget}. ${err.message}`);
    }
  }
};

export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
  } catch (err) {
    console.error('[MongoDB] Error during disconnect:', err.message);
  }
};
