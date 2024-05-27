const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const dbPath = path.resolve(__dirname, 'database', 'mydatabase.sqlite');

// 創建 SQLite 資料庫連接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// 設置靜態文件目錄
app.use(express.static('public'));
app.use(express.json()); // 用於解析 JSON 請求體

// 處理根路徑請求
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// 處理 POST 請求：新增股票數據
app.post('/api/stock_data', (req, res) => {
    const { target, date, closingPrice } = req.body;

    const sql = `INSERT INTO stock_data (target, date, closing_price) VALUES (?, ?, ?)`;
    db.run(sql, [target, date, closingPrice], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({
                message: 'success',
                data: { id: this.lastID, target, date, closingPrice }
            });
        }
    });
});

// 處理 GET 請求：獲取前100筆股票數據
app.get('/api/stock_data', (req, res) => {
    const sql = `SELECT * FROM stock_data ORDER BY id DESC LIMIT 100`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
