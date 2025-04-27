import express from 'express';
import * as oauth from '../auth/oauth.js';
import axios from 'axios';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const OAUTH_BASE_URL = config.kick.oauthBaseUrl;
const API_BASE_URL = config.kick.apiBaseUrl;

/**
 * Get an app access token using client credentials flow
 * @returns {Promise<Object>} Token response
 */
export async function getAppAccessToken() {
  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.kick.clientId,
      client_secret: config.kick.clientSecret
    });

    const response = await axios.post(
      `${OAUTH_BASE_URL}/oauth/token`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Error getting app access token', error);
    throw error;
  }
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from OAuth flow
 * @param {string} codeVerifier - PKCE code verifier
 * @returns {Promise<Object>} Token response
 */
export async function getUserAccessToken(code, codeVerifier) {
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.kick.clientId,
      client_secret: config.kick.clientSecret,
      redirect_uri: config.kick.redirectUri,
      code: code,
      code_verifier: codeVerifier
    });

    const response = await axios.post(
      `${OAUTH_BASE_URL}/oauth/token`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Error exchanging code for token', error);
    throw error;
  }
}

/**
 * Refresh an access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} Token response
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.kick.clientId,
      client_secret: config.kick.clientSecret,
      refresh_token: refreshToken
    });

    const response = await axios.post(
      `${OAUTH_BASE_URL}/oauth/token`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Error refreshing token', error);
    throw error;
  }
}

/**
 * Revoke a token
 * @param {string} token - Token to revoke
 * @param {string} tokenType - Type of token ('access_token' or 'refresh_token')
 * @returns {Promise<Object>} Response
 */
export async function revokeToken(token, tokenType) {
  try {
    const url = new URL(`${OAUTH_BASE_URL}/oauth/revoke`);
    url.searchParams.append('token', token);
    
    if (tokenType) {
      url.searchParams.append('token_hint_type', tokenType);
    }

    const response = await axios.post(
      url.toString(),
      null,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Error revoking token', error);
    throw error;
  }
}

// API Endpoints

/**
 * Get user profile information
 * @param {string} token - Access token
 * @returns {Promise<Object>} User data
 */
export async function getUserProfile(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error getting user profile', error);
    throw error;
  }
}

/**
 * Get channel information
 * @param {string} username - Channel username
 * @param {string} token - Access token
 * @returns {Promise<Object>} Channel data
 */
export async function getChannel(username, token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/v1/channels/${username}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Error getting channel for ${username}`, error);
    throw error;
  }
}

// Endpoint to obtain App Access Token
router.post('/app-access-token', async (req, res) => {
    try {
        const token = await oauth.getAppAccessToken();
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to obtain User Access Token
router.post('/user-access-token', async (req, res) => {
    try {
        const { code, codeVerifier } = req.body;
        if (!code || !codeVerifier) {
            return res.status(400).json({ error: 'Missing code or codeVerifier' });
        }
        const token = await oauth.exchangeCodeForToken(code, codeVerifier);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to refresh Access Token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Missing refreshToken' });
        }
        const newToken = await oauth.refreshAccessToken(refreshToken);
        res.json({ token: newToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;