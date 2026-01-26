// Firebase will be initialized after loading config from server
let db = null;

// Load Firebase config from server and initialize (with cache)
async function initFirebase() {
    try {
        // Check sessionStorage cache first
        const cachedConfig = sessionStorage.getItem('firebaseConfig');
        let firebaseConfig;
        
        if (cachedConfig) {
            firebaseConfig = JSON.parse(cachedConfig);
        } else {
            const response = await fetch('/api/config');
            const config = await response.json();
            firebaseConfig = config.firebase;
            // Cache for this session
            if (firebaseConfig) {
                sessionStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
            }
        }
        
        if (firebaseConfig && firebaseConfig.apiKey) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            return true;
        } else {
            console.error('Firebase config not found');
            return false;
        }
    } catch (error) {
        console.error('Failed to load Firebase config:', error);
        return false;
    }
}

// Encryption helper functions (calls server API)
async function encryptData(text) {
    if (!text) return '';
    try {
        const response = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        return data.encrypted;
    } catch (e) {
        console.error('Encryption error:', e);
        return text;
    }
}

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

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const notFoundScreen = document.getElementById('notFoundScreen');
const deactiveScreen = document.getElementById('deactiveScreen');
const securityCodeScreen = document.getElementById('securityCodeScreen');
const phoneSetupScreen = document.getElementById('phoneSetupScreen');
const redirectScreen = document.getElementById('redirectScreen');

const securityCodeInput = document.getElementById('securityCodeInput');
const verifyCodeBtn = document.getElementById('verifyCodeBtn');
const securityError = document.getElementById('securityError');

const phoneInput = document.getElementById('phoneInput');
const nameInput = document.getElementById('nameInput');
const plateInput = document.getElementById('plateInput');
const noteInput = document.getElementById('noteInput');
const noteCharCount = document.getElementById('noteCharCount');
const activeToggle = document.getElementById('activeToggle');
const statusText = document.getElementById('statusText');
const savePhoneBtn = document.getElementById('savePhoneBtn');
const saveSuccess = document.getElementById('saveSuccess');
const saveError = document.getElementById('saveError');

// Field visibility toggles
const nameVisibleToggle = document.getElementById('nameVisibleToggle');
const nameVisibleText = document.getElementById('nameVisibleText');
const plateVisibleToggle = document.getElementById('plateVisibleToggle');
const plateVisibleText = document.getElementById('plateVisibleText');
const noteVisibleToggle = document.getElementById('noteVisibleToggle');
const noteVisibleText = document.getElementById('noteVisibleText');

// Park Timer Elements
const parkTimerBtn = document.getElementById('parkTimerBtn');
const parkTimerDisplay = document.getElementById('parkTimerDisplay');
const parkTimerValue = document.getElementById('parkTimerValue');
let parkTimerInterval = null;

// Scan History Elements
const scanHistoryList = document.getElementById('scanHistoryList');
const totalScans = document.getElementById('totalScans');

const callLink = document.getElementById('callLink');
const ownerBtn = document.getElementById('ownerBtn');

// Global state
let currentQrId = null;
let currentQrData = null;
let isOwnerMode = false;
let pendingAction = null; // Store pending action after agreement

// Agreement Modal Elements
const agreementModal = document.getElementById('agreementModal');
const agreementCheck = document.getElementById('agreementCheck');
const agreementAcceptBtn = document.getElementById('agreementAcceptBtn');

// Delete Account Modal Elements
const deleteAccountModal = document.getElementById('deleteAccountModal');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const deleteSecurityCodeInput = document.getElementById('deleteSecurityCodeInput');
const deleteError = document.getElementById('deleteError');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Change Security Code Modal Elements
const changeSecurityCodeModal = document.getElementById('changeSecurityCodeModal');
const changeSecurityCodeBtn = document.getElementById('changeSecurityCodeBtn');
const currentSecurityCodeInput = document.getElementById('currentSecurityCodeInput');
const newSecurityCodeInput = document.getElementById('newSecurityCodeInput');
const confirmSecurityCodeInput = document.getElementById('confirmSecurityCodeInput');
const newCodeStatus = document.getElementById('newCodeStatus');
const changeSecurityError = document.getElementById('changeSecurityError');
const cancelChangeSecurityBtn = document.getElementById('cancelChangeSecurityBtn');
const confirmChangeSecurityBtn = document.getElementById('confirmChangeSecurityBtn');

// Check if user has accepted agreement for this QR
function hasAcceptedAgreement(qrId) {
    const accepted = localStorage.getItem(`agreement_${qrId}`);
    return accepted === 'true';
}

// Save agreement acceptance
function saveAgreementAcceptance(qrId) {
    localStorage.setItem(`agreement_${qrId}`, 'true');
}

// Show agreement modal
function showAgreementModal(callback) {
    pendingAction = callback;
    agreementModal.classList.remove('hidden');
    agreementCheck.checked = false;
    agreementAcceptBtn.disabled = true;
}

// Hide agreement modal
function hideAgreementModal() {
    agreementModal.classList.add('hidden');
}

// Show delete account modal
function showDeleteAccountModal() {
    deleteAccountModal.classList.remove('hidden');
    deleteSecurityCodeInput.value = '';
    deleteError.classList.add('hidden');
}

// Hide delete account modal
function hideDeleteAccountModal() {
    deleteAccountModal.classList.add('hidden');
    deleteSecurityCodeInput.value = '';
    deleteError.classList.add('hidden');
}

// Show change security code modal
function showChangeSecurityCodeModal() {
    changeSecurityCodeModal.classList.remove('hidden');
    currentSecurityCodeInput.value = '';
    newSecurityCodeInput.value = '';
    confirmSecurityCodeInput.value = '';
    newCodeStatus.textContent = '';
    newCodeStatus.className = 'code-status';
    changeSecurityError.classList.add('hidden');
}

// Hide change security code modal
function hideChangeSecurityCodeModal() {
    changeSecurityCodeModal.classList.add('hidden');
    currentSecurityCodeInput.value = '';
    newSecurityCodeInput.value = '';
    confirmSecurityCodeInput.value = '';
    newCodeStatus.textContent = '';
    newCodeStatus.className = 'code-status';
    changeSecurityError.classList.add('hidden');
}

// Check if security code already exists in Firebase
async function isSecurityCodeUnique(code) {
    try {
        const snapshot = await db.ref('qrcodes').once('value');
        const qrcodes = snapshot.val();
        if (!qrcodes) return true;
        
        for (const qrId of Object.keys(qrcodes)) {
            const qr = qrcodes[qrId];
            // Skip current QR code
            if (qrId === currentQrId) continue;
            
            // Check against stored security codes (both plain and hashed)
            if (qr.securityCode === code) {
                return false;
            }
            // Also check against hashed version
            const hashedNewCode = hashSecurityCode(code);
            if (qr.securityCodeHash === hashedNewCode) {
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Error checking security code uniqueness:', error);
        return false;
    }
}

// Validate new security code format
function validateSecurityCodeFormat(code) {
    // Must be at least 8 characters
    if (code.length < 8) {
        return { valid: false, message: 'Güvenlik kodu en az 8 karakter olmalıdır.' };
    }
    
    // Maximum 50 characters
    if (code.length > 50) {
        return { valid: false, message: 'Güvenlik kodu en fazla 50 karakter olabilir.' };
    }
    
    // Check for easy-to-guess patterns
    const easyPatterns = [
        'password', '12345678', '123456789', '1234567890', '123456789012',
        'qwerty', 'qwertyui', 'asdfghjk', 'zxcvbnm', 'abcdefgh',
        '11111111', '22222222', '33333333', '00000000', 'aaaaaaaa',
        'password123', 'admin123', 'user1234', 'test1234'
    ];
    
    if (easyPatterns.includes(code.toLowerCase())) {
        return { valid: false, message: 'Tahmin edilmesi kolay bir güvenlik kodu seçtiniz. Lütfen farklı bir kod belirleyin.' };
    }
    
    // Check if all characters are the same
    if (/^(.)\1+$/.test(code)) {
        return { valid: false, message: 'Tüm karakterler aynı olamaz. Lütfen farklı bir kod belirleyin.' };
    }
    
    // Calculate password strength
    let strength = 0;
    if (/[a-z]/.test(code)) strength++; // lowercase
    if (/[A-Z]/.test(code)) strength++; // uppercase
    if (/[0-9]/.test(code)) strength++; // numbers
    if (/[^a-zA-Z0-9]/.test(code)) strength++; // special characters
    
    if (strength < 2) {
        return { valid: false, message: 'Daha güçlü bir şifre için en az 2 farklı karakter türü kullanın (büyük/küçük harf, rakam, özel karakter).' };
    }
    
    return { valid: true, message: '', strength: strength };
}

// Check new security code in real-time
let checkCodeTimeout = null;
async function checkNewSecurityCode() {
    const code = newSecurityCodeInput.value;
    
    // Clear previous timeout
    if (checkCodeTimeout) {
        clearTimeout(checkCodeTimeout);
    }
    
    if (code.length === 0) {
        newCodeStatus.textContent = '';
        newCodeStatus.className = 'code-status';
        return;
    }
    
    if (code.length < 8) {
        newCodeStatus.textContent = `${8 - code.length} karakter daha giriniz`;
        newCodeStatus.className = 'code-status pending';
        return;
    }
    
    // Validate format
    const validation = validateSecurityCodeFormat(code);
    if (!validation.valid) {
        newCodeStatus.textContent = validation.message;
        newCodeStatus.className = 'code-status error';
        return;
    }
    
    // Show checking status
    newCodeStatus.textContent = 'Kontrol ediliyor...';
    newCodeStatus.className = 'code-status pending';
    
    // Check uniqueness with debounce
    checkCodeTimeout = setTimeout(async () => {
        const isUnique = await isSecurityCodeUnique(code);
        
        if (isUnique) {
            // Show strength indicator
            const strengthText = validation.strength === 4 ? 'Çok Güçlü 💪' : 
                                validation.strength === 3 ? 'Güçlü ✓' : 'Kabul Edilebilir';
            newCodeStatus.textContent = `✓ Kullanılabilir - ${strengthText}`;
            newCodeStatus.className = 'code-status success';
        } else {
            newCodeStatus.textContent = '✗ Bu kod zaten kullanılıyor. Farklı bir kod deneyin.';
            newCodeStatus.className = 'code-status error';
        }
    }, 500);
}

// Change security code
async function changeSecurityCode() {
    const currentCode = currentSecurityCodeInput.value;
    const newCode = newSecurityCodeInput.value;
    const confirmCode = confirmSecurityCodeInput.value;
    
    // Validate current code
    if (currentCode.length === 0) {
        changeSecurityError.textContent = 'Mevcut güvenlik kodunu giriniz.';
        changeSecurityError.classList.remove('hidden');
        return;
    }
    
    // Verify current code
    const hashedCurrentCode = hashSecurityCode(currentCode);
    if (hashedCurrentCode !== currentQrData.securityCodeHash) {
        changeSecurityError.textContent = 'Mevcut güvenlik kodu yanlış!';
        changeSecurityError.classList.remove('hidden');
        return;
    }
    
    // Validate new code format
    const validation = validateSecurityCodeFormat(newCode);
    if (!validation.valid) {
        changeSecurityError.textContent = validation.message;
        changeSecurityError.classList.remove('hidden');
        return;
    }
    
    // Check if new codes match
    if (newCode !== confirmCode) {
        changeSecurityError.textContent = 'Yeni güvenlik kodları eşleşmiyor!';
        changeSecurityError.classList.remove('hidden');
        return;
    }
    
    // Check if new code is same as current
    if (currentCode === newCode) {
        changeSecurityError.textContent = 'Yeni güvenlik kodu mevcut kodunuzdan farklı olmalıdır.';
        changeSecurityError.classList.remove('hidden');
        return;
    }
    
    // Check uniqueness
    const isUnique = await isSecurityCodeUnique(newCode);
    if (!isUnique) {
        changeSecurityError.textContent = 'Bu güvenlik kodu sistemde zaten kullanılıyor. Lütfen farklı bir kod belirleyin.';
        changeSecurityError.classList.remove('hidden');
        return;
    }
    
    try {
        // Hash new security code
        const hashedNewCode = hashSecurityCode(newCode);
        
        // Update in Firebase
        await db.ref(`qrcodes/${currentQrId}`).update({
            securityCode: newCode,
            securityCodeHash: hashedNewCode,
            updatedAt: Date.now()
        });
        
        // Update local data
        currentQrData.securityCode = newCode;
        currentQrData.securityCodeHash = hashedNewCode;
        
        // Hide modal and show success
        hideChangeSecurityCodeModal();
        
        alert('Güvenlik kodunuz başarıyla değiştirildi! Yeni kodunuz: ' + newCode + '\n\nBu kodu güvenli bir yerde saklayın.');
        
    } catch (error) {
        console.error('Error changing security code:', error);
        changeSecurityError.textContent = 'Güvenlik kodu değiştirme işlemi başarısız. Tekrar deneyin.';
        changeSecurityError.classList.remove('hidden');
    }
}

// Delete account
async function deleteAccount() {
    const code = deleteSecurityCodeInput.value.trim();
    
    if (code.length !== 12) {
        deleteError.textContent = 'Güvenlik kodu 12 haneli olmalıdır.';
        deleteError.classList.remove('hidden');
        return;
    }
    
    const hashedCode = hashSecurityCode(code);
    
    if (hashedCode !== currentQrData.securityCodeHash) {
        deleteError.textContent = 'Güvenlik kodu yanlış!';
        deleteError.classList.remove('hidden');
        return;
    }
    
    try {
        // Delete from Firebase
        await db.ref(`qrcodes/${currentQrId}`).remove();
        
        // Clear local storage
        localStorage.removeItem(`agreement_${currentQrId}`);
        
        // Hide modal and show success
        hideDeleteAccountModal();
        
        alert('Hesabınız başarıyla silindi. Tüm verileriniz sistemden kaldırıldı.');
        
        // Redirect to not found screen
        showScreen(notFoundScreen);
        
    } catch (error) {
        deleteError.textContent = 'Silme işlemi başarısız. Tekrar deneyin.';
        deleteError.classList.remove('hidden');
    }
}

// Utility functions
function showScreen(screen) {
    [loadingScreen, notFoundScreen, deactiveScreen, securityCodeScreen, phoneSetupScreen, redirectScreen].forEach(s => {
        s.classList.add('hidden');
    });
    screen.classList.remove('hidden');
}

function hideError(element) {
    element.classList.add('hidden');
    element.textContent = '';
}

function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

// Get QR ID from URL
function getQrIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
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

// Initialize app
async function init() {
    // First, initialize Firebase
    const firebaseReady = await initFirebase();
    if (!firebaseReady) {
        console.error('Firebase initialization failed');
        showScreen(notFoundScreen);
        return;
    }
    
    currentQrId = getQrIdFromUrl();
    
    if (!currentQrId) {
        showScreen(notFoundScreen);
        return;
    }
    
    try {
        const snapshot = await db.ref(`qrcodes/${currentQrId}`).once('value');
        currentQrData = snapshot.val();
        
        if (!currentQrData) {
            showScreen(notFoundScreen);
            return;
        }
        
        // Decrypt sensitive data
        if (currentQrData.phone) {
            currentQrData.phone = await decryptData(currentQrData.phone);
        }
        if (currentQrData.ownerName) {
            currentQrData.ownerName = await decryptData(currentQrData.ownerName);
        }
        if (currentQrData.plate) {
            currentQrData.plate = await decryptData(currentQrData.plate);
        }
        if (currentQrData.note) {
            currentQrData.note = await decryptData(currentQrData.note);
        }
        
        // Check if phone is registered
        if (currentQrData.phone && currentQrData.phone.trim() !== '') {
            // Phone is registered
            if (currentQrData.active === false) {
                showScreen(deactiveScreen);
            } else {
                // Show redirect screen for visitors
                showRedirectScreen();
            }
        } else {
            // No phone registered, show security code screen for setup
            showScreen(securityCodeScreen);
        }
    } catch (error) {
        console.error('Firebase error:', error);
        showScreen(notFoundScreen);
    }
}

// Record scan/login event
// type: 'visitor' = ziyaretçi taraması, 'owner' = hesap sahibi girişi
// Returns the scan key for later update
async function recordScan(type = 'visitor') {
    try {
        const scanData = {
            timestamp: Date.now(),
            type: type,
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        // Push to scans array and get the key
        const newScanRef = await db.ref(`qrcodes/${currentQrId}/scans`).push(scanData);
        
        // Update last scan time and increment count (only for visitors)
        if (type === 'visitor') {
            const snapshot = await db.ref(`qrcodes/${currentQrId}/scanCount`).once('value');
            const currentCount = snapshot.val() || 0;
            
            await db.ref(`qrcodes/${currentQrId}`).update({
                lastScan: Date.now(),
                scanCount: currentCount + 1
            });
        }
        
        return newScanRef.key;
    } catch (error) {
        console.log('Scan recording failed:', error);
        return null;
    }
}

// Mevcut ziyaretçi kaydını owner girişine dönüştür
async function convertVisitorToOwner(scanKey) {
    if (!scanKey) return;
    
    try {
        // Önce mevcut kaydın visitor olduğunu doğrula
        const scanSnap = await db.ref(`qrcodes/${currentQrId}/scans/${scanKey}`).once('value');
        const scanData = scanSnap.val();
        
        // Sadece visitor tipinde ise dönüştür
        if (scanData && scanData.type === 'visitor') {
            // Kaydı owner'a dönüştür
            await db.ref(`qrcodes/${currentQrId}/scans/${scanKey}`).update({
                type: 'owner',
                convertedAt: Date.now()
            });
            
            // Ziyaretçi olarak sayılan taramayı düşür (owner girişi tarama sayılmaz)
            const snapshot = await db.ref(`qrcodes/${currentQrId}/scanCount`).once('value');
            const currentCount = snapshot.val() || 0;
            if (currentCount > 0) {
                await db.ref(`qrcodes/${currentQrId}`).update({
                    scanCount: currentCount - 1
                });
            }
        }
    } catch (error) {
        console.log('Scan conversion failed:', error);
    }
}

// Mevcut oturum scan key'i
let currentSessionScanKey = null;

// Show redirect screen and auto-call
async function showRedirectScreen() {
    // Ziyaretçi kaydını oluştur ve key'i sakla
    currentSessionScanKey = await recordScan('visitor');
    
    const phoneNumber = currentQrData.phone.replace(/\s/g, '');
    callLink.href = `tel:${phoneNumber}`;
    
    // WhatsApp link - +90 Türkiye kodu ile yönlendir
    let whatsappNumber = phoneNumber.replace(/[^0-9]/g, '');
    // Eğer numara 0 ile başlıyorsa, 0'ı kaldırıp başına 90 ekle
    if (whatsappNumber.startsWith('0')) {
        whatsappNumber = '90' + whatsappNumber.substring(1);
    } 
    // Eğer numara 90 ile başlamıyorsa başına 90 ekle
    else if (!whatsappNumber.startsWith('90')) {
        whatsappNumber = '90' + whatsappNumber;
    }
    const whatsappLink = document.getElementById('whatsappLink');
    whatsappLink.href = `https://wa.me/${whatsappNumber}`;
    
    // Display owner name (check visibility setting)
    const ownerNameDisplay = document.getElementById('ownerNameDisplay');
    if (currentQrData.ownerName && currentQrData.nameVisible !== false) {
        ownerNameDisplay.textContent = currentQrData.ownerName;
    } else {
        ownerNameDisplay.textContent = 'Araç Sahibi';
    }
    
    // Display plate (check visibility setting)
    const plateDisplay = document.getElementById('plateDisplay');
    const plateText = document.getElementById('plateText');
    if (currentQrData.plate && currentQrData.plateVisible !== false) {
        plateText.textContent = currentQrData.plate;
        plateDisplay.style.display = 'inline-flex';
    } else {
        plateDisplay.style.display = 'none';
    }
    
    // Display note (check visibility setting)
    const noteDisplay = document.getElementById('noteDisplay');
    const noteTextEl = document.getElementById('noteText');
    if (currentQrData.note && currentQrData.note.trim() !== '' && currentQrData.noteVisible !== false) {
        noteTextEl.textContent = currentQrData.note;
        noteDisplay.classList.remove('hidden');
    } else {
        noteDisplay.classList.add('hidden');
    }
    
    // Display park timer for visitors
    const visitorParkTimer = document.getElementById('visitorParkTimer');
    const visitorParkTime = document.getElementById('visitorParkTime');
    if (currentQrData.parkStartTime) {
        const elapsed = Date.now() - currentQrData.parkStartTime;
        visitorParkTime.textContent = formatParkTime(elapsed);
        visitorParkTimer.classList.remove('hidden');
        
        // Update visitor park timer every minute
        setInterval(() => {
            const elapsed = Date.now() - currentQrData.parkStartTime;
            visitorParkTime.textContent = formatParkTime(elapsed);
        }, 60000);
    } else {
        visitorParkTimer.classList.add('hidden');
    }
    
    showScreen(redirectScreen);
    
    // Ask user if they want to call
    const displayName = (currentQrData.ownerName && currentQrData.nameVisible !== false) ? currentQrData.ownerName : 'Araç sahibini';
    setTimeout(() => {
        if (confirm(`${displayName} aramak ister misiniz?`)) {
            window.open(`tel:${phoneNumber}`, '_self');
        }
    }, 500);
}

// Verify security code
async function verifySecurityCode() {
    const code = securityCodeInput.value;
    
    if (code.length === 0) {
        showError(securityError, 'Güvenlik kodunu giriniz.');
        return;
    }
    
    try {
        const hashedCode = hashSecurityCode(code);
        
        if (hashedCode === currentQrData.securityCodeHash) {
            hideError(securityError);
            isOwnerMode = true;
            
            // Mevcut oturumda ziyaretçi kaydı varsa, owner'a dönüştür
            if (currentSessionScanKey) {
                await convertVisitorToOwner(currentSessionScanKey);
                currentSessionScanKey = null;
            } else {
                // Direkt giriş yapıldıysa yeni owner kaydı oluştur
                recordScan('owner');
            }
            
            // Check if this is first time setup (no phone registered)
            const isFirstSetup = !currentQrData.phone || currentQrData.phone.trim() === '';
            
            if (isFirstSetup && !hasAcceptedAgreement(currentQrId)) {
                // Show agreement modal for first time users
                showAgreementModal(() => {
                    saveAgreementAcceptance(currentQrId);
                    showPhoneSetupScreen();
                });
            } else {
                showPhoneSetupScreen();
            }
        } else {
            showError(securityError, 'Güvenlik kodu yanlış!');
        }
    } catch (error) {
        showError(securityError, 'Bir hata oluştu. Tekrar deneyin.');
    }
}

// Show phone setup screen
function showPhoneSetupScreen() {
    if (currentQrData.phone) {
        phoneInput.value = currentQrData.phone;
    }
    if (currentQrData.ownerName) {
        nameInput.value = currentQrData.ownerName;
    }
    if (currentQrData.plate) {
        plateInput.value = currentQrData.plate;
    }
    if (currentQrData.note) {
        noteInput.value = currentQrData.note;
        noteCharCount.textContent = currentQrData.note.length;
    } else {
        noteInput.value = '';
        noteCharCount.textContent = '0';
    }
    
    // Set visibility toggles
    nameVisibleToggle.checked = currentQrData.nameVisible !== false;
    plateVisibleToggle.checked = currentQrData.plateVisible !== false;
    noteVisibleToggle.checked = currentQrData.noteVisible !== false;
    updateVisibilityTexts();
    
    // Set park timer state
    if (currentQrData.parkStartTime) {
        startParkTimerUI();
    } else {
        stopParkTimerUI();
    }
    
    // Tarama geçmişini anlık dinlemeye başla
    startScanHistoryListener();
    
    activeToggle.checked = currentQrData.active !== false;
    updateStatusText();
    showScreen(phoneSetupScreen);
}

// Update status text
function updateStatusText() {
    statusText.textContent = activeToggle.checked ? 'Aktif' : 'Deaktif';
}

// Update visibility texts
function updateVisibilityTexts() {
    nameVisibleText.textContent = nameVisibleToggle.checked ? 'Görünür' : 'Gizli';
    plateVisibleText.textContent = plateVisibleToggle.checked ? 'Görünür' : 'Gizli';
    noteVisibleText.textContent = noteVisibleToggle.checked ? 'Görünür' : 'Gizli';
}

// Park Timer Functions
function formatParkTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}sa ${minutes}dk`;
    }
    return `${minutes}dk`;
}

function updateParkTimerDisplay() {
    if (!currentQrData.parkStartTime) return;
    
    const elapsed = Date.now() - currentQrData.parkStartTime;
    parkTimerValue.textContent = formatParkTime(elapsed);
}

function startParkTimerUI() {
    parkTimerBtn.classList.add('active');
    parkTimerBtn.querySelector('.park-btn-text').textContent = 'Park Durdur';
    parkTimerBtn.querySelector('.park-btn-icon').textContent = '⏹️';
    parkTimerDisplay.classList.remove('hidden');
    
    updateParkTimerDisplay();
    parkTimerInterval = setInterval(updateParkTimerDisplay, 60000); // Update every minute
}

function stopParkTimerUI() {
    parkTimerBtn.classList.remove('active');
    parkTimerBtn.querySelector('.park-btn-text').textContent = 'Park Başlat';
    parkTimerBtn.querySelector('.park-btn-icon').textContent = '🅿️';
    parkTimerDisplay.classList.add('hidden');
    parkTimerValue.textContent = '00:00';
    
    if (parkTimerInterval) {
        clearInterval(parkTimerInterval);
        parkTimerInterval = null;
    }
}

async function toggleParkTimer() {
    if (currentQrData.parkStartTime) {
        // Stop timer
        await db.ref(`qrcodes/${currentQrId}`).update({
            parkStartTime: null
        });
        currentQrData.parkStartTime = null;
        stopParkTimerUI();
    } else {
        // Start timer
        const startTime = Date.now();
        await db.ref(`qrcodes/${currentQrId}`).update({
            parkStartTime: startTime
        });
        currentQrData.parkStartTime = startTime;
        startParkTimerUI();
    }
}

// Tarama tarihi formatla (gün ve saat)
function formatScanDate(timestamp) {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
        return `Bugün ${timeStr}`;
    } else if (isYesterday) {
        return `Dün ${timeStr}`;
    } else {
        const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        return `${dateStr} ${timeStr}`;
    }
}

// Scan listener referansı
let scanHistoryListener = null;

// Tarama geçmişini render et
function renderScanHistory(scans, total) {
    if (!scanHistoryList || !totalScans) return;
    
    totalScans.textContent = total;
    
    if (!scans || Object.keys(scans).length === 0) {
        scanHistoryList.innerHTML = '<p class="no-scans">Henüz tarama yok</p>';
        return;
    }
    
    // Taramaları diziye çevir ve tarihe göre sırala (en yeni üstte)
    const scanArray = Object.entries(scans)
        .map(([key, value]) => ({ id: key, ...value }))
        .sort((a, b) => b.timestamp - a.timestamp);
    
    // HTML oluştur
    let html = '';
    scanArray.forEach((scan, index) => {
        const isNew = index === 0 && (Date.now() - scan.timestamp < 60000); // 1 dk içindeyse yeni
        const isOwner = scan.type === 'owner';
        
        // İkon ve stil belirleme
        let icon, itemClass, label;
        if (isOwner) {
            icon = '🔑';
            itemClass = 'owner-login';
            label = 'Hesap Girişi';
        } else if (isNew) {
            icon = '🆕';
            itemClass = 'new-scan';
            label = 'Ziyaretçi';
        } else {
            icon = '👁️';
            itemClass = '';
            label = 'Ziyaretçi';
        }
        
        html += `
            <div class="scan-item ${itemClass}">
                <span class="scan-icon">${icon}</span>
                <div class="scan-details">
                    <span class="scan-time">${formatScanDate(scan.timestamp)}</span>
                    <span class="scan-type-label">${label}</span>
                </div>
            </div>
        `;
    });
    
    scanHistoryList.innerHTML = html;
}

// Tarama geçmişini anlık dinle
function startScanHistoryListener() {
    if (!scanHistoryList || !totalScans) return;
    
    // Önceki listener'ı kaldır
    if (scanHistoryListener) {
        db.ref(`qrcodes/${currentQrId}/scans`).off('value', scanHistoryListener);
    }
    
    // Anlık dinlemeyi başlat - tüm kayıtları al
    scanHistoryListener = db.ref(`qrcodes/${currentQrId}/scans`)
        .orderByChild('timestamp')
        .on('value', async (snapshot) => {
            const allScans = snapshot.val();
            
            // Gerçek ziyaretçi sayısını hesapla (owner hariç)
            let visitorCount = 0;
            if (allScans) {
                Object.values(allScans).forEach(scan => {
                    if (scan.type !== 'owner') {
                        visitorCount++;
                    }
                });
            }
            
            // Son 10 kaydı göster
            let recentScans = null;
            if (allScans) {
                const scanArray = Object.entries(allScans)
                    .map(([key, value]) => ({ id: key, ...value }))
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10);
                
                recentScans = {};
                scanArray.forEach(scan => {
                    recentScans[scan.id] = scan;
                });
            }
            
            renderScanHistory(recentScans, visitorCount);
            
            // Firebase'deki scanCount'u düzelt (eşitlemek için)
            await db.ref(`qrcodes/${currentQrId}`).update({
                scanCount: visitorCount
            });
        });
}

// Listener'ı durdur
function stopScanHistoryListener() {
    if (scanHistoryListener) {
        db.ref(`qrcodes/${currentQrId}/scans`).off('value', scanHistoryListener);
        scanHistoryListener = null;
    }
}

// Quick Note Functions
function applyQuickNote(noteText) {
    noteInput.value = noteText;
    noteCharCount.textContent = noteText.length;
    
    // Auto-resize textarea
    noteInput.style.height = 'auto';
    noteInput.style.height = Math.min(noteInput.scrollHeight, 150) + 'px';
}

// Save phone number
async function savePhone() {
    const phone = phoneInput.value.trim();
    const ownerName = nameInput.value.trim();
    const plate = plateInput.value.trim().toUpperCase();
    const note = noteInput.value.trim();
    
    if (!phone) {
        showError(saveError, 'Telefon numarasi gerekli.');
        return;
    }
    
    // Basic phone validation
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        showError(saveError, 'Gecerli bir telefon numarasi girin.');
        return;
    }
    
    try {
        // Encrypt sensitive data before saving
        const encryptedPhone = await encryptData(phone);
        const encryptedName = await encryptData(ownerName);
        const encryptedPlate = await encryptData(plate);
        const encryptedNote = await encryptData(note);
        
        await db.ref(`qrcodes/${currentQrId}`).update({
            phone: encryptedPhone,
            ownerName: encryptedName,
            plate: encryptedPlate,
            note: encryptedNote,
            nameVisible: nameVisibleToggle.checked,
            plateVisible: plateVisibleToggle.checked,
            noteVisible: noteVisibleToggle.checked,
            active: activeToggle.checked,
            updatedAt: Date.now()
        });
        
        hideError(saveError);
        saveSuccess.classList.remove('hidden');
        
        // Update local data
        currentQrData.phone = phone;
        currentQrData.ownerName = ownerName;
        currentQrData.plate = plate;
        currentQrData.note = note;
        currentQrData.nameVisible = nameVisibleToggle.checked;
        currentQrData.plateVisible = plateVisibleToggle.checked;
        currentQrData.noteVisible = noteVisibleToggle.checked;
        currentQrData.active = activeToggle.checked;
        
        setTimeout(() => {
            saveSuccess.classList.add('hidden');
        }, 3000);
    } catch (error) {
        showError(saveError, 'Kaydetme hatası. Tekrar deneyin.');
    }
}

// Event Listeners
verifyCodeBtn.addEventListener('click', verifySecurityCode);

securityCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        verifySecurityCode();
    }
});

activeToggle.addEventListener('change', updateStatusText);

// Visibility toggle event listeners
if (nameVisibleToggle) {
    nameVisibleToggle.addEventListener('change', updateVisibilityTexts);
}
if (plateVisibleToggle) {
    plateVisibleToggle.addEventListener('change', updateVisibilityTexts);
}
if (noteVisibleToggle) {
    noteVisibleToggle.addEventListener('change', updateVisibilityTexts);
}

savePhoneBtn.addEventListener('click', savePhone);

// Park Timer button
if (parkTimerBtn) {
    parkTimerBtn.addEventListener('click', toggleParkTimer);
}

// Quick note buttons
document.querySelectorAll('.quick-note-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const noteText = btn.getAttribute('data-note');
        applyQuickNote(noteText);
    });
});

// Note character counter and auto-resize
if (noteInput) {
    noteInput.addEventListener('input', () => {
        const count = noteInput.value.length;
        noteCharCount.textContent = count;
        
        // Auto-resize textarea
        noteInput.style.height = 'auto';
        noteInput.style.height = Math.min(noteInput.scrollHeight, 150) + 'px';
    });
}

ownerBtn.addEventListener('click', () => {
    showScreen(securityCodeScreen);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Owner button on deactive screen
    const ownerBtnDeactive = document.getElementById('ownerBtnDeactive');
    if (ownerBtnDeactive) {
        ownerBtnDeactive.addEventListener('click', () => {
            showScreen(securityCodeScreen);
        });
    }
    
    // Agreement modal checkbox
    if (agreementCheck) {
        agreementCheck.addEventListener('change', () => {
            agreementAcceptBtn.disabled = !agreementCheck.checked;
        });
    }
    
    // Agreement accept button
    if (agreementAcceptBtn) {
        agreementAcceptBtn.addEventListener('click', () => {
            if (agreementCheck.checked && pendingAction) {
                hideAgreementModal();
                pendingAction();
                pendingAction = null;
            }
        });
    }
    
    // Delete account button
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', showDeleteAccountModal);
    }
    
    // Cancel delete button
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteAccountModal);
    }
    
    // Confirm delete button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteAccount);
    }
    
    // Only allow numbers in delete security code input
    if (deleteSecurityCodeInput) {
        deleteSecurityCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
        });
        
        deleteSecurityCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                deleteAccount();
            }
        });
    }
    
    // Change security code button
    if (changeSecurityCodeBtn) {
        changeSecurityCodeBtn.addEventListener('click', showChangeSecurityCodeModal);
    }
    
    // Cancel change security button
    if (cancelChangeSecurityBtn) {
        cancelChangeSecurityBtn.addEventListener('click', hideChangeSecurityCodeModal);
    }
    
    // Confirm change security button
    if (confirmChangeSecurityBtn) {
        confirmChangeSecurityBtn.addEventListener('click', changeSecurityCode);
    }
    
    // Security code input event listeners
    if (newSecurityCodeInput) {
        newSecurityCodeInput.addEventListener('input', () => {
            checkNewSecurityCode();
        });
    }
    
    if (confirmSecurityCodeInput) {
        confirmSecurityCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                changeSecurityCode();
            }
        });
    }
    
    init();
});
