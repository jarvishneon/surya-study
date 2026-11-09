// RJ STUDY ACADEMY - script.js v29.0 (Pro Design Update)
// Chat: poll sync + max 3 msgs + 2 min auto wipe (server)

const VALID_PASSWORDS = ["04783", "padhlo", "4181723"];
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

/* -------------- GREETING HELPER -------------- */
function getGreeting() {
    var h = new Date().getHours();
    if (h < 12) return "Good Morning ☀️";
    if (h < 17) return "Good Afternoon 🌤️";
    if (h < 21) return "Good Evening 🌙";
    return "Good Night 🌑";
}

/* -------------- DASHBOARD NAVIGATION -------------- */
function activateDashboard(studentName) {
    var displayUsername = document.getElementById("displayUsername");
    if (displayUsername) displayUsername.innerText = studentName;

    document.querySelectorAll(".displayUsernameCopy").forEach(function (el) {
        el.innerText = studentName;
    });

    var initial = studentName.charAt(0).toUpperCase();

    // Update profile circles
    ["profileInitial", "profileInitial2", "profileInitial3", "profileInitial4", "profileInitial5"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.innerText = initial;
    });

    // Update dropdown avatars
    document.querySelectorAll(".dropdown-avatar").forEach(function (el) {
        el.innerText = initial;
    });

    // Update greeting
    var greetEl = document.getElementById("greetingText");
    if (greetEl) greetEl.innerText = getGreeting();

    hideAllViews();
    var dash = document.getElementById("dashboard-view");
    if (dash) dash.classList.add("active");
}

function hideAllViews() {
    ["login-view", "dashboard-view", "competitive-view", "boards-view", "notifications-view", "subjects-view", "study-material-view", "study-competitive-view", "study-board-view", "study-class-9-view", "study-class-10-view", "study-content-view", "study-pdf-home-view", "study-pdf-competitive-view", "study-pdf-board-view", "study-pdf-class-9-view", "study-pdf-class-10-view", "study-pdf-reader-view"].forEach(function (id) {
        var v = document.getElementById(id);
        if (v) v.classList.remove("active");
    });
}

function toggleProfileMenu(event) {
    event.stopPropagation();
    var container = event.currentTarget.closest(".profile-menu-container");
    var dropdown = container ? container.querySelector(".profile-dropdown") : null;
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

    var u = document.getElementById("usernameInput");
    var p = document.getElementById("passwordInput");
    if (u) u.value = "";
    if (p) p.value = "";

    closeAllDropdowns();
    if (isChatOpen) toggleChat(false);
    hideAllViews();
    var loginView = document.getElementById("login-view");
    if (loginView) loginView.classList.add("active");
}

function switchSubView(viewId) {
    closeAllDropdowns();
    hideAllViews();
    var target = document.getElementById(viewId);
    if (target) target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHome() {
    closeAllDropdowns();
    hideAllViews();
    var dash = document.getElementById("dashboard-view");
    if (dash) dash.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function getStudentName() {
    return (
        localStorage.getItem("rj_student_name") ||
        sessionStorage.getItem("student_name") ||
        localStorage.getItem("rjStudyUsername") ||
        ""
    ).trim();
}

/* -------------- STUDY MATERIAL SYSTEM -------------- */
var currentStudyParentView = "study-material-view";

function goBackFromStudyContent() {
    switchSubView(currentStudyParentView);
}

async function openStudyMaterial(folder, fileName, subjectTitle) {
    currentStudyParentView = folder === "Competitive" ? "study-competitive-view" :
        (folder === "Board/9th class" ? "study-class-9-view" : "study-class-10-view");

    var title = document.getElementById("studyContentTitle");
    var subtitle = document.getElementById("studyContentSubtitle");
    var list = document.getElementById("studyContentList");
    if (!title || !subtitle || !list) return;

    title.textContent = subjectTitle + " Study Material";
    subtitle.textContent = "Loading material...";
    list.innerHTML = '<div class="study-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading study material...</div>';
    switchSubView("study-content-view");

    var filePath = "Study%20material/" + folder.split("/").map(encodeURIComponent).join("/") + "/" + encodeURIComponent(fileName) + ".json";
    try {
        var response = await fetch(filePath, { cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        renderStudyMaterial(data, subjectTitle, list, subtitle);
    } catch (error) {
        subtitle.textContent = "Study material could not be loaded.";
        list.innerHTML = '<div class="study-empty"><i class="fa-solid fa-folder-open"></i><h3>Material not available</h3><p>Check that the JSON file exists at:<br><code>' + escapeStudyHtml("Study material/" + folder + "/" + fileName + ".json") + '</code></p></div>';
    }
}

/* -------------- STUDY PDF BOOK READER (PDF.js + realistic page flip) -------------- */
var currentStudyPdfParentView = "study-pdf-competitive-view";
var studyPdfDocument = null;
var studyPdfLoadToken = 0;
var studyPdfBookInstance = null;
var studyPdfRenderedPages = {};
var studyPdfRenderingPages = {};
var studyPdfCurrentPage = 1;

function openStudyPdf(pdfPath, title) {
    var titleEl = document.getElementById("studyPdfTitle");
    var bookEl = document.getElementById("studyPdfBook");
    var loadingEl = document.getElementById("studyPdfLoading");
    var errorEl = document.getElementById("studyPdfError");
    if (!titleEl || !bookEl || !loadingEl || !errorEl) return;

    var activeView = document.querySelector(".page-view.active");
    if (activeView && activeView.id !== "study-pdf-reader-view") currentStudyPdfParentView = activeView.id;

    var token = ++studyPdfLoadToken;
    destroyStudyPdfBook();
    studyPdfDocument = null;
    studyPdfCurrentPage = 1;
    studyPdfRenderedPages = {};
    studyPdfRenderingPages = {};
    titleEl.textContent = title || "Study PDF";
    bookEl.innerHTML = "";
    errorEl.hidden = true;
    errorEl.textContent = "";
    loadingEl.hidden = false;
    switchSubView("study-pdf-reader-view");

    if (!window.pdfjsLib) {
        showStudyPdfError("PDF reading library could not be loaded. Please check your internet connection and refresh the page.");
        return;
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    var cleanPath = String(pdfPath || "").split("#")[0];
    var task = window.pdfjsLib.getDocument({ url: cleanPath, withCredentials: false });
    task.promise.then(function (pdf) {
        if (token !== studyPdfLoadToken) { try { pdf.destroy(); } catch (e) {} return; }
        studyPdfDocument = pdf;
        buildStudyPdfBook(pdf, token);
    }).catch(function (error) {
        if (token !== studyPdfLoadToken) return;
        loadingEl.hidden = true;
        var message = error && error.name === "InvalidPDFException" ? "This file is not a valid PDF." : "PDF could not be loaded. Check the GitHub folder path, file name, and whether the PDF is uploaded.";
        showStudyPdfError(message);
        console.error("Study PDF load error:", error);
    });
}

function buildStudyPdfBook(pdf, token) {
    var bookEl = document.getElementById("studyPdfBook");
    var stage = document.getElementById("studyPdfBookStage");
    var loadingEl = document.getElementById("studyPdfLoading");
    if (!bookEl || !stage || !window.St || !window.St.PageFlip) {
        loadingEl.hidden = true;
        showStudyPdfError("Book page-turn effect could not be loaded. Please refresh with an internet connection.");
        return;
    }

    var stageWidth = Math.max(280, stage.clientWidth || window.innerWidth);
    var stageHeight = Math.max(360, stage.clientHeight || window.innerHeight - 150);
    var pageWidth = Math.min(620, Math.max(280, stageWidth));
    var pageHeight = Math.min(1100, stageHeight);
    var pages = document.createDocumentFragment();
    for (var i = 1; i <= pdf.numPages; i++) {
        var page = document.createElement("div");
        page.className = "pdf-book-page";
        page.setAttribute("data-density", i === 1 ? "hard" : "soft");
        page.setAttribute("data-page-number", String(i));
        var canvas = document.createElement("canvas");
        canvas.className = "pdf-book-canvas";
        canvas.setAttribute("aria-label", "PDF page " + i);
        page.appendChild(canvas);
        pages.appendChild(page);
    }
    bookEl.appendChild(pages);

    try {
        studyPdfBookInstance = new window.St.PageFlip(bookEl, {
            width: pageWidth,
            height: pageHeight,
            size: "stretch",
            minWidth: 280,
            maxWidth: 900,
            minHeight: 360,
            maxHeight: 1400,
            maxShadowOpacity: 0.75,
            showCover: true,
            mobileScrollSupport: true,
            usePortrait: true,
            startPage: 0,
            drawShadow: true,
            flippingTime: 500,
            swipeDistance: 50,
            clickEventForward: true,
            useMouseEvents: true,
            autoSize: true,
            showPageCorners: true,
            useCSS: true
        });
        studyPdfBookInstance.loadFromHTML(bookEl.querySelectorAll(".pdf-book-page"));
        studyPdfBookInstance.on("flip", function (event) {
            if (token !== studyPdfLoadToken) return;
            studyPdfCurrentPage = Number(event.data) + 1;
            renderStudyPdfNeighborhood(studyPdfCurrentPage, token);
        });
        studyPdfBookInstance.on("init", function () {
            if (token !== studyPdfLoadToken) return;
            renderStudyPdfNeighborhood(1, token);
        });
        loadingEl.hidden = true;
        renderStudyPdfNeighborhood(1, token);
        var hint = document.getElementById("studyPdfBookHint");
        if (hint) { hint.classList.add("visible"); window.setTimeout(function () { hint.classList.remove("visible"); }, 4200); }
    } catch (error) {
        loadingEl.hidden = true;
        showStudyPdfError("The book reader could not start. Please refresh the page and try again.");
        console.error("Study PDF book init error:", error);
    }
}

function renderStudyPdfNeighborhood(centerPage, token) {
    if (!studyPdfDocument) return;
    var total = studyPdfDocument.numPages;
    [centerPage - 1, centerPage, centerPage + 1, centerPage + 2].forEach(function (pageNumber) {
        if (pageNumber >= 1 && pageNumber <= total) renderStudyPdfBookPage(pageNumber, token);
    });
}

function renderStudyPdfBookPage(pageNumber, token) {
    if (!studyPdfDocument || studyPdfRenderedPages[pageNumber] || studyPdfRenderingPages[pageNumber]) return;
    var pageElement = document.querySelector('.pdf-book-page[data-page-number="' + pageNumber + '"]');
    var canvas = pageElement && pageElement.querySelector("canvas");
    if (!canvas) return;
    studyPdfRenderingPages[pageNumber] = true;
    studyPdfDocument.getPage(pageNumber).then(function (pdfPage) {
        if (token !== studyPdfLoadToken || !canvas.isConnected) return;
        var stage = document.getElementById("studyPdfBookStage");
        var availableWidth = Math.max(260, (stage ? stage.clientWidth : window.innerWidth) - 8);
        var availableHeight = Math.max(340, (stage ? stage.clientHeight : window.innerHeight) - 8);
        var base = pdfPage.getViewport({ scale: 1 });
        var fit = Math.min(availableWidth / base.width, availableHeight / base.height);
        var outputScale = Math.min(window.devicePixelRatio || 1, 1.6);
        var viewport = pdfPage.getViewport({ scale: fit * outputScale });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        var context = canvas.getContext("2d", { alpha: false });
        return pdfPage.render({ canvasContext: context, viewport: viewport }).promise;
    }).then(function () {
        if (token === studyPdfLoadToken) studyPdfRenderedPages[pageNumber] = true;
    }).catch(function (error) {
        if (error && error.name !== "RenderingCancelledException") console.error("PDF page render error:", error);
    }).finally(function () {
        delete studyPdfRenderingPages[pageNumber];
    });
}

function destroyStudyPdfBook() {
    if (studyPdfBookInstance) {
        try { studyPdfBookInstance.destroy(); } catch (e) {}
        studyPdfBookInstance = null;
    }
}

function showStudyPdfError(message) {
    var errorEl = document.getElementById("studyPdfError");
    if (errorEl) { errorEl.textContent = message; errorEl.hidden = false; }
}

function backFromStudyPdf() {
    studyPdfLoadToken++;
    destroyStudyPdfBook();
    if (studyPdfDocument) { try { studyPdfDocument.destroy(); } catch (e) {} }
    studyPdfDocument = null;
    studyPdfRenderedPages = {};
    studyPdfRenderingPages = {};
    var bookEl = document.getElementById("studyPdfBook");
    var loadingEl = document.getElementById("studyPdfLoading");
    var errorEl = document.getElementById("studyPdfError");
    if (bookEl) bookEl.innerHTML = "";
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) errorEl.hidden = true;
    switchSubView(currentStudyPdfParentView || "study-pdf-home-view");
}

function escapeStudyHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
}

function renderStudyMaterial(data, subjectTitle, container, subtitle) {
    var entries = Array.isArray(data) ? data : null;
    if (!entries && data && typeof data === "object") {
        var candidateKeys = ["chapters", "units", "topics", "materials", "notes", "lessons", "data", "content"];
        for (var i = 0; i < candidateKeys.length; i++) {
            if (Array.isArray(data[candidateKeys[i]])) { entries = data[candidateKeys[i]]; break; }
        }
        if (!entries) entries = [data];
    }
    if (!entries || entries.length === 0) {
        subtitle.textContent = "No study material has been added yet.";
        container.innerHTML = '<div class="study-empty"><i class="fa-solid fa-book-open"></i><h3>Coming Soon</h3><p>Study material will appear here when it is added.</p></div>';
        return;
    }

    subtitle.textContent = entries.length + " material item(s) available in " + subjectTitle + ".";
    container.innerHTML = "";
    entries.forEach(function (entry, index) {
        var card = document.createElement("article");
        card.className = "study-material-item";
        var heading = typeof entry === "string" ? entry : (entry.title || entry.name || entry.chapter || entry.topic || (subjectTitle + " Material " + (index + 1)));
        var body = typeof entry === "string" ? "" : (entry.description || entry.summary || entry.text || entry.content || entry.notes || "");
        var headingEl = document.createElement("h3");
        headingEl.textContent = heading;
        card.appendChild(headingEl);
        if (body && typeof body === "string") {
            var bodyEl = document.createElement("p");
            bodyEl.textContent = body;
            card.appendChild(bodyEl);
        }
        if (entry && typeof entry === "object") {
            Object.keys(entry).forEach(function (key) {
                if (["title", "name", "chapter", "topic", "description", "summary", "text", "content", "notes"].indexOf(key) !== -1) return;
                var value = entry[key];
                if (value == null || typeof value === "object") return;
                var detail = document.createElement("p");
                detail.className = "study-detail-line";
                var label = document.createElement("strong");
                label.textContent = key.replace(/[_-]/g, " ") + ": ";
                detail.appendChild(label);
                detail.appendChild(document.createTextNode(String(value)));
                card.appendChild(detail);
            });
        }
        container.appendChild(card);
    });
}

/* -------------- LAUNCH TEST -------------- */
function launchTest(subject) {
    var studentName = getStudentName();

    if (!studentName) {
        alert("Session expired! Please login again.");
        logout();
        return;
    }

    sessionStorage.setItem("student_name", studentName);
    localStorage.setItem("rjStudyUsername", studentName);
    window.open("test/index.html?subject=" + subject, "_blank");
}

/* -------------- CHAT SYSTEM -------------- */
var chatInterval = null;
var isChatOpen = false;
var lastChatHash = "";
var chatPollInFlight = false;

function setChatStatus(text) {
    var el = document.getElementById("chatStatus");
    if (el) el.textContent = text || "";
}

function toggleChat(forceState) {
    var overlay = document.getElementById("chatOverlay");
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
        setChatStatus("Syncing...");
        pollChat(true);
        chatInterval = setInterval(function () {
            if (!document.hidden) pollChat(false);
        }, 3000);
        setTimeout(function () {
            var input = document.getElementById("chatInput");
            if (input) input.focus();
        }, 150);
    } else {
        overlay.classList.remove("active");
        setChatStatus("");
    }
}

async function pollChat(forceRender) {
    var studentName = getStudentName();
    if (!studentName || !isChatOpen) return;
    if (chatPollInFlight) return;

    chatPollInFlight = true;
    try {
        var res = await fetch(WORKER_URL + "/api/chat?ts=" + Date.now(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ action: "get", studentName: studentName })
        });
        var data = await res.json();
        if (data && data.success) {
            var history = data.history || [];
            var hash = JSON.stringify(history);
            if (forceRender || hash !== lastChatHash) {
                lastChatHash = hash;
                renderChat(history);
            }
            setChatStatus("Live • " + history.length + "/3 • auto-clear 2 min");
        } else {
            setChatStatus("Sync failed");
        }
    } catch (e) {
        setChatStatus("Network error");
    } finally {
        chatPollInFlight = false;
    }
}

async function sendChatMessage() {
    var input = document.getElementById("chatInput");
    if (!input) return;

    var msg = input.value.trim();
    var studentName = getStudentName();
    if (!msg || !studentName) return;

    input.value = "";
    input.disabled = true;
    setChatStatus("Sending...");

    try {
        var res = await fetch(WORKER_URL + "/api/chat?ts=" + Date.now(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ studentName: studentName, message: msg })
        });
        var data = await res.json();
        if (data && data.success) {
            lastChatHash = JSON.stringify(data.history || []);
            renderChat(data.history || []);
            setChatStatus("Sent • " + (data.history || []).length + "/3");
        } else {
            input.value = msg;
            setChatStatus((data && data.error) || "Send failed");
        }
    } catch (e) {
        input.value = msg;
        setChatStatus("Network error");
    } finally {
        input.disabled = false;
        input.focus();
        setTimeout(function () {
            pollChat(true);
        }, 400);
    }
}

function renderChat(history) {
    var body = document.getElementById("chatBody");
    if (!body) return;

    body.innerHTML = "";
    if (!history || history.length === 0) {
        body.innerHTML =
            '<div style="text-align:center; color:' + "var(--text-dim)" + '; font-size:0.84rem; margin-top:30px; line-height:1.7;">' +
            '<i class="fa-solid fa-message" style="font-size:2rem; color:rgba(32,232,137,0.15); display:block; margin-bottom:12px;"></i>' +
            "Max 3 messages. Chat clears after 2 min idle.</div>";
        return;
    }

    history.forEach(function (msg) {
        var div = document.createElement("div");
        var sender = (msg.sender || "student").toLowerCase();
        div.className = "chat-message " + (sender === "admin" ? "admin" : "student");
        div.innerText = msg.text || "";
        body.appendChild(div);
    });

    body.scrollTop = body.scrollHeight;
}

/* -------------- INIT PORTAL -------------- */
function initPortal() {
    checkExistingSession();

    var form = document.getElementById("loginForm");
    if (form) {
        form.addEventListener("submit", handleLogin);
    }

    window.addEventListener("click", function (e) {
        if (!e.target.closest(".profile-menu-container")) closeAllDropdowns();
    });

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden && isChatOpen) pollChat(true);
    });
    window.addEventListener("focus", function () {
        if (isChatOpen) pollChat(true);
    });

    // Update greeting every minute
    setInterval(function () {
        var greetEl = document.getElementById("greetingText");
        if (greetEl && document.getElementById("dashboard-view").classList.contains("active")) {
            greetEl.innerText = getGreeting();
        }
    }, 60000);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPortal);
} else {
    initPortal();
}

window.handleLogin = handleLogin;
window.toggleProfileMenu = toggleProfileMenu;
window.logout = logout;
window.switchSubView = switchSubView;
window.goHome = goHome;
window.launchTest = launchTest;
window.openStudyMaterial = openStudyMaterial;
window.openStudyPdf = openStudyPdf;
window.backFromStudyPdf = backFromStudyPdf;
window.goBackFromStudyContent = goBackFromStudyContent;
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;

/* -------------- TERMINAL ANIMATION -------------- */
(function () {
    var terminal = document.getElementById("terminal-bg");
    if (!terminal) return;
    var logs = [
        "Initializing secure hypervisor environment...",
        "Loading root credentials for RJ_STUDY_ACADEMY_PORTAL...",
        "Establishing encrypted handshake... [SECURE]",
        "Injecting pathways: [ENGLISH, HINDI, MATH, SCIENCE]",
        "Status: Multi-Subject Test Engine v29.0 ONLINE."
    ];
    var li = 0,
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
