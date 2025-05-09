const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/init');
const { checkRegistrationEnabled, authenticateToken } = require('../middleware/auth');
require('dotenv').config();

// 注册
router.post('/register', checkRegistrationEnabled, async (req, res) => {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
        return res.status(400).json({ message: '邮箱和密码为必填项' });
    }

    // 检查邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '邮箱格式不正确' });
    }

    // 检查密码长度
    if (password.length < 6) {
        return res.status(400).json({ message: '密码长度至少为6位' });
    }

    try {
        // 检查邮箱是否已存在
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: '服务器错误' });
            }
            if (user) {
                return res.status(400).json({ message: '该邮箱已被注册' });
            }

            // 加密密码
            const hashedPassword = await bcrypt.hash(password, 10);

            // 创建用户
            db.run('INSERT INTO users (email, password) VALUES (?, ?)', 
                [email, hashedPassword], 
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: '注册失败' });
                    }

                    // 生成 JWT
                    const token = jwt.sign(
                        { id: this.lastID, email },
                        process.env.JWT_SECRET,
                        { expiresIn: process.env.JWT_EXPIRES_IN }
                    );

                    res.status(201).json({
                        message: '注册成功',
                        token
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 登录
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
        return res.status(400).json({ message: '邮箱和密码为必填项' });
    }

    try {
        // 查找用户
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: '服务器错误' });
            }
            if (!user) {
                return res.status(401).json({ message: '邮箱或密码错误' });
            }

            // 验证密码
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: '邮箱或密码错误' });
            }

            // 生成 JWT
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.json({
                message: '登录成功',
                token
            });
        });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取当前用户信息
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: {
            id: req.user.id,
            email: req.user.email
        }
    });
});

module.exports = router; 