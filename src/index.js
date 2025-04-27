import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';
import { config } from './config/config.js';
import authRoutes from '../routes/auth.js';
import apiRoutes from '../routes/api.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Basic routes
app.get('/', (req, res) => {
  res.send('Kick API OAuth Client is running');
});

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});