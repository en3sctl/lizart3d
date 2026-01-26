const express = require('express');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'DefaultKey12345678901234567890!!';

// ============ RATE LIMITING ============

// Genel rate limiter - Tüm istekler için
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına 15 dakikada max 100 istek
    message: { error: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// API rate limiter - API endpoint'leri için daha sıkı
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 dakika
    max: 30, // IP başına dakikada max 30 API isteği
    message: { error: 'API istek limiti aşıldı. Lütfen biraz bekleyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter - Giriş denemeleri için çok sıkı
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 5, // IP başına 15 dakikada max 5 giriş denemesi
    message: { error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Başarılı girişler sayılmaz
});

// Genel limiter'ı uygula
app.use(generalLimiter);

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Encryption functions
function encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    try {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return encryptedText; // Return original if decryption fails
    }
}

// Block direct access to .html files
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        return res.status(404).send('Not Found');
    }
    next();
});

// Serve static files (CSS, JS, images, fonts)
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// API endpoint to encrypt data
app.post('/api/encrypt', apiLimiter, (req, res) => {
    const { text } = req.body;
    res.json({ encrypted: encrypt(text) });
});

// API endpoint to decrypt data
app.post('/api/decrypt', apiLimiter, (req, res) => {
    const { text } = req.body;
    res.json({ decrypted: decrypt(text) });
});

// API endpoint to verify admin password
app.post('/api/verify-admin', authLimiter, (req, res) => {
    const { password } = req.body;
    
    if (password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// API endpoint to get base URL and Firebase config
app.get('/api/config', (req, res) => {
    res.json({
        baseUrl: process.env.BASE_URL || `http://${HOST}:${PORT}`,
        firebase: {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        }
    });
});

// Admin panel - secret URL from .env
const ADMIN_PATH = process.env.ADMIN_PATH || 'admin';
app.get(`/${ADMIN_PATH}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Block /admin if using secret path
app.get('/admin', (req, res) => {
    if (ADMIN_PATH !== 'admin') {
        return res.status(404).send('Not Found');
    }
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// QR sayfası - Ana sayfa
app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ana sayfa QR'a yönlendirsin
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`QR Management System running at http://${HOST}:${PORT}`);
    console.log(`Admin panel: http://${HOST}:${PORT}/${ADMIN_PATH}`);
});
