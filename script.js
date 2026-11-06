// RJ STUDY ACADEMY - script.js v28.1 (CHAT SYNC FIXED)
// Passwords: 04783 | pdhlo | 4181723  (case-insensitive)

const VALID_PASSWORDS = ["04783", "pdhlo", "4181723"];
const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";

/* -------------- LOGIN SYSTEM -------------- */
function handleLogin(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    const nameInput = document.getElementById("usernameInput");
    const passInput = document.getElementById("passwordInput");
    const errorMsg = document.getElementById("errorMsg");

    if (!nameInput || !passInput) return false;

    const enteredName = nameInput.value.trim();
    const enteredPass = passInput.value.trim().toLowerCase();

    if (!enteredName) {
        if (errorMsg) {
            errorMsg.innerText = "Please enter your name!";
            errorMsg.style.display = "block";
        }
        return false;
    }

    if (VALID_PASSWORDS.includes(enteredPass)) {
        if (errorMsg) errorMsg.style.display = "none";

        localStorage.setItem("rj_student_name", enteredName);
        localStorage.setItem("rj_login_time", Date.now().toString());
        localStorage.setItem("rjStudyUsername", enteredName);
        sessionStorage.setItem("student_name", enteredName);

        activateDashboard(enteredName);
    } else {
        if (errorMsg) {
            errorMsg.innerText = "Incorrect password!";
            errorMsg.style.display = "block";
        }
        passInput.value = "";
        passInput.focus();
    }
    return false;
}

function checkExistingSession() {
    const savedName = localStorage.getItem("rj_student_name");
    const loginTime = localStorage.getItem("rj_login_time");

    if (savedName && loginTime) {
        const hoursPassed = (Date.now() - Number(loginTime)) / (1000 * 60 * 60);
        if (hoursPassed < 24) {
            activateDashboard(savedName);
            return true;
        }
        localStorage.removeItem("rj_student_name");
        localStorage.removeItem("rj_login_time");
    }
    return false;
}

/* -------------- DASHBOARD NAVIGATION -------------- */
function activateDashboard(studentName) {
    const displayUsername = document.getElementById("displayUsername");
    if (displayUsername) displayUsername.innerText = studentName;

    document.querySelectorAll(".displayUsernameCopy").forEach(function (el) {
        el.innerText = studentName;
    });

    const initial = studentName.charAt(0).toUpperCase();
    ["profileInitial", "profileInitial2", "profileInitial3", "profileInitial4", "profileInitial5"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.innerText = initial;
    });

    hideAllViews();
    const dash = document.getElementById("dashboard-view");
    if (dash) dash.classList.add("active");
}

function hideAllViews() {
    ["login-view", "dashboard-view", "competitive-view", "boards-view", "notifications-view", "subjects-view"].forEach(function (id) {
        const v = document.getElementById(id);
        if (v) v.classList.remove("active");
    });
}

function toggleProfileMenu(event) {
    event.stopPropagation();
    const container = event.currentTarget.closest(".profile-menu-container");
    const dropdown = container ? container.querySelector(".profile-dropdown") : null;
    closeAllDropdowns();
    if (dropdown) dropdown.classList.toggle("active");
}

function closeAllDropdowns() {
    document.querySelectorAll(".profile-dropdown").forEach(function (d) {
        d.classList.remove("active");
    });
}

function logout() {
    localStorage.removeItem("rj_student_name");
    localStorage.removeItem("rj_login_time");
    localStorage.removeItem("rjStudyUsername");
    sessionStorage.removeItem("student_name");

    const u = document.getElementById("usernameInput");
    const p = document.getElementById("passwordInput");
    if (u) u.value = "";
    if (p) p.value = "";

    closeAllDropdowns();
    if (isChatOpen) toggleChat(false);
    hideAllViews();
    const loginView = document.getElementById("login-view");
    if (loginView) loginView.classList.add("active");
}

function switchSubView(viewId) {
    closeAllDropdowns();
    hideAllViews();
    const target = document.getElementById(viewId);
    if (target) target.classList.add("active");
}

function goHome() {
    closeAllDropdowns();
    hideAllViews();
    const dash = document.getElementById("dashboard-view");
    if (dash) dash.classList.add("active");
}

/* -------------- LAUNCH TEST -------------- */
function launchTest(subject) {
    const studentName =
        localStorage.getItem("rj_student_name") ||
        sessionStorage.getItem("student_name") ||
        localStorage.getItem("rjStudyUsername");

    if (!studentName) {
        alert("Session expired! Please login again.");
        logout();
        return;
    }

    sessionStorage.setItem("student_name", studentName);
    localStorage.setItem("rjStudyUsername", studentName);
    window.open("test/index.html?subject=" + subject, "_blank");
}

/* -------------- CHAT SYSTEM (FAST SYNC) -------------- */
let chatInterval = null;
let isChatOpen = false;
let lastChatHash = "";
let chatPollInFlight = false;

function getStudentName() {
    return (
        localStorage.getItem("rj_student_name") ||
        sessionStorage.getItem("student_name") ||
        localStorage.getItem("rjStudyUsername") ||
        ""
    ).trim();
}

function toggleChat(forceState) {
    const overlay = document.getElementById("chatOverlay");
    if (!overlay) return;

    if (typeof forceState === "boolean") {
        isChatOpen = forceState;
    } else {
        isChatOpen = !isChatOpen;
    }

    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }

    if (isChatOpen) {
        overlay.classList.add("active");
        lastChatHash = "";
        pollChat(true);
        // Har 1 second me check karega naye message ke liye
        chatInterval = setInterval(function () {
            pollChat(false);
        }, 1000);
        setTimeout(function () {
            const input = document.getElementById("chatInput");
            if (input) input.focus();
        }, 100);
    } else {
        overlay.classList.remove("active");
    }
}

async function pollChat(forceRender) {
    const studentName = getStudentName();
    if (!studentName || !isChatOpen) return;
    if (chatPollInFlight) return;

    chatPollInFlight = true;
    try {
        const res = await fetch(WORKER_URL + "/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ action: "get", studentName: studentName })
        });
        const data = await res.json();
        if (data && data.success) {
            const hash = JSON.stringify(data.history || []);
            if (forceRender || hash !== lastChatHash) {
                lastChatHash = hash;
                renderChat(data.history || []);
            }
        }
    } catch (e) {
        // silent
    } finally {
        chatPollInFlight = false;
    }
}

async function sendChatMessage() {
    const input = document.getElementById("chatInput");
    if (!input) return;

    const msg = input.value.trim();
    const studentName = getStudentName();
    if (!msg || !studentName) return;

    input.value = "";
    input.disabled = true;

    try {
        const res = await fetch(WORKER_URL + "/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ studentName: studentName, message: msg })
        });
        const data = await res.json();
        if (data && data.success) {
            lastChatHash = JSON.stringify(data.history || []);
            renderChat(data.history || []);
        } else {
            input.value = msg;
        }
    } catch (e) {
        input.value = msg;
    } finally {
        input.disabled = false;
        input.focus();
        setTimeout(function () {
            pollChat(true);
        }, 400);
    }
}

function renderChat(history) {
    const body = document.getElementById("chatBody");
    if (!body) return;

    body.innerHTML = "";
    if (!history || history.length === 0) {
        body.innerHTML =
            "<div style='text-align:center; color:#64748b; font-size:0.85rem; margin-top:20px;'>Send a message to start chatting with Admin.</div>";
        return;
    }

    history.forEach(function (msg) {
        const div = document.createElement("div");
        const sender = (msg.sender || "student").toLowerCase();
        div.className = "chat-message " + (sender === "admin" ? "admin" : "student");
        div.innerText = msg.text || "";
        body.appendChild(div);
    });

    body.scrollTop = body.scrollHeight;
}

/* -------------- INIT PORTAL -------------- */
function initPortal() {
    checkExistingSession();

    const form = document.getElementById("loginForm");
    if (form) {
        form.addEventListener("submit", handleLogin);
    }

    window.addEventListener("click", function (e) {
        if (!e.target.closest(".profile-menu-container")) closeAllDropdowns();
    });

    // Tab par wapas aate hi turant refresh karega
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden && isChatOpen) pollChat(true);
    });
    window.addEventListener("focus", function () {
        if (isChatOpen) pollChat(true);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPortal);
} else {
    initPortal();
}

// Global Exports
window.handleLogin = handleLogin;
window.toggleProfileMenu = toggleProfileMenu;
window.logout = logout;
window.switchSubView = switchSubView;
window.goHome = goHome;
window.launchTest = launchTest;
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;

// Terminal animation
(function () {
    const terminal = document.getElementById("terminal-bg");
    if (!terminal) return;
    const logs = [
        "Initializing secure hypervisor environment...",
        "Loading root credentials for RJ_STUDY_ACADEMY_PORTAL...",
        "Establishing encrypted handshake... [SECURE]",
        "Injecting pathways: [ENGLISH, HINDI, MATH, SCIENCE]",
        "Status: Multi-Subject Test Engine v28.1 ONLINE."
    ];
    let li = 0,
        ci = 0,
        text = "";
    function type() {
        if (li < logs.length) {
            if (ci < logs[li].length) {
                text += logs[li].charAt(ci);
                terminal.innerText = text + "█";
                ci++;
                setTimeout(type, 18);
            } else {
                text += "\n\n";
                li++;
                ci = 0;
                setTimeout(type, 300);
            }
        } else {
            text += "> root@rj-academy:~$ ";
            terminal.innerText = text;
            setTimeout(function () {
                text = "";
                li = 0;
                ci = 0;
                type();
            }, 4000);
        }
    }
    type();
})();
