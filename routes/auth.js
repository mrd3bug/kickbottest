import express from 'express';
import crypto from 'crypto';
import * as oauth from '../src/auth/oauth.js';
import { logger } from '../src/utils/logger.js';
import { config } from '../src/config/config.js';

const router = express.Router();

// Store code verifiers temporarily (in a real app, use a database or Redis)
const codeVerifiers = {};
const states = {};

/**
 * Initiate the OAuth login flow
 */
router.get('/login', (req, res) => {
  try {
    // Generate PKCE code verifier and challenge
    const codeVerifier = oauth.generateCodeVerifier();
    const codeChallenge = oauth.generateCodeChallenge(codeVerifier);
    
    // Generate state for CSRF protection
    const state = oauth.generateState();
    
    // Store in session (temporary solution)
    const sessionId = crypto.randomUUID();
    codeVerifiers[sessionId] = codeVerifier;
    states[sessionId] = state;
    
    // Set cookie to retrieve session later
    res.cookie('session_id', sessionId, { 
      httpOnly: true,
      maxAge: 10 * 60 * 1000 // 10 minutes
    });
    
    // Construct authorization URL
    const scope = 'user:read channels:read'; // Define required scopes
    const authUrl = oauth.getAuthorizationUrl(scope, codeChallenge, state);
    
    // Redirect to Kick's OAuth authorization endpoint
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Error initiating OAuth flow', error);
    res.status(500).send('Error initiating login flow');
  }
});

/**
 * Handle the OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const sessionId = req.cookies.session_id;
    
    // Verify session exists
    if (!sessionId || !codeVerifiers[sessionId]) {
      return res.status(400).send('Invalid session');
    }
    
    // Verify state matches to prevent CSRF
    if (state !== states[sessionId]) {
      return res.status(400).send('Invalid state parameter');
    }
    
    // Exchange code for token
    const codeVerifier = codeVerifiers[sessionId];
    const tokenResponse = await oauth.exchangeCodeForToken(code, codeVerifier);
    
    // Clean up session data
    delete codeVerifiers[sessionId];
    delete states[sessionId];
    
    // In a real app, store tokens securely
    // For now, just show success and token info
    res.json({ 
      success: true,
      message: 'Successfully authenticated with Kick',
      // Don't expose tokens in production
      tokenInfo: {
        accessToken: tokenResponse.access_token.substring(0, 10) + '...',
        expiresIn: tokenResponse.expires_in,
        tokenType: tokenResponse.token_type,
        scope: tokenResponse.scope
      }
    });
  } catch (error) {
    logger.error('Error in OAuth callback', error);
    res.status(500).send('Error processing authentication');
  }
});

/**
 * Get app access token (client credentials flow)
 */
router.post('/token', async (req, res) => {
  try {
    const tokenResponse = await oauth.getAppAccessToken();
    res.json({
      success: true,
      accessToken: tokenResponse.access_token.substring(0, 10) + '...',
      expiresIn: tokenResponse.expires_in,
      tokenType: tokenResponse.token_type
    });
  } catch (error) {
    logger.error('Error getting app access token', error);
    res.status(500).send('Error obtaining access token');
  }
});

/**
 * Refresh an access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).send('Refresh token is required');
    }
    
    const tokenResponse = await oauth.refreshAccessToken(refreshToken);
    res.json({
      success: true,
      tokenInfo: {
        accessToken: tokenResponse.access_token.substring(0, 10) + '...',
        refreshToken: tokenResponse.refresh_token.substring(0, 10) + '...',
        expiresIn: tokenResponse.expires_in,
        tokenType: tokenResponse.token_type,
        scope: tokenResponse.scope
      }
    });
  } catch (error) {
    logger.error('Error refreshing token', error);
    res.status(500).send('Error refreshing token');
  }
});

export default router;