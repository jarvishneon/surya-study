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
    chatPollInterval = setInterval(fetchChatHistory, 800); // 0.8s WhatsApp-like speed
}

function closeDoubtChat() {
    const overlay = document.getElementById('chatModalOverlay');
    if (overlay) overlay.style.display = 'none';

    if (chatPollInterval) {
        clearInterval(chatPollInterval);
        chatPollInterval = null;
    }

    // Stop any active recording on close
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

// POST polling → bypasses Cloudflare edge cache
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

    // Max 3 messages in UI
    const display = (chatArray || []).slice(-3);

    const currentJSON = box.getAttribute('data-last-json');
    const newJSON = JSON.stringify(display);
    if (currentJSON === newJSON) return; // skip re-render if unchanged

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

// ---------- TEXT MESSAGE ----------
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

// ---------- IMAGE (Canvas compress → max width 800px, JPEG 0.7) ----------
function triggerImageUpload() {
    const fileInput = document.getElementById('chatImageInput');
    if (fileInput) fileInput.click();
}

async function handleChatImage(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    event.target.value = ''; // reset so same file can be re-selected

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

// ---------- VOICE NOTE (MediaRecorder → ogg/opus) ----------
async function toggleVoiceRecord() {
    const recBtn = document.getElementById('voiceRecordBtn');
    if (!recBtn) return;

    if (isRecording) {
        // Stop
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        recBtn.classList.remove('recording');
        recBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        return;
    }

    // Start
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is browser mein support nahi karta.');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];

        // Prefer ogg/opus, fallback to webm
        let mime = 'audio/ogg; codecs=opus';
        if (!MediaRecorder.isTypeSupported(mime)) {
            mime = 'audio/webm; codecs=opus';
        }
        if (!MediaRecorder.isTypeSupported(mime)) {
            mime = 'audio/webm';
        }

        mediaRecorder = new MediaRecorder(stream, { mimeType: mime });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(audioChunks, { type: mime });
            audioChunks = [];

            if (blob.size < 100) return; // accidental tap

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
        alert('Microphone access deny ho gaya. Browser permission check karein.');
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
