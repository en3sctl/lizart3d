const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Block direct access to .html files
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        return res.status(404).send('Not Found');
    }
    next();
});

// Serve static files (CSS, JS, images, fonts)
app.use(express.static(path.join(__dirname)));

// Anasayfa - Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Alternatif rotalar
app.get('/Anasayfa', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/anasayfa', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`LizArt3D Anasayfa running at http://${HOST}:${PORT}`);
});
