import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/env.js';
import { responseTimer } from './middleware/responseTimer.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public');

const app = express();

// Disable x-powered-by header for security
app.disable('x-powered-by');

// Enable Gzip/Deflate compression for fast network payload transfer
app.use(compression());

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    credentials: true,
  })
);

// High-speed JSON & URL-encoded parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static assets
app.use(express.static(publicDir));

// Response performance timing header & logging
app.use(responseTimer);

// Root: Chrome-style offline dead page
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'offline.html'));
});

// Database Console Web GUI routes
app.get('/db-admin', (req, res) => {
  res.redirect('/console');
});

app.get(['/console', '/database', '/admin/db'], (req, res) => {
  res.sendFile(path.join(publicDir, 'console.html'));
});

// API Routes
app.use('/api', apiRouter);

// Fallback for all other non-API browser GET requests -> Chrome offline dead page
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
  }
  res.sendFile(path.join(publicDir, 'offline.html'));
});

// 404 & Centralized Error Handling for API routes
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
