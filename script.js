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

function hideAllViews() {
    loginView.classList.remove('active');
    dashboardView.classList.remove('active');
    competitiveView.classList.remove('active');
    boardsView.classList.remove('active');
    notificationsView.classList.remove('active');
}

// Handle Login Submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const enteredName = usernameInput.value.trim();
    const enteredPass = passwordInput.value.trim();
    const loginBtn = document.querySelector('.login-btn');

    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
    loginBtn.style.opacity = '0.7';
    loginBtn.style.pointerEvents = 'none';

    setTimeout(() => {
        if (btoa(enteredPass) === "NDE4MTcyMw==") {
            errorMsg.style.display = "none";
            
            displayUsername.innerText = enteredName;
            document.querySelectorAll('.displayUsernameCopy').forEach(el => el.innerText = enteredName);
            
            const initial = enteredName.charAt(0).toUpperCase();
            profileInitial.innerText = initial;
            profileInitial2.innerText = initial;
            profileInitial3.innerText = initial;
            profileInitial4.innerText = initial;

            localStorage.setItem('rjStudyLoggedIn', 'true');
            localStorage.setItem('rjStudyUsername', enteredName);
            
            hideAllViews();
            dashboardView.classList.add('active');
        } else {
            errorMsg.style.display = "block";
            passwordInput.value = "";
        }
        
        loginBtn.innerHTML = 'Authenticate & Login';
        loginBtn.style.opacity = '1';
        loginBtn.style.pointerEvents = 'auto';
    }, 1200);
});

function goHome() {
    closeAllDropdowns();
    hideAllViews();
    dashboardView.classList.add('active');
}

function switchSubView(viewId) {
    closeAllDropdowns();
    hideAllViews();
    document.getElementById(viewId).classList.add('active');
}

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

// Handle Logout
function logout() {
    localStorage.removeItem('rjStudyLoggedIn');
    localStorage.removeItem('rjStudyUsername');
    usernameInput.value = "";
    passwordInput.value = "";
    closeAllDropdowns();
    hideAllViews();
    errorMsg.style.display = "none";
    loginView.classList.add('active');
}

// Restore Login
function restoreLogin() {
    if (localStorage.getItem('rjStudyLoggedIn') !== 'true') return;

    const savedName = localStorage.getItem('rjStudyUsername') || '';
    displayUsername.innerText = savedName;
    document.querySelectorAll('.displayUsernameCopy').forEach(el => el.innerText = savedName);
    const initial = savedName.charAt(0).toUpperCase() || 'A';
    profileInitial.innerText = initial;
    profileInitial2.innerText = initial;
    profileInitial3.innerText = initial;
    profileInitial4.innerText = initial;
    hideAllViews();
    dashboardView.classList.add('active');
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
