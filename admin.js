// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCjiq6OzT1YapcTd1bonGNmF_4EgYlDSOY",
    authDomain: "qr-phone-f52a5.firebaseapp.com",
    databaseURL: "https://qr-phone-f52a5-default-rtdb.firebaseio.com",
    projectId: "qr-phone-f52a5",
    storageBucket: "qr-phone-f52a5.firebasestorage.app",
    messagingSenderId: "794998676684",
    appId: "1:794998676684:web:9be8086c5fbc372ece7669",
    measurementId: "G-XCCRJNY52G"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Decryption helper function (calls server API)
async function decryptData(text) {
    if (!text) return '';
    try {
        const response = await fetch('/api/decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        return data.decrypted;
    } catch (e) {
        console.error('Decryption error:', e);
        return text;
    }
}

// Base URL for QR codes (will be loaded from server)
let BASE_URL = '';

// Load config from server
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        BASE_URL = `${config.baseUrl}/qr`;
    } catch (error) {
        console.error('Config yüklenemedi:', error);
        BASE_URL = `${window.location.origin}/qr`;
    }
}

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const adminPassword = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const qrName = document.getElementById('qrName');
const createQrBtn = document.getElementById('createQrBtn');
const newQrInfo = document.getElementById('newQrInfo');
const newSecurityCode = document.getElementById('newSecurityCode');
const newQrLink = document.getElementById('newQrLink');
const qrCodeImage = document.getElementById('qrCodeImage');
const qrList = document.getElementById('qrList');

// Check if already logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showAdminPanel();
    }
}

// Login - verify password with server
async function login() {
    const password = adminPassword.value;
    
    try {
        const response = await fetch('/api/verify-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            loginError.classList.add('hidden');
            showAdminPanel();
        } else {
            loginError.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Login hatasi:', error);
        loginError.classList.remove('hidden');
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    adminPanel.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    adminPassword.value = '';
}

// Show admin panel
function showAdminPanel() {
    loginScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    loadQrList();
}

// Generate random ID (8 characters for URL - short)
function generateQrId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Generate 12-digit security code
function generateSecurityCode() {
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

// Get all existing security codes from database
async function getExistingSecurityCodes() {
    try {
        const snapshot = await db.ref('qrcodes').once('value');
        const qrcodes = snapshot.val();
        if (!qrcodes) return [];
        return Object.values(qrcodes).map(qr => qr.securityCode).filter(code => code);
    } catch (error) {
        return [];
    }
}

// Generate unique security code
async function generateUniqueSecurityCode() {
    const existingCodes = await getExistingSecurityCodes();
    let code = generateSecurityCode();
    let attempts = 0;
    const maxAttempts = 100;
    
    while (existingCodes.includes(code) && attempts < maxAttempts) {
        code = generateSecurityCode();
        attempts++;
    }
    
    return code;
}

// Simple hash function (works without HTTPS)
function hashSecurityCode(code) {
    const str = code + 'qr_salt_2024';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    // Convert to positive hex string
    const positiveHash = Math.abs(hash);
    return positiveHash.toString(16).padStart(16, '0') + 
           str.split('').reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).padStart(8, '0');
}

// Create new QR code
async function createQrCode() {
    const name = qrName.value.trim() || 'Isimsiz QR';
    const qrId = generateQrId();
    const securityCode = await generateUniqueSecurityCode();
    const securityCodeHash = hashSecurityCode(securityCode);
    
    const qrData = {
        name: name,
        securityCode: securityCode,
        securityCodeHash: securityCodeHash,
        phone: '',
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    try {
        await db.ref(`qrcodes/${qrId}`).set(qrData);
        
        const qrLink = `${BASE_URL}?id=${qrId}`;
        
        // Show new QR info
        newSecurityCode.textContent = securityCode;
        newQrLink.textContent = qrLink;
        newQrInfo.classList.remove('hidden');
        
        // Generate QR code image as PNG
        qrCodeImage.innerHTML = '';
        const qr = qrcode(0, 'M');
        qr.addData(qrLink);
        qr.make();
        const imgTag = qr.createImgTag(4, 4);
        qrCodeImage.innerHTML = imgTag;
        qrCodeImage.dataset.qrLink = qrLink;
        qrCodeImage.dataset.name = name;
        
        // Clear name input
        qrName.value = '';
        
        // Refresh list
        loadQrList();
    } catch (error) {
        console.error('Error creating QR:', error);
        alert('QR oluşturulurken hata oluştu!');
    }
}

// Load QR list
async function loadQrList() {
    try {
        const snapshot = await db.ref('qrcodes').once('value');
        const qrcodes = snapshot.val();
        
        if (!qrcodes) {
            qrList.innerHTML = '<p class="loading">Henüz QR kod yok.</p>';
            return;
        }
        
        let html = '';
        const entries = Object.entries(qrcodes).sort((a, b) => b[1].createdAt - a[1].createdAt);
        
        for (const [id, data] of entries) {
            // Decrypt sensitive data for display
            const decryptedPhone = data.phone ? await decryptData(data.phone) : '';
            const decryptedName = data.ownerName ? await decryptData(data.ownerName) : '';
            
            const statusClass = !decryptedPhone ? 'pending' : (data.active ? 'active' : 'inactive');
            const statusText = !decryptedPhone ? 'Bekliyor' : (data.active ? 'Aktif' : 'Deaktif');
            const createdDate = new Date(data.createdAt).toLocaleDateString('tr-TR');
            const qrLink = `${BASE_URL}?id=${id}`;
            
            // Mask security code: show first 4 and last 2, hide middle
            const securityCode = data.securityCode || '';
            const maskedSecurityCode = securityCode.length >= 12 
                ? securityCode.slice(0, 4) + '****' + securityCode.slice(-2) 
                : securityCode;
            
            // Mask phone number: show last 4 digits only
            const maskedPhone = decryptedPhone.length > 4 
                ? '***' + decryptedPhone.slice(-4) 
                : (decryptedPhone || 'Kayıtlı değil');
            
            // Mask owner name: show first letter + ***
            const maskedName = decryptedName.length > 0 
                ? decryptedName.charAt(0) + '***' 
                : '';
            
            html += `
                <div class="qr-item" data-id="${id}">
                    <div class="qr-item-header">
                        <span class="qr-item-name">${data.name}</span>
                        <span class="qr-item-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="qr-item-details">
                        <p>🔑 Güvenlik Kodu: <strong>${maskedSecurityCode || 'Bilinmiyor'}</strong></p>
                        <p>📱 Telefon: ${maskedPhone}</p>
                        ${maskedName ? `<p>👤 İsim: ${maskedName}</p>` : ''}
                        <p>📅 Oluşturulma: ${createdDate}</p>
                        <p>🔗 <a href="${qrLink}" target="_blank">Link</a></p>
                    </div>
                    <div class="qr-item-actions">
                        <button onclick="showQrCode('${id}')">QR Göster</button>
                        <button onclick="copyLink('${id}')">Link Kopyala</button>
                        <button onclick="resetSecurityCode('${id}')" title="Yeni güvenlik kodu oluştur">🔄 Kod Sıfırla</button>
                        <button class="delete" onclick="deleteQr('${id}')">Sil</button>
                    </div>
                </div>
            `;
        }
        
        qrList.innerHTML = html;
    } catch (error) {
        console.error('Error loading QR list:', error);
        qrList.innerHTML = '<p class="loading">Yüklenirken hata oluştu.</p>';
    }
}

// Show QR code popup
function showQrCode(id) {
    const qrLink = `${BASE_URL}?id=${id}`;
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1000;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background:#fff;padding:30px;border-radius:12px;text-align:center;';
    
    const qrDiv = document.createElement('div');
    content.appendChild(qrDiv);
    
    // Generate PNG QR code using canvas
    const qr = qrcode(0, 'M');
    qr.addData(qrLink);
    qr.make();
    
    const cellSize = 10;
    const margin = 4;
    const moduleCount = qr.getModuleCount();
    const size = moduleCount * cellSize + margin * 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Draw QR code
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
                ctx.fillRect(col * cellSize + margin, row * cellSize + margin, cellSize, cellSize);
            }
        }
    }
    
    // Display image
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.maxWidth = '250px';
    qrDiv.appendChild(img);
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '📥 İndir (PNG)';
    downloadBtn.className = 'btn primary';
    downloadBtn.style.marginTop = '15px';
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.download = `qr-kod-${id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    content.appendChild(downloadBtn);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Kapat';
    closeBtn.className = 'btn secondary';
    closeBtn.style.marginTop = '10px';
    closeBtn.onclick = () => modal.remove();
    content.appendChild(closeBtn);
    
    modal.appendChild(content);
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

// Download QR as PNG
function downloadQrPng() {
    const qrLink = qrCodeImage.dataset.qrLink;
    const name = qrCodeImage.dataset.name || 'qr-kod';
    
    if (!qrLink) {
        alert('QR kod bulunamadı!');
        return;
    }
    
    const qr = qrcode(0, 'M');
    qr.addData(qrLink);
    qr.make();
    
    const cellSize = 10;
    const margin = 4;
    const moduleCount = qr.getModuleCount();
    const size = moduleCount * cellSize + margin * 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
                ctx.fillRect(col * cellSize + margin, row * cellSize + margin, cellSize, cellSize);
            }
        }
    }
    
    const link = document.createElement('a');
    link.download = `${name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Fallback copy function for HTTP
function copyToClipboard(text) {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    
    // Fallback for HTTP
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    } finally {
        document.body.removeChild(textArea);
    }
}

// Copy security code
function copySecurityCode(code) {
    if (!code) {
        alert('Güvenlik kodu bulunamadı!');
        return;
    }
    copyToClipboard(code).then(() => {
        alert('Güvenlik kodu kopyalandı!');
    }).catch(() => {
        prompt('Kodu manuel kopyalayın:', code);
    });
}

// Copy link
function copyLink(id) {
    const qrLink = `${BASE_URL}?id=${id}`;
    copyToClipboard(qrLink).then(() => {
        alert('Link kopyalandı!');
    }).catch(() => {
        prompt('Linki manuel kopyalayın:', qrLink);
    });
}

// Reset security code
async function resetSecurityCode(id) {
    if (!confirm('Guvenlik kodu sifirlanacak. Yeni kodu not almayi unutmayin! Devam etmek istiyor musunuz?')) {
        return;
    }
    
    const newCode = await generateUniqueSecurityCode();
    const newHash = hashSecurityCode(newCode);
    
    try {
        await db.ref(`qrcodes/${id}`).update({
            securityCode: newCode,
            securityCodeHash: newHash,
            updatedAt: Date.now()
        });
        
        // Mask security code for display: show first 4 and last 2
        const maskedCode = newCode.slice(0, 4) + '****' + newCode.slice(-2);
        alert(`Yeni Güvenlik Kodu: ${maskedCode}\n\nTam kodu almak için "Kodu Kopyala" butonunu kullanın!`);
        loadQrList();
    } catch (error) {
        alert('Hata oluştu!');
    }
}

// Delete QR
async function deleteQr(id) {
    if (!confirm('Bu QR kodu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        await db.ref(`qrcodes/${id}`).remove();
        loadQrList();
    } catch (error) {
        alert('Silme hatası!');
    }
}

// Copy buttons - with fallback for HTTP
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const text = document.getElementById(targetId).textContent;
        
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = '✓';
                setTimeout(() => btn.textContent = '📋', 2000);
            }).catch(() => {
                fallbackCopy(text, btn);
            });
        } else {
            fallbackCopy(text, btn);
        }
    });
});

// Fallback copy function for HTTP
function fallbackCopy(text, btn) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = '📋', 2000);
    } catch (err) {
        alert('Kopyalama başarısız!');
    }
    document.body.removeChild(textarea);
}

// Event Listeners
loginBtn.addEventListener('click', login);
adminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});
logoutBtn.addEventListener('click', logout);
createQrBtn.addEventListener('click', createQrCode);

// Download QR button
const downloadQrBtn = document.getElementById('downloadQrBtn');
if (downloadQrBtn) {
    downloadQrBtn.addEventListener('click', downloadQrPng);
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    checkAuth();
});
