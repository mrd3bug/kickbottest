const fs = require('fs');
const path = require('path');

class TokenManager {
    constructor() {
        this.tokenFilePath = path.join(__dirname, 'tokens.json');
        this.tokens = this.loadTokens();
    }

    loadTokens() {
        if (fs.existsSync(this.tokenFilePath)) {
            const data = fs.readFileSync(this.tokenFilePath);
            return JSON.parse(data);
        }
        return {};
    }

    saveTokens() {
        fs.writeFileSync(this.tokenFilePath, JSON.stringify(this.tokens, null, 2));
    }

    getAccessToken() {
        return this.tokens.accessToken;
    }

    setAccessToken(token) {
        this.tokens.accessToken = token;
        this.saveTokens();
    }

    getRefreshToken() {
        return this.tokens.refreshToken;
    }

    setRefreshToken(token) {
        this.tokens.refreshToken = token;
        this.saveTokens();
    }

    refreshTokens(newAccessToken, newRefreshToken) {
        this.setAccessToken(newAccessToken);
        this.setRefreshToken(newRefreshToken);
    }

    revokeTokens() {
        this.tokens = {};
        this.saveTokens();
    }
}

module.exports = new TokenManager();