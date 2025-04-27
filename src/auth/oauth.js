import crypto from 'crypto';
import axios from 'axios';
import {config} from '../config/config.js';

const { kick } = config;

/**
 * Generate a code verifier for PKCE
 * @returns {string} The code verifier
 */
export function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a code challenge from a code verifier
 * @param {string} verifier - The code verifier
 * @returns {string} The code challenge
 */
export function generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Generate a random state for OAuth flow
 * @returns {string} The random state
 */
export function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Get the authorization URL for the Kick OAuth flow
 * @param {string} scope - Space-separated scopes to request
 * @param {string} codeChallenge - The code challenge for PKCE
 * @param {string} state - Random state for OAuth flow
 * @returns {string} The full authorization URL
 */
export function getAuthorizationUrl(scope, codeChallenge, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: kick.clientId,
    redirect_uri: kick.redirectUri,
    scope: scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state
  });

  return `${kick.oauthBaseUrl}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - The authorization code
 * @param {string} codeVerifier - The code verifier for PKCE
 * @returns {Promise<Object>} The token response
 */
export async function exchangeCodeForToken(code, codeVerifier) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: kick.clientId,
    client_secret: kick.clientSecret,
    redirect_uri: kick.redirectUri,
    code_verifier: codeVerifier,
    code: code
  });

  const response = await axios.post(
    `${kick.oauthBaseUrl}/oauth/token`, 
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data;
}

/**
 * Get an app access token (client credentials flow)
 * @returns {Promise<Object>} The token response
 */
export async function getAppAccessToken() {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: kick.clientId,
    client_secret: kick.clientSecret
  });

  const response = await axios.post(
    `${kick.oauthBaseUrl}/oauth/token`, 
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data;
}

/**
 * Refresh an access token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} The token response
 */
export async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: kick.clientId,
    client_secret: kick.clientSecret,
    refresh_token: refreshToken
  });

  const response = await axios.post(
    `${kick.oauthBaseUrl}/oauth/token`, 
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data;
}

/**
 * Revoke a token
 * @param {string} token - The token to revoke
 * @param {string} tokenType - The token type ('access_token' or 'refresh_token')
 * @returns {Promise<Object>} The response
 */
export async function revokeToken(token, tokenType) {
  const url = new URL(`${kick.oauthBaseUrl}/oauth/revoke`);
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
}