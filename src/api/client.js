import axios from 'axios';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class Client {
  constructor() {
    this.baseUrl = config.kick.apiBaseUrl;
    this.accessToken = null;
    this.tokenType = 'Bearer';
  }

  /**
   * Set the access token for authenticated requests
   * @param {string} token - The access token
   * @param {string} type - The token type (default: 'Bearer')
   */
  setAccessToken(token, type = 'Bearer') {
    this.accessToken = token;
    this.tokenType = type;
  }

  /**
   * Get the authorization header
   * @returns {Object} Headers object with Authorization
   */
  getAuthHeaders() {
    if (!this.accessToken) {
      throw new Error('No access token set. Call setAccessToken first.');
    }
    return {
      'Authorization': `${this.tokenType} ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make a request to the Kick API
   * @param {string} endpoint - API endpoint path (without base URL)
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {Object} data - Request payload (for POST, PUT, etc.)
   * @param {boolean} authenticated - Whether the request requires authentication
   * @returns {Promise<Object>} API response
   */
  async request(endpoint, method = 'GET', data = null, authenticated = true) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = authenticated ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };
      
      const config = {
        method,
        url,
        headers,
        ...(data && method !== 'GET' && { data }),
        ...(data && method === 'GET' && { params: data })
      };
      
      logger.info(`Making ${method} request to ${endpoint}`);
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`API request failed: ${error.message}`, error);
      
      if (error.response) {
        // The request was made and the server responded with an error status
        logger.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      
      throw error;
    }
  }
}