import { Client } from '../api/client.js';
import * as oauth from '../auth/oauth.js';
import * as api from '../api/endpoints.js';
import axios from 'axios';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

class KickService {
    constructor() {
        this.client = new Client();
    }

    async fetchAppAccessToken() {
        try {
            const token = await oauth.getAppAccessToken();
            this.client.setAccessToken(token.access_token, token.token_type);
            return token;
        } catch (error) {
            throw new Error('Failed to fetch App Access Token: ' + error.message);
        }
    }

    async fetchUserAccessToken(authCode, codeVerifier) {
        try {
            const token = await oauth.exchangeCodeForToken(authCode, codeVerifier);
            this.client.setAccessToken(token.access_token, token.token_type);
            return token;
        } catch (error) {
            throw new Error('Failed to fetch User Access Token: ' + error.message);
        }
    }

    async makeAuthenticatedRequest(endpoint, method = 'GET', data = null) {
        try {
            const response = await this.client.request(endpoint, method, data);
            return response;
        } catch (error) {
            throw new Error('API request failed: ' + error.message);
        }
    }
}

// Export an instance of the service
export const kickService = new KickService();

/**
 * Get user information from Kick API
 * @param {string} token - Access token
 * @returns {Promise<Object>} User data
 */
export async function getUserInfo(token) {
  try {
    const response = await axios.get(`${config.kick.apiBaseUrl}/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error in getUserInfo service', error);
    throw error;
  }
}

/**
 * Get channel information from Kick API
 * @param {string} username - Channel username
 * @param {string} token - Access token
 * @returns {Promise<Object>} Channel data
 */
export async function getChannelInfo(username, token) {
  try {
    const response = await axios.get(`${config.kick.apiBaseUrl}/v1/channels/${username}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Error in getChannelInfo service for ${username}`, error);
    throw error;
  }
}

/**
 * Get livestream information for a channel
 * @param {string} channelId - Channel ID
 * @param {string} token - Access token
 * @returns {Promise<Object>} Livestream data
 */
export async function getLivestreamInfo(channelId, token) {
  try {
    const response = await axios.get(`${config.kick.apiBaseUrl}/v1/channels/${channelId}/livestream`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Error in getLivestreamInfo service for channel ${channelId}`, error);
    throw error;
  }
}