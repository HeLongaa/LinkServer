const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/init');
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
        const client = await pool.connect();

        // 检查邮箱是否已存在
        const userCheck = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userCheck.rows.length > 0) {
            client.release();
            return res.status(400).json({ message: '该邮箱已被注册' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const result = await client.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
            [email, hashedPassword]
        );

        // 生成 JWT
        const token = jwt.sign(
            { userId: result.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        client.release();
        res.status(201).json({
            message: '注册成功',
            token: token
        });
    } catch (err) {
        console.error('注册错误:', err);
        return res.status(500).json({ message: '服务器错误' });
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
        const client = await pool.connect();

        // 查找用户
        const result = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            client.release();
            return res.status(401).json({ message: '邮箱或密码错误' });
        }

        const user = result.rows[0];

        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            client.release();
            return res.status(401).json({ message: '邮箱或密码错误' });
        }

        // 生成 JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        client.release();
        res.json({
            message: '登录成功',
            token: token
        });
    } catch (err) {
        console.error('登录错误:', err);
        return res.status(500).json({ message: '服务器错误' });
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