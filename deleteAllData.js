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

        // 开始删除数据的事务
        db.serialize(() => {
            db.run('DELETE FROM stock_data', (err) => {
                if (err) {
                    console.error('Error deleting data from "stock_data"', err);
                } else {
                    console.log('All data deleted from "stock_data"');
                }
            });

            db.run('DELETE FROM stocks', (err) => {
                if (err) {
                    console.error('Error deleting data from "stocks"', err);
                } else {
                    console.log('All data deleted from "stocks"');
                }
            });
        });

        // 关闭数据库连接
        db.close((err) => {
            if (err) {
                console.error('Error closing database', err);
            } else {
                console.log('Database connection closed');
            }
        });
    }
});
