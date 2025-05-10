const express = require('express');
const router = express.Router();
const pool = require('../db/init');

// 获取固定格式的友链列表（不需要认证）
router.get('/adapted', async (req, res) => {
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

// 添加友链
router.post('/add', async (req, res) => {
    const { name, link, avatar, descr } = req.body;

    // 验证必填字段
    if (!name || !link || !avatar) {
        return res.status(400).json({
            success: false,
            message: '名称、链接和头像为必填项'
        });
    }

    try {
        const client = await pool.connect();

        // 检查链接是否已存在
        const existingFriend = await client.query(
            'SELECT id FROM friends WHERE link = $1',
            [link]
        );

        if (existingFriend.rows.length > 0) {
            client.release();
            return res.status(400).json({
                success: false,
                message: '该链接已存在，请勿重复添加'
            });
        }

        // 添加新友链
        const result = await client.query(
            'INSERT INTO friends (name, link, avatar, descr) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, link, avatar, descr]
        );

        client.release();
        res.json({
            success: true,
            message: '添加友链成功',
            data: {
                id: result.rows[0].id,
                name,
                link,
                avatar,
                descr
            }
        });
    } catch (err) {
        console.error('添加友链错误:', err);
        res.status(500).json({
            success: false,
            message: '添加友链失败',
            error: err.message
        });
    }
});

// 获取友链列表（支持分页和搜索）
router.get('/list', async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        const client = await pool.connect();
        let sql = 'SELECT * FROM friends';
        let countSql = 'SELECT COUNT(*) as total FROM friends';
        let params = [];
        let countParams = [];

        if (search) {
            sql += ' WHERE name ILIKE $1 OR descr ILIKE $1';
            countSql += ' WHERE name ILIKE $1 OR descr ILIKE $1';
            params.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), parseInt(offset));

        // 获取总数
        const countResult = await client.query(countSql, countParams);
        // 获取分页数据
        const result = await client.query(sql, params);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        client.release();
        res.json({
            success: true,
            data: {
                list: result.rows,
                total: total
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: totalPages,
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        console.error('获取友链列表错误:', err);
        res.status(500).json({
            success: false,
            message: '获取友链列表失败',
            error: err.message
        });
    }
});

// 获取单个友链信息
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM friends WHERE id = $1',
            [id]
        );
        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '友链不存在'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('获取友链信息错误:', err);
        res.status(500).json({
            success: false,
            message: '获取友链信息失败',
            error: err.message
        });
    }
});

// 删除友链
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const client = await pool.connect();
        const result = await client.query(
            'DELETE FROM friends WHERE id = $1 RETURNING id',
            [id]
        );
        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '友链不存在'
            });
        }

        res.json({
            success: true,
            message: '删除友链成功'
        });
    } catch (err) {
        console.error('删除友链错误:', err);
        res.status(500).json({
            success: false,
            message: '删除友链失败',
            error: err.message
        });
    }
});

// 更新友链
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, link, avatar, descr } = req.body;

    if (!name || !link || !avatar) {
        return res.status(400).json({
            success: false,
            message: '名称、链接和头像为必填项'
        });
    }

    try {
        const client = await pool.connect();

        // 检查链接是否已存在（排除当前正在编辑的友链）
        const existingFriend = await client.query(
            'SELECT id FROM friends WHERE link = $1 AND id != $2',
            [link, id]
        );

        if (existingFriend.rows.length > 0) {
            client.release();
            return res.status(400).json({
                success: false,
                message: '该链接已存在，请使用其他链接'
            });
        }

        const result = await client.query(
            'UPDATE friends SET name = $1, link = $2, avatar = $3, descr = $4 WHERE id = $5 RETURNING id',
            [name, link, avatar, descr, id]
        );

        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '友链不存在'
            });
        }

        res.json({
            success: true,
            message: '更新友链成功',
            data: {
                id,
                name,
                link,
                avatar,
                descr
            }
        });
    } catch (err) {
        console.error('更新友链错误:', err);
        res.status(500).json({
            success: false,
            message: '更新友链失败',
            error: err.message
        });
    }
});

module.exports = router;