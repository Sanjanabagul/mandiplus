import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uriFilePath = path.resolve(__dirname, '../../.active-mongo-uri');

const saveActiveUri = (uri) => {
  try {
    fs.writeFileSync(uriFilePath, uri, 'utf-8');
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║ 🍃 MONGODB COMPASS CONNECTION STRING:                        ║');
    console.log(`║ 👉 ${uri.padEnd(57)} ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  } catch {
    // ignore
  }
};

let mongodInstance = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    // Attempt connecting to the configured MongoDB URI with reasonable timeout for Atlas
    console.log(`[MongoDB] Attempting connection to: ${config.mongodbUri}...`);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Successfully connected to MongoDB at ${config.mongodbUri}`);
    saveActiveUri(config.mongodbUri);
  } catch (err) {
    if (config.useEmbeddedDbFallback) {
      console.warn(`[MongoDB] Local MongoDB on ${config.mongodbUri} not reachable (${err.message}).`);

      // First check if an embedded instance is already running from the server process
      if (fs.existsSync(uriFilePath)) {
        try {
          const activeUri = fs.readFileSync(uriFilePath, 'utf-8').trim();
          if (activeUri && activeUri !== config.mongodbUri) {
            console.log(`[MongoDB] Attempting connection to running active instance at ${activeUri}...`);
            await mongoose.connect(activeUri, { serverSelectionTimeoutMS: 2000 });
            console.log(`[MongoDB] Connected to active instance successfully at ${activeUri}`);
            return mongoose.connection;
          }
        } catch {
          // If connection to saved uri failed, create a new instance below
        }
      }

      console.log('[MongoDB] Initializing embedded local MongoDB engine for instant zero-config development...');
      try {
        mongodInstance = await MongoMemoryServer.create({
          instance: {
            dbName: 'mandiplus'
          }
        });
        const baseUri = mongodInstance.getUri();
        const embeddedUri = baseUri.endsWith('/') ? `${baseUri}mandiplus` : `${baseUri}/mandiplus`;
        await mongoose.connect(embeddedUri);
        console.log(`[MongoDB] Connected to embedded MongoDB successfully at ${embeddedUri}`);
        saveActiveUri(embeddedUri);
      } catch (embeddedErr) {
        console.error('[MongoDB] Failed to initialize embedded MongoDB:', embeddedErr.message);
        throw embeddedErr;
      }
    } else {
      console.error('[MongoDB] Connection error:', err.message);
      throw err;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error event:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected.');
  });
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[MongoDB] Error during disconnect:', err.message);
  }
};
