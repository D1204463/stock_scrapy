const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.resolve(__dirname, 'database', 'mydatabase.sqlite');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to SQLite database');

        // 创建新的股票代號表
        db.run(`CREATE TABLE IF NOT EXISTS stocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL UNIQUE,
            description TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table', err);
            } else {
                console.log('Table "stocks" created successfully');
            }

            // 关闭数据库连接
            db.close((err) => {
                if (err) {
                    console.error('Error closing database', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        });
    }
});
