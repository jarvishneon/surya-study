const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const errorMsg = document.getElementById('errorMsg');

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const competitiveView = document.getElementById('competitive-view');
const boardsView = document.getElementById('boards-view');
const notificationsView = document.getElementById('notifications-view');
const chatView = document.getElementById('chat-view');
const testSubjectsView = document.getElementById('test-subjects-view'); // Naya View

const displayUsername = document.getElementById('displayUsername');
const profileInitial = document.getElementById('profileInitial');
const profileInitial2 = document.getElementById('profileInitial2');
const profileInitial3 = document.getElementById('profileInitial3');
const profileInitial4 = document.getElementById('profileInitial4');
const profileInitial5 = document.getElementById('profileInitial5');
const profileInitial6 = document.getElementById('profileInitial6'); // Naya Initial
const profileDropdown = document.getElementById('profileDropdown');

// Base64 Encoded Passwords
const validPasswords = [
    atob("NDE4MTcyMw=="), // 4181723
    atob("MDQ3ODM="),     // 04783
    atob("UGFkaGxv")      // Padhlo
];

function hideAllViews() {
    loginView.classList.remove('active');
    dashboardView.classList.remove('active');
    competitiveView.classList.remove('active');
    boardsView.classList.remove('active');
    notificationsView.classList.remove('active');
    chatView.classList.remove('active');
    testSubjectsView.classList.remove('active'); // Hide new view
}

// Handle Login Submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const enteredName = usernameInput.value.trim();
    const enteredPass = passwordInput.value.trim();

    if (validPasswords.includes(enteredPass)) {
        errorMsg.style.display = "none";
        
        // Store Name for Chat and Test compatibility
        sessionStorage.setItem("student_name", enteredName);
        localStorage.setItem("rjStudyUsername", enteredName);
        
        // Set Name & Circular Initial Letters across views
        displayUsername.innerText = enteredName;
        document.querySelectorAll('.displayUsernameCopy').forEach(el => el.innerText = enteredName);
        
        const initial = enteredName.charAt(0).toUpperCase();
        profileInitial.innerText = initial;
        profileInitial2.innerText = initial;
        profileInitial3.innerText = initial;
        profileInitial4.innerText = initial;
        profileInitial5.innerText = initial;
        if(profileInitial6) profileInitial6.innerText = initial;

        hideAllViews();
        dashboardView.classList.add('active');
    } else {
        errorMsg.style.display = "block";
        passwordInput.value = "";
    }
});

// Toggle Profile Dropdown Menu
function toggleProfileMenu(event) {
    event.stopPropagation();
    const currentContainer = event.currentTarget.closest('.profile-menu-container');
    const dropdown = currentContainer.querySelector('.profile-dropdown');
    
    closeAllDropdowns();
    dropdown.classList.toggle('active');
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

function logout() {
    usernameInput.value = "";
    passwordInput.value = "";
    sessionStorage.removeItem("student_name");
    closeAllDropdowns();
    hideAllViews();
    stopChatPolling();
    loginView.classList.add('active');
}

// ==================== TEST SUBJECT ROUTING ====================
function startSubjectTest(subject) {
    const studentName = sessionStorage.getItem("student_name");
    if (!studentName) {
        alert("Session expired. Please login again.");
        logout();
        return;
    }
    // Open test folder with subject parameter in URL
    window.open('test/index.html?subject=' + subject, '_blank');
}

// ==================== CHAT SYSTEM LOGIC ====================
const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
let chatInterval = null;

function switchSubView(viewId) {
    closeAllDropdowns();
    hideAllViews();
    document.getElementById(viewId).classList.add('active');
    
    // Chat Polling Management
    if (viewId === 'chat-view') {
        loadMessages();
        chatInterval = setInterval(loadMessages, 3000);
    } else {
        stopChatPolling();
    }
}

function goHome() {
    closeAllDropdowns();
    hideAllViews();
    dashboardView.classList.add('active');
    stopChatPolling();
}

function stopChatPolling() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
}

function formatText(text) {
    if (!text) return '';
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Bold
    formatted = formatted.replace(/\*(.*?)\*/g, '<i>$1</i>');     // Italic
    return formatted;
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function loadMessages() {
    try {
        const response = await fetch(`${WORKER_URL}/api/chat`);
        const data = await response.json();
        
        if (data.error) {
            if (data.error === "Chat is currently closed.") {
                chatInput.disabled = true;
                chatInput.placeholder = "Chat is closed by Admin.";
                sendBtn.disabled = true;
            }
            return;
        }

        chatInput.disabled = false;
        chatInput.placeholder = "Type your message here... Use **bold** or *italic*";
        sendBtn.disabled = false;

        chatBox.innerHTML = '';
        const currentUser = sessionStorage.getItem("student_name") || "Student";

        data.forEach(msg => {
            const isOwnMessage = (msg.sender === currentUser);
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${isOwnMessage ? 'sent' : 'received'}`;
            
            msgDiv.innerHTML = `
                <div class="chat-sender">${msg.sender === "ADMIN" ? '<i class="fa-solid fa-shield-halved"></i> ADMIN' : msg.sender}</div>
                <div class="chat-text">${formatText(msg.text)}</div>
                <span class="chat-time">${formatTime(msg.timestamp)}</span>
            `;
            chatBox.appendChild(msgDiv);
        });

        // Auto-scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}

async function sendChatMessage() {
    const text = chatInput.value.trim();
    const sender = sessionStorage.getItem("student_name");
    
    if (!text || !sender) return;

    const tempDiv = document.createElement('div');
    tempDiv.className = 'chat-message sent';
    tempDiv.innerHTML = `
        <div class="chat-text">${formatText(text)}</div>
        <span class="chat-time">Sending...</span>
    `;
    chatBox.appendChild(tempDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    chatInput.value = '';

    try {
        await fetch(`${WORKER_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender, text })
        });
        loadMessages();
    } catch (error) {
        console.error("Error sending message:", error);
        tempDiv.innerHTML += '<br><small style="color:red;">Failed to send.</small>';
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// ==================== TERMINAL ANIMATION ====================
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
