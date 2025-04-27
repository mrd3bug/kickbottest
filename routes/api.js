import express from 'express';
import axios from 'axios';
import { logger } from '../src/utils/logger.js';
import { config } from '../src/config/config.js';
import * as kickService from '../src/services/kickService.js';

const router = express.Router();

// Middleware to check for authorization
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  
  req.token = authHeader.split(' ')[1];
  next();
};

// Endpoint to obtain App Access Token
router.post('/app-access-token', async (req, res) => {
    try {
        const token = await kickService.getAppAccessToken(req.body);
        res.json(token);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to obtain User Access Token
router.post('/user-access-token', async (req, res) => {
    try {
        const token = await kickService.getUserAccessToken(req.body);
        res.json(token);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to refresh User Access Token
router.post('/refresh-token', async (req, res) => {
    try {
        const token = await kickService.refreshUserAccessToken(req.body);
        res.json(token);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to revoke User Access Token
router.post('/revoke-token', async (req, res) => {
    try {
        await kickService.revokeUserAccessToken(req.body);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Example endpoint to get user information
 */
router.get('/user', requireAuth, async (req, res) => {
  try {
    const userData = await kickService.getUserInfo(req.token);
    res.json(userData);
  } catch (error) {
    logger.error('Error fetching user data', error);
    res.status(error.response?.status || 500).json({
      error: 'Error fetching user data',
      details: error.response?.data || error.message
    });
  }
});

/**
 * Example endpoint to get channel information
 */
router.get('/channels/:username', requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const channelData = await kickService.getChannelInfo(username, req.token);
    res.json(channelData);
  } catch (error) {
    logger.error(`Error fetching channel data for ${req.params.username}`, error);
    res.status(error.response?.status || 500).json({
      error: 'Error fetching channel data',
      details: error.response?.data || error.message
    });
  }
});

export default router;