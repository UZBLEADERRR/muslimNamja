const jwt = require('jsonwebtoken');

function authMiddleware(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

            req.user = decoded; // { userId, role }

            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    };
}

module.exports = authMiddleware;
