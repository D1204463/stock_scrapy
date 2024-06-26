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

        // 创建新的表格或添加新列到现有表格
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS stock_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target TEXT NOT NULL,
                date TEXT NOT NULL,
                closing_price REAL NOT NULL
            )`, (err) => {
                if (err) {
                    console.error('Error creating table', err);
                } else {
                    console.log('Table "stock_data" created successfully or already exists');

                    // 添加新列到现有表格
                    db.run(`ALTER TABLE stock_data ADD COLUMN name TEXT`, (err) => {
                        if (err && err.message.indexOf("duplicate column name") === -1) {
                            console.error('Error adding new column', err);
                        } else {
                            console.log('Column "name" added successfully or already exists');
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
        });
    }
});
