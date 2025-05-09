const express = require('express');
const router = express.Router();
const db = require('../db/init');

// 获取固定格式的友链列表（不需要认证）
router.get('/adapted', (req, res) => {
    const sql = `SELECT name, link, avatar, descr FROM friends ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.send(rows);
    });
});

// 添加友链
router.post('/add', (req, res) => {
    const { name, link, avatar, descr } = req.body;

    // 验证必填字段
    if (!name || !link || !avatar) {
        return res.status(400).json({
            success: false,
            message: '名称、链接和头像为必填项'
        });
    }

    // 检查链接是否已存在
    db.get('SELECT id FROM friends WHERE link = ?', [link], (err, existingFriend) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '检查友链失败',
                error: err.message
            });
        }

        if (existingFriend) {
            return res.status(400).json({
                success: false,
                message: '该链接已存在，请勿重复添加'
            });
        }

        // 添加新友链
        const sql = `INSERT INTO friends (name, link, avatar, descr) VALUES (?, ?, ?, ?)`;
        db.run(sql, [name, link, avatar, descr], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: '添加友链失败',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: '添加友链成功',
                data: {
                    id: this.lastID,
                    name,
                    link,
                    avatar,
                    descr
                }
            });
        });
    });
});

// 获取友链列表（支持分页和搜索）
router.get('/list', (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `SELECT * FROM friends`;
    let countSql = `SELECT COUNT(*) as total FROM friends`;
    const params = [];
    
    if (search) {
        sql += ` WHERE name LIKE ? OR descr LIKE ?`;
        countSql += ` WHERE name LIKE ? OR descr LIKE ?`;
        params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    // 获取总数
    db.get(countSql, search ? [`%${search}%`, `%${search}%`] : [], (err, countResult) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '获取友链列表失败',
                error: err.message
            });
        }
        
        // 获取分页数据
        db.all(sql, params, (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: '获取友链列表失败',
                    error: err.message
                });
            }

            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);

            res.json({
                success: true,
                data: rows,
                pagination: {
                    total: total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: totalPages
                }
            });
        });
    });
});

// 获取单个友链信息
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM friends WHERE id = ?', [id], (err, friend) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '获取友链信息失败',
                error: err.message
            });
        }
        
        if (!friend) {
            return res.status(404).json({
                success: false,
                message: '友链不存在'
            });
        }
        
        res.json({
            success: true,
            data: friend
        });
    });
});

// 删除友链
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM friends WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '删除友链失败',
                error: err.message
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '友链不存在'
            });
        }
        
        res.json({
            success: true,
            message: '删除友链成功'
        });
    });
});

// 更新友链
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, link, avatar, descr } = req.body;
    
    if (!name || !link || !avatar) {
        return res.status(400).json({
            success: false,
            message: '名称、链接和头像为必填项'
        });
    }

    // 检查链接是否已存在（排除当前正在编辑的友链）
    db.get('SELECT id FROM friends WHERE link = ? AND id != ?', [link, id], (err, existingFriend) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '检查友链失败',
                error: err.message
            });
        }

        if (existingFriend) {
            return res.status(400).json({
                success: false,
                message: '该链接已存在，请使用其他链接'
            });
        }
    
        const sql = `UPDATE friends SET name = ?, link = ?, avatar = ?, descr = ? WHERE id = ?`;
        db.run(sql, [name, link, avatar, descr, id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: '更新友链失败',
                    error: err.message
                });
            }
            
            if (this.changes === 0) {
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
        });
    });
});

module.exports = router; 