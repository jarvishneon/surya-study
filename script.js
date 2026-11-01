const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const errorMsg = document.getElementById('errorMsg');

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const competitiveView = document.getElementById('competitive-view');
const boardsView = document.getElementById('boards-view');
const notificationsView = document.getElementById('notifications-view');

const displayUsername = document.getElementById('displayUsername');
const profileInitial = document.getElementById('profileInitial');
const profileInitial2 = document.getElementById('profileInitial2');
const profileInitial3 = document.getElementById('profileInitial3');
const profileInitial4 = document.getElementById('profileInitial4');

// 🔒 ALLOWED 3 PASSWORDS LIST (Base64 Encoded)
const allowedPasswords = [
    "NDE4MTcyMw==", // Pass 1: 4181723
    "MDQ3ODM=",     // Pass 2: 04783
    "UGFkaGxv"      // Pass 3: Padhlo
];

function setProfileInitials(name) {
    const initial = (name && name.length > 0) ? name.charAt(0).toUpperCase() : 'S';
    if (profileInitial) profileInitial.innerText = initial;
    if (profileInitial2) profileInitial2.innerText = initial;
    if (profileInitial3) profileInitial3.innerText = initial;
    if (profileInitial4) profileInitial4.innerText = initial;
}

function setDisplayUsernames(name) {
    if (displayUsername) displayUsername.innerText = name;
    document.querySelectorAll('.displayUsernameCopy').forEach(el => el.innerText = name);
}

function hideAllViews() {
    if (loginView) loginView.classList.remove('active');
    if (dashboardView) dashboardView.classList.remove('active');
    if (competitiveView) competitiveView.classList.remove('active');
    if (boardsView) boardsView.classList.remove('active');
    if (notificationsView) notificationsView.classList.remove('active');
}

// Handle Login Submission
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const enteredName = usernameInput ? usernameInput.value.trim() : "Student";
        const enteredPass = passwordInput ? passwordInput.value.trim() : "";
        const loginBtn = document.querySelector('.login-btn');

        if (!enteredName) {
            alert("Kripya apna Naam bharein!");
            return;
        }

        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            loginBtn.style.opacity = '0.7';
            loginBtn.style.pointerEvents = 'none';
        }

        setTimeout(() => {
            const encodedPass = btoa(enteredPass);

            if (allowedPasswords.includes(encodedPass)) {
                if (errorMsg) errorMsg.style.display = "none";
                
                setDisplayUsernames(enteredName);
                setProfileInitials(enteredName);

                localStorage.setItem('rjStudyLoggedIn', 'true');
                localStorage.setItem('rjStudyUsername', enteredName);
                sessionStorage.setItem('student_name', enteredName);
                
                hideAllViews();
                if (dashboardView) dashboardView.classList.add('active');
            } else {
                if (errorMsg) errorMsg.style.display = "block";
                if (passwordInput) passwordInput.value = "";
            }
            
            if (loginBtn) {
                loginBtn.innerHTML = 'Authenticate & Login';
                loginBtn.style.opacity = '1';
                loginBtn.style.pointerEvents = 'auto';
            }
        }, 1000);
    });
}

function goHome() {
    closeAllDropdowns();
    hideAllViews();
    if (dashboardView) dashboardView.classList.add('active');
}

function switchSubView(viewId) {
    closeAllDropdowns();
    hideAllViews();
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
}

// Toggle Profile Dropdown Menu
function toggleProfileMenu(event) {
    event.stopPropagation();
    const currentContainer = event.currentTarget.closest('.profile-menu-container');
    if (currentContainer) {
        const dropdown = currentContainer.querySelector('.profile-dropdown');
        closeAllDropdowns();
        if (dropdown) dropdown.classList.toggle('active');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.profile-dropdown').forEach(d => {
        d.classList.remove('active');
    });
}

window.addEventListener('click', function(e) {
    if (!e.target.closest('.profile-menu-container')) {
        closeAllDropdowns();
    }
});

// Handle Logout
function logout() {
    localStorage.removeItem('rjStudyLoggedIn');
    localStorage.removeItem('rjStudyUsername');
    sessionStorage.removeItem('student_name');
    if (usernameInput) usernameInput.value = "";
    if (passwordInput) passwordInput.value = "";
    closeAllDropdowns();
    closeDoubtChat();
    hideAllViews();
    if (errorMsg) errorMsg.style.display = "none";
    if (loginView) loginView.classList.add('active');
}

// Restore Login
function restoreLogin() {
    if (localStorage.getItem('rjStudyLoggedIn') !== 'true') return;

    const savedName = localStorage.getItem('rjStudyUsername') || 'Student';
    setDisplayUsernames(savedName);
    setProfileInitials(savedName);
    sessionStorage.setItem('student_name', savedName);

    hideAllViews();
    if (dashboardView) dashboardView.classList.add('active');
}

restoreLogin();

// Background Terminal Animation Script
const terminal = document.getElementById('terminal-bg');
const hackerLogs = [
    "Initializing secure hypervisor environment...",
    "Loading root credentials for RJ_STUDY_ACADEMY_PORTAL...",
    "Establishing encrypted handshake with node 127.0.0.1:443 [SECURE]",
    "Injecting neural-net study pathways: [PW, RWA, VIDYAGRAM, KGS, SERVERS]",
    "Bypassing perimeter security filters... ACCESS GRANTED.",
    "Live system telemetry: CPU load 3.8% | Memory footprint: 1.1 GB",
    "Mounting student database: Encrypted via AES-256-GCM",
    "Listening for incoming student authentication packets on port 8080...",
    "Status: All cyber modules operating at peak efficiency."
];

let lineIndex = 0;
let charIndex = 0;
let currentText = "";

function typeTerminal() {
    if (!terminal) return;
    if (lineIndex < hackerLogs.length) {
        if (charIndex < hackerLogs[lineIndex].length) {
            currentText += hackerLogs[lineIndex].charAt(charIndex);
            terminal.innerText = currentText + "█";
            charIndex++;
            setTimeout(typeTerminal, 20);
        } else {
            currentText += "\n\n";
            lineIndex++;
            charIndex = 0;
            setTimeout(typeTerminal, 350);
        }
    } else {
        currentText += "> root@rj-academy-system:~$ ";
        terminal.innerText = currentText;
        setTimeout(() => {
            currentText = "";
            lineIndex = 0;
            typeTerminal();
        }, 4000);
    }
}

typeTerminal();


// ======================================================
// ZERO-LATENCY REALTIME DISCUSS DOUBTS CHAT ENGINE
// Text + Image (Canvas compress) + Voice Notes (MediaRecorder)
// ======================================================

const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";
let chatPollInterval = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

function getChatStudentName() {
    return sessionStorage.getItem('student_name') || localStorage.getItem('rjStudyUsername') || "Guest";
}

function openDoubtChat() {
    const overlay = document.getElementById('chatModalOverlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    fetchChatHistory();

    if (chatPollInterval) clearInterval(chatPollInterval);
    chatPollInterval = setInterval(fetchChatHistory, 800);
}

function closeDoubtChat() {
    const overlay = document.getElementById('chatModalOverlay');
    if (overlay) overlay.style.display = 'none';

    if (chatPollInterval) {
        clearInterval(chatPollInterval);
        chatPollInterval = null;
    }

    if (isRecording && mediaRecorder) {
        mediaRecorder.stop();
        isRecording = false;
        const recBtn = document.getElementById('voiceRecordBtn');
        if (recBtn) {
            recBtn.classList.remove('recording');
            recBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        }
    }
}

async function fetchChatHistory() {
    const sName = getChatStudentName();
    try {
        const response = await fetch(`${WORKER_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "get", studentName: sName })
        });
        const data = await response.json();
        if (data && data.success) {
            renderChat(data.chat || []);
        }
    } catch (e) {
        console.error("Chat fetch error:", e);
    }
}

function renderChat(chatArray) {
    const box = document.getElementById('chatHistory');
    if (!box) return;

    const display = (chatArray || []).slice(-3);
    const currentJSON = box.getAttribute('data-last-json');
    const newJSON = JSON.stringify(display);
    if (currentJSON === newJSON) return;

    box.setAttribute('data-last-json', newJSON);
    box.innerHTML = '';

    if (display.length === 0) {
        box.innerHTML = '<p style="text-align:center; color:#64748b; font-size:0.85rem; margin-top:30px;">Ask any doubt! Administrator will reply live here.</p>';
        return;
    }

    display.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-msg ${msg.type === 'admin' ? 'msg-admin' : 'msg-student'}`;

        const sender = document.createElement('span');
        sender.className = 'sender-name';
        sender.innerText = msg.type === 'admin' ? '👑 Administrator' : (msg.sender || 'Student');
        div.appendChild(sender);

        const msgType = msg.msgType || 'text';

        if (msgType === 'image' && msg.media) {
            const img = document.createElement('img');
            img.src = msg.media;
            img.alt = 'Doubt image';
            img.className = 'chat-media-img';
            img.loading = 'lazy';
            img.onclick = () => window.open(msg.media, '_blank');
            div.appendChild(img);
            if (msg.text) {
                const caption = document.createElement('span');
                caption.innerText = msg.text;
                div.appendChild(caption);
            }
        } else if (msgType === 'voice' && msg.media) {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.preload = 'metadata';
            audio.className = 'chat-media-audio';
            audio.src = msg.media;
            div.appendChild(audio);
            if (msg.text) {
                const caption = document.createElement('span');
                caption.innerText = msg.text;
                div.appendChild(caption);
            }
        } else {
            const text = document.createElement('span');
            text.innerText = msg.text || '';
            div.appendChild(text);
        }

        box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
}

function handleChatEnter(e) {
    if (e.key === 'Enter') sendDoubtMsg();
}

async function sendDoubtMsg() {
    const inputField = document.getElementById('doubtInput');
    if (!inputField) return;

    const text = inputField.value.trim();
    if (!text) return;

    inputField.value = '';
    const sName = getChatStudentName();

    try {
        const response = await fetch(`${WORKER_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentName: sName,
                message: text,
                msgType: 'text'
            })
        });

        const data = await response.json();
        if (data && data.success) {
            renderChat(data.chat || []);
        } else {
            alert('Message send nahi hua. Thodi der baad try karein.');
        }
    } catch (e) {
        console.error(e);
        alert('Failed to send message. Please check internet connection.');
    }
}

function triggerImageUpload() {
    const fileInput = document.getElementById('chatImageInput');
    if (fileInput) fileInput.click();
}

async function handleChatImage(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    event.target.value = '';

    if (!file.type.startsWith('image/')) {
        alert('Sirf image files allowed hain.');
        return;
    }

    try {
        const base64 = await compressImage(file, 800, 0.7);
        const sName = getChatStudentName();

        const response = await fetch(`${WORKER_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentName: sName,
                message: '',
                msgType: 'image',
                media: base64
            })
        });

        const data = await response.json();
        if (data && data.success) {
            renderChat(data.chat || []);
        } else {
            alert('Image send nahi hui. Dobara try karein.');
        }
    } catch (err) {
        console.error('Image upload error:', err);
        alert('Image process nahi ho payi.');
    }
}

function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = Math.round((h * maxWidth) / w);
                    w = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function toggleVoiceRecord() {
    const recBtn = document.getElementById('voiceRecordBtn');
    if (!recBtn) return;

    if (isRecording) {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        recBtn.classList.remove('recording');
        recBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is browser mein support nahi karta.');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];

        let mime = 'audio/ogg; codecs=opus';
        if (!MediaRecorder.isTypeSupported(mime)) mime = 'audio/webm; codecs=opus';
        if (!MediaRecorder.isTypeSupported(mime)) mime = 'audio/webm';

        mediaRecorder = new MediaRecorder(stream, { mimeType: mime });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(audioChunks, { type: mime });
            audioChunks = [];

            if (blob.size < 100) return;

            try {
                const base64 = await blobToBase64(blob);
                const sName = getChatStudentName();

                const response = await fetch(`${WORKER_URL}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentName: sName,
                        message: '',
                        msgType: 'voice',
                        media: base64
                    })
                });

                const data = await response.json();
                if (data && data.success) {
                    renderChat(data.chat || []);
                } else {
                    alert('Voice note send nahi hua.');
                }
            } catch (err) {
                console.error('Voice send error:', err);
                alert('Voice note process nahi ho payi.');
            }
        };

        mediaRecorder.start();
        isRecording = true;
        recBtn.classList.add('recording');
        recBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
    } catch (err) {
        console.error('Mic access error:', err);
        alert('Microphone access deny ho gaya.');
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}
