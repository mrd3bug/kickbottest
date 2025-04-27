import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3000,
  },
  kick: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
    oauthBaseUrl: 'https://id.kick.com',
    apiBaseUrl: 'https://kick.com/api',
  },
  auth: {
    tokenExpiryBuffer: 300, // 5 minutes in seconds
  }
};