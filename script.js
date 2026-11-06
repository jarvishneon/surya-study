// RJ STUDY ACADEMY - script.js (v28.0 MASTER BLUEPRINT)
// Features: One-time Login, 3D Subject Launch, Session Persistence

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const errorMsg = document.getElementById('errorMsg');

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const competitiveView = document.getElementById('competitive-view');
const boardsView = document.getElementById('boards-view');
const notificationsView = document.getElementById('notifications-view');
const subjectsView = document.getElementById('subjects-view');

const displayUsername = document.getElementById('displayUsername');
const profileInitial = document.getElementById('profileInitial');
const profileInitial2 = document.getElementById('profileInitial2');
const profileInitial3 = document.getElementById('profileInitial3');
const profileInitial4 = document.getElementById('profileInitial4');
const profileInitial5 = document.getElementById('profileInitial5');

// Base64 Encoded Passwords
const validPasswords = [
    atob("NDE4MTcyMw=="), // 4181723
    atob("MDQ3ODM="),     // 04783
    atob("UGFkaGxv")      // Padhlo
];

// ==================== SESSION PERSISTENCE (NO RE-LOGIN ON REFRESH) ====================
function checkExistingSession() {
    const savedName = localStorage.getItem("rj_student_name");
    const loginTime = localStorage.getItem("rj_login_time");
    
    // Session valid for 24 hours
    if (savedName && loginTime) {
        const hoursPassed = (Date.now() - Number(loginTime)) / (1000 * 60 * 60);
        if (hoursPassed < 24) {
            activateDashboard(savedName);
            return true;
        } else {
            // Session expired
            localStorage.removeItem("rj_student_name");
            localStorage.removeItem("rj_login_time");
        }
    }
    return false;
}

function activateDashboard(studentName) {
    // Set Name everywhere
    if (displayUsername) displayUsername.innerText = studentName;
    document.querySelectorAll('.displayUsernameCopy').forEach(el => el.innerText = studentName);
    
    const initial = studentName.charAt(0).toUpperCase();
    if (profileInitial) profileInitial.innerText = initial;
    if (profileInitial2) profileInitial2.innerText = initial;
    if (profileInitial3) profileInitial3.innerText = initial;
    if (profileInitial4) profileInitial4.innerText = initial;
    if (profileInitial5) profileInitial5.innerText = initial;

    hideAllViews();
    dashboardView.classList.add('active');
}

// Run on page load
window.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
});

function hideAllViews() {
    const views = [loginView, dashboardView, competitiveView, boardsView, notificationsView, subjectsView];
    views.forEach(v => { if (v) v.classList.remove('active'); });
}

// Handle Login Submission
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const enteredName = usernameInput.value.trim();
        const enteredPass = passwordInput.value.trim();

        if (!enteredName) {
            errorMsg.innerText = "Please enter your name!";
            errorMsg.style.display = "block";
            return;
        }

        if (validPasswords.includes(enteredPass)) {
            errorMsg.style.display = "none";
            
            // Save to localStorage (Persists on refresh)
            localStorage.setItem("rj_student_name", enteredName);
            localStorage.setItem("rj_login_time", Date.now().toString());
            
            // Also keep for test portal compatibility
            sessionStorage.setItem("student_name", enteredName);
            localStorage.setItem("rjStudyUsername", enteredName);
            
            activateDashboard(enteredName);
        } else {
            errorMsg.innerText = "Incorrect password!";
            errorMsg.style.display = "block";
            passwordInput.value = "";
        }
    });
}

// Toggle Profile Dropdown Menu
function toggleProfileMenu(event) {
    event.stopPropagation();
    const currentContainer = event.currentTarget.closest('.profile-menu-container');
    const dropdown = currentContainer.querySelector('.profile-dropdown');
    
    closeAllDropdowns();
    if (dropdown) dropdown.classList.toggle('active');
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
    // Clear all session data
    localStorage.removeItem("rj_student_name");
    localStorage.removeItem("rj_login_time");
    localStorage.removeItem("rjStudyUsername");
    sessionStorage.removeItem("student_name");
    
    if (usernameInput) usernameInput.value = "";
    if (passwordInput) passwordInput.value = "";
    
    closeAllDropdowns();
    hideAllViews();
    loginView.classList.add('active');
}

// ==================== VIEW NAVIGATION ====================
function switchSubView(viewId) {
    closeAllDropdowns();
    hideAllViews();
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
}

function goHome() {
    closeAllDropdowns();
    hideAllViews();
    dashboardView.classList.add('active');
}

// ==================== 3D SUBJECT CARD → LAUNCH TEST ====================
function launchTest(subject) {
    const studentName = localStorage.getItem("rj_student_name") || sessionStorage.getItem("student_name");
    
    if (!studentName) {
        alert("Session expired! Please login again.");
        logout();
        return;
    }
    
    // Ensure name is available for test portal
    sessionStorage.setItem("student_name", studentName);
    localStorage.setItem("rjStudyUsername", studentName);
    
    // Open test portal with subject parameter
    window.open(`test/index.html?subject=${subject}`, '_blank');
}

// ==================== TERMINAL ANIMATION ====================
const terminal = document.getElementById('terminal-bg');
const hackerLogs = [
    "Initializing secure hypervisor environment...",
    "Loading root credentials for RJ_STUDY_ACADEMY_PORTAL...",
    "Establishing encrypted handshake with node 127.0.0.1:443 [SECURE]",
    "Injecting neural-net study pathways: [ENGLISH, HINDI, MATH, SCIENCE]",
    "Bypassing perimeter security filters... ACCESS GRANTED.",
    "Live system telemetry: CPU load 3.8% | Memory footprint: 1.1 GB",
    "Mounting student database: Encrypted via AES-256-GCM",
    "Listening for incoming student authentication packets on port 8080...",
    "Status: Multi-Subject Test Engine v28.0 operating at peak efficiency."
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
