import { KickAuthClient } from 'kick-auth';
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Set up session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Create Kick Auth client
const kickAuth = new KickAuthClient({
    clientId: process.env.KICK_CLIENT_ID,
    clientSecret: process.env.KICK_CLIENT_SECRET,
    redirectUri: process.env.KICK_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    scopes: ['user:read', 'channel:read']
});

// Simple home route
app.get('/', (req, res) => {
    res.send('<h1>Kick API Bot</h1><a href="/auth/login">Login with Kick</a>');
});

// Login route
app.get('/auth/login', async (req, res) => {
    try {
        // Generate authorization URL with PKCE
        const { url, state, codeVerifier } = await kickAuth.getAuthorizationUrl();
        
        // Store state and codeVerifier in session
        req.session.state = state;
        req.session.codeVerifier = codeVerifier;
        
        // Redirect to Kick login
        res.redirect(url);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Failed to initialize auth flow');
    }
});

// Callback route
app.get('/auth/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        
        // Verify state parameter
        if (state !== req.session.state) {
            return res.status(400).send('Invalid state parameter');
        }
        
        // Exchange code for tokens
        const tokens = await kickAuth.getAccessToken(
            code,
            req.session.codeVerifier
        );
        
        // Store tokens securely
        req.session.accessToken = tokens.access_token;
        req.session.refreshToken = tokens.refresh_token;
        req.session.tokenExpiry = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Middleware to check token expiration
async function refreshTokenMiddleware(req, res, next) {
    try {
        if (!req.session.refreshToken) {
            return res.redirect('/auth/login');
        }

        // Check if token needs refresh
        const tokenNeedsRefresh = () => {
            if (!req.session.tokenExpiry) return true;
            // Refresh if less than 5 minutes remaining
            return Date.now() > (req.session.tokenExpiry - 300000);
        };

        if (tokenNeedsRefresh()) {
            console.log('Refreshing token...');
            const tokens = await kickAuth.refreshToken(req.session.refreshToken);
            
            // Update tokens in session
            req.session.accessToken = tokens.access_token;
            req.session.refreshToken = tokens.refresh_token;
            req.session.tokenExpiry = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;
        }
        
        next();
    } catch (error) {
        console.error('Token refresh error:', error);
        // If refresh fails, redirect to login
        req.session.destroy(() => {
            res.redirect('/auth/login');
        });
    }
}

// Protected route example
app.get('/dashboard', refreshTokenMiddleware, (req, res) => {
    res.send(`
        <h1>Kick Dashboard</h1>
        <p>You are authenticated!</p>
        <a href="/auth/logout">Logout</a>
    `);
});

// Logout route
app.get('/auth/logout', async (req, res) => {
    try {
        // Revoke token if it exists
        if (req.session.accessToken) {
            await kickAuth.revokeToken(req.session.accessToken);
        }
        
        // Clear session
        req.session.destroy(() => {
            res.redirect('/');
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).send('Logout failed');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});