const express = require('express');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'DefaultKey12345678901234567890!!';

// ============ EMAIL CONFIGURATION FOR 2FA ============
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Store 2FA codes temporarily (in production, use Redis or database)
const twoFactorCodes = new Map();

// Generate 6-digit 2FA code
function generate2FACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send 2FA code via email
async function send2FAEmail(email, code) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'LizArt3D QR Admin - Doğrulama Kodu',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">🔐 Güvenlik Doğrulaması</h2>
                <p style="font-size: 16px; color: #555;">Admin paneline giriş için doğrulama kodunuz:</p>
                <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #2196F3; margin: 0; letter-spacing: 5px; font-size: 32px;">${code}</h1>
                </div>
                <p style="font-size: 14px; color: #777;">Bu kod 5 dakika içinde geçerliliğini yitirecektir.</p>
                <p style="font-size: 14px; color: #777;">Bu girişi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">LizArt3D QR Management System</p>
            </div>
        `
    };

    return await emailTransporter.sendMail(mailOptions);
}

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
app.post('/api/encrypt', (req, res) => {
    const { text } = req.body;
    res.json({ encrypted: encrypt(text) });
});

// API endpoint to decrypt data
app.post('/api/decrypt', (req, res) => {
    const { text } = req.body;
    res.json({ decrypted: decrypt(text) });
});

// API endpoint to verify admin password
app.post('/api/verify-admin', async (req, res) => {
    const { password } = req.body;
    
    if (password === process.env.ADMIN_PASSWORD) {
        // Password is correct, generate and send 2FA code
        const code = generate2FACode();
        const sessionId = crypto.randomBytes(16).toString('hex');
        
        // Store code with 5 minute expiration
        twoFactorCodes.set(sessionId, {
            code: code,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
            verified: false
        });
        
        try {
            await send2FAEmail('alperennozdemir34@gmail.com', code);
            res.json({ success: true, requiresTwoFactor: true, sessionId: sessionId });
        } catch (error) {
            console.error('Email gönderme hatası:', error);
            res.json({ success: false, error: 'E-posta gönderilemedi' });
        }
    } else {
        res.json({ success: false });
    }
});

// API endpoint to verify 2FA code
app.post('/api/verify-2fa', (req, res) => {
    const { sessionId, code } = req.body;
    
    const session = twoFactorCodes.get(sessionId);
    
    if (!session) {
        return res.json({ success: false, error: 'Geçersiz oturum' });
    }
    
    if (Date.now() > session.expiresAt) {
        twoFactorCodes.delete(sessionId);
        return res.json({ success: false, error: 'Kod süresi doldu' });
    }
    
    if (session.code === code) {
        session.verified = true;
        // Clean up after 1 minute
        setTimeout(() => twoFactorCodes.delete(sessionId), 60000);
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Kod hatalı' });
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
