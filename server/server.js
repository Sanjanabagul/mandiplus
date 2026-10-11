import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { logger } from './src/utils/logger.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import wishlistRoutes from './src/routes/wishlistRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import sellerRoutes from './src/routes/sellerRoutes.js';
import deliveryRoutes from './src/routes/deliveryRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows serving local uploaded produce images
}));

app.use(cors({
  origin: config.clientUrl || '*',
  credentials: true
}));

// Request logging in development
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'Mandi+ Agri-Commerce API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
  });
});

// Centralized error handler
app.use(errorHandler);

import { runSeed } from './src/seeds/seed.js';

// Server startup function
const startServer = async () => {
  try {
    await connectDB();

    // Check if database is empty and auto-seed initial demo catalog
    const { Product } = await import('./src/models/Product.js');
    const count = await Product.countDocuments();
    if (count === 0) {
      logger.info('Fresh database detected. Auto-seeding initial categories, demo users, and produce catalog...');
      await runSeed();
    }

    const server = app.listen(config.port, () => {
      logger.info(`Mandi+ Backend API listening on http://localhost:${config.port}`);
      logger.info(`Health check available at: http://localhost:${config.port}/api/health`);
    });
    return server;
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start server only when run directly as main entrypoint
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export default app;
