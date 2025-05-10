const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// 初始化表
async function initDB() {
    try {
        const client = await pool.connect();

        // 创建友链表
        await client.query(`
            CREATE TABLE IF NOT EXISTS friends (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                link TEXT NOT NULL,
                avatar TEXT NOT NULL,
                descr TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 创建用户表
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Tables created successfully');
        client.release();
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initDB();

module.exports = pool;