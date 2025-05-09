const jwt = require('jsonwebtoken');
require('dotenv').config();

// 验证 JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: '无效的认证令牌' });
        }
        req.user = user;
        next();
    });
};

// 检查是否启用注册功能
const checkRegistrationEnabled = (req, res, next) => {
    if (process.env.ENABLE_REGISTRATION !== 'true') {
        return res.status(403).json({ message: '注册功能已关闭' });
    }
    next();
};

module.exports = {
    authenticateToken,
    checkRegistrationEnabled
}; 