const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');

const verifyToken = promisify(jwt.verify);

const authenticate = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = await verifyToken(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

const checkAccessToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No access token provided' });
    }

    // Additional logic to check if the access token is valid can be added here

    next();
};

module.exports = {
    authenticate,
    checkAccessToken,
};