const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

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

app.get('/stockmanage', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'StockManage.html'));
});

// 檢查今天的資料是否已經更新
function isDataUpdatedToday(callback) {
    const today = new Date().toISOString().split('T')[0];
    const sql = `SELECT COUNT(*) as count FROM stock_data WHERE date = ?`;
    db.get(sql, [today], (err, row) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, row.count > 0);
        }
    });
}

// 檢查是否有缺漏數據
function hasMissingData(callback) {
    const sql = `
        SELECT s.symbol
        FROM stocks s
        LEFT JOIN stock_data sd ON s.symbol = sd.target AND sd.date = ?
        WHERE sd.id IS NULL
    `;
    const today = new Date().toISOString().split('T')[0];
    db.all(sql, [today], (err, rows) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, rows.length > 0);
        }
    });
}

// 自動抓取股票收盤價
async function fetchAndStoreStockData(callback) {
    try {
        const response = await axios.get('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_AVG_ALL');
        const stockData = response.data;

        db.serialize(() => {
            const stmt = db.prepare(`INSERT INTO stock_data (target, date, closing_price, name) VALUES (?, ?, ?, ?)`);
            const date = new Date().toISOString().split('T')[0]; // 使用今天的日期
            stockData.forEach(stock => {
                if (stock.Code && stock.ClosingPrice && stock.Name) {
                    stmt.run(stock.Code, date, stock.ClosingPrice, stock.Name, (err) => {
                        if (err) {
                            console.error('Error inserting data:', err);
                        }
                    });
                } else {
                    console.error('Invalid stock data:', stock);
                }
            });
            stmt.finalize(callback);
        });
    } catch (error) {
        callback(error);
    }
}

// 處理手動更新請求
app.get('/api/manual_update', (req, res) => {
    isDataUpdatedToday((err, isUpdated) => {
        if (err) {
            res.status(500).json({ message: 'Error checking update status' });
            return;
        }
        if (isUpdated) {
            hasMissingData((err, hasMissing) => {
                if (err) {
                    res.status(500).json({ message: 'Error checking missing data' });
                    return;
                }
                if (hasMissing) {
                    fetchAndStoreStockData((error) => {
                        if (error) {
                            res.status(500).json({ message: 'Error updating stock data' });
                        } else {
                            res.json({ message: '資料已更新' });
                        }
                    });
                } else {
                    res.json({ message: '今天已更新' });
                }
            });
        } else {
            fetchAndStoreStockData((error) => {
                if (error) {
                    res.status(500).json({ message: 'Error updating stock data' });
                } else {
                    res.json({ message: '資料已更新' });
                }
            });
        }
    });
});

// 每天定時抓取數據
setInterval(fetchAndStoreStockData, 24 * 60 * 60 * 1000); // 每24小時抓取一次

// 處理 GET 請求：獲取股票代號管理中的股票收盤價數據
app.get('/api/stock_data', (req, res) => {
    const sql = `
        SELECT sd.target, sd.name, sd.date, sd.closing_price 
        FROM stock_data sd
        JOIN stocks s ON sd.target = s.symbol
        ORDER BY sd.date DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// 處理 POST 請求：新增股票代號
app.post('/api/stocks', (req, res) => {
    const { symbol, description } = req.body;
    const sql = `INSERT INTO stocks (symbol, description) VALUES (?, ?)`;
    db.run(sql, [symbol, description], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Stock symbol added', id: this.lastID });
    });
});

// 處理 GET 請求：獲取所有股票代號
app.get('/api/stocks', (req, res) => {
    const sql = `SELECT * FROM stocks`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 處理 DELETE 請求：刪除股票代號
app.delete('/api/stocks/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM stocks WHERE id = ?`;
    db.run(sql, id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Stock symbol deleted' });
    });
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
