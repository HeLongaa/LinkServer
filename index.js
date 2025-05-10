const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const friendsRouter = require('./routes/friends');
const authRouter = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');
const pool = require('./db/init');

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/api/auth', authRouter);

// 友链路由
// 不需要认证的路由
app.get('/api/friends/adapted', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT name, link, avatar, descr FROM friends ORDER BY created_at DESC'
        );
        client.release();
        res.send(result.rows);
    } catch (err) {
        console.error('获取友链列表错误:', err);
        res.status(500).send(err.message);
    }
});

// 需要认证的路由
app.use('/api/friends', authenticateToken, friendsRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: err.message
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});