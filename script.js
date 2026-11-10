/* ============================================
   RJ STUDY ACADEMY - PORTAL SCRIPT
   ============================================ */

// ---- CONSTANTS ----
var VALID_PASSWORDS = ["04783", "padhlo", "4181723"];
var WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";

// ---- PDF STATE ----
var studyPdfDoc = null;
var studyPdfZoom = 1;
var studyPdfBaseWidth = 0;
var studyPdfPageCount = 0;
var studyPdfRenderDebounce = null;
var studyPdfIsPinching = false;

var pinchState = {
    active: false,
    startDist: 0,
    startZoom: 1,
    contentX: 0,
    contentY: 0,
    viewportX: 0,
    viewportY: 0
};

// =============================================
//  LOGIN
// =============================================
function handleLogin(e) {
    e.preventDefault();
    var username = document.getElementById("usernameInput").value.trim();
    var password = document.getElementById("passwordInput").value.trim();
    var errorMsg = document.getElementById("errorMsg");

    if (!username) {
        errorMsg.textContent = "Username daalo bhai!";
        return;
    }
    if (!VALID_PASSWORDS.includes(password)) {
        errorMsg.textContent = "Password galat hai!";
        return;
    }

    errorMsg.textContent = "";
    var now = new Date().toISOString();
    localStorage.setItem("rj_student_name", username);
    localStorage.setItem("rj_login_time", now);
    localStorage.setItem("rjStudyUsername", username);
    sessionStorage.setItem("student_name", username);

    activateDashboard(username);
}

function checkExistingSession() {
    var savedName = localStorage.getItem("rj_student_name");
    if (savedName) {
        activateDashboard(savedName);
    }
}

function getGreeting() {
    var h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    if (h < 21) return "Good Evening";
    return "Good Night";
}

function activateDashboard(name) {
    document.getElementById("login-view").style.display = "none";
    document.getElementById("dashboard-view").style.display = "block";
    document.getElementById("dashboard-view").classList.add("active");
    document.getElementById("displayUsername").textContent = name;
    document.getElementById("greetingText").textContent = getGreeting() + ", " + name + "!";
}

// =============================================
//  NAVIGATION
// =============================================
function hideAllViews() {
    document.querySelectorAll(".sub-view").forEach(function(v) {
        v.classList.remove("active");
    });
}

function toggleProfileMenu() {
    var menu = document.getElementById("profileMenu");
    if (menu) menu.classList.toggle("show");
}

function closeAllDropdowns() {
    var menu = document.getElementById("profileMenu");
    if (menu) menu.classList.remove("show");
}

function logout() {
    localStorage.removeItem("rj_student_name");
    localStorage.removeItem("rj_login_time");
    localStorage.removeItem("rjStudyUsername");
    sessionStorage.removeItem("student_name");
    document.getElementById("dashboard-view").style.display = "none";
    document.getElementById("dashboard-view").classList.remove("active");
    document.getElementById("login-view").style.display = "flex";
    document.getElementById("usernameInput").value = "";
    document.getElementById("passwordInput").value = "";
    document.getElementById("errorMsg").textContent = "";
    hideAllViews();
}

function switchSubView(viewId) {
    hideAllViews();
    var view = document.getElementById(viewId);
    if (view) view.classList.add("active");
}

function goHome() {
    hideAllViews();
}

function getStudentName() {
    return localStorage.getItem("rj_student_name") ||
           sessionStorage.getItem("student_name") ||
           "Student";
}

// =============================================
//  STUDY MATERIAL
// =============================================
function openStudyMaterial() {
    switchSubView("study-view");
    renderStudyMaterial();
}

function renderStudyMaterial() {
    var container = document.getElementById("studyMaterialContent");
    if (!container) return;
    container.innerHTML = '<p style="padding:20px;color:#888;text-align:center;">Loading study material...</p>';

    fetch(WORKER_URL + "/api/study-material")
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.html) {
                container.innerHTML = data.html;
            } else {
                container.innerHTML = '<p style="padding:20px;color:#888;text-align:center;">Koi material nahi mila abhi.</p>';
            }
        })
        .catch(function() {
            container.innerHTML = '<p style="padding:20px;color:#e74c3c;text-align:center;">Load nahi ho paaya. Retry karo.</p>';
        });
}

function escapeStudyHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// =============================================
//  PDF READER — SMOOTH ZOOM (Google Drive style)
// =============================================

function openStudyPdf(url) {
    switchSubView("study-pdf-view");
    var stage = document.getElementById("studyPdfStage");
    var book = document.getElementById("studyPdfBook");
    if (!stage || !book) return;

    book.innerHTML = '<p style="color:#aaa;padding:40px;text-align:center;">PDF load ho raha hai...</p>';
    studyPdfZoom = 1;
    studyPdfDoc = null;
    updatePdfZoomLabel();

    if (typeof pdfjsLib === "undefined") {
        book.innerHTML = '<p style="color:#e74c3c;padding:40px;text-align:center;">PDF.js load nahi hua.</p>';
        return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    pdfjsLib.getDocument(url).promise.then(function(pdf) {
        studyPdfDoc = pdf;
        studyPdfPageCount = pdf.numPages;
        book.innerHTML = "";

        pdf.getPage(1).then(function(page) {
            var vp = page.getViewport({ scale: 1 });
            var stageW = stage.clientWidth - 32;
            studyPdfBaseWidth = stageW;
            studyPdfZoom = 1;

            for (var i = 1; i <= studyPdfPageCount; i++) {
                var pageDiv = document.createElement("div");
                pageDiv.className = "pdf-scroll-page";
                pageDiv.dataset.page = i;
                pageDiv.style.width = studyPdfBaseWidth + "px";
                var aspect = vp.height / vp.width;
                pageDiv.style.height = Math.round(studyPdfBaseWidth * aspect) + "px";

                var canvas = document.createElement("canvas");
                canvas.className = "pdf-scroll-canvas";
                pageDiv.appendChild(canvas);

                var textDiv = document.createElement("div");
                textDiv.className = "textLayer";
                pageDiv.appendChild(textDiv);

                book.appendChild(pageDiv);
                renderStudyPdfScrollPage(i);
            }

            setupStudyPdfPinch();
            setupStudyPdfWheel();
            setupStudyPdfButtons();
        });
    }).catch(function() {
        book.innerHTML = '<p style="color:#e74c3c;padding:40px;text-align:center;">PDF load nahi ho paaya.</p>';
    });
}

/* --- Render single page (off-screen staging to avoid black flash) --- */
function renderStudyPdfScrollPage(pageNum) {
    if (!studyPdfDoc) return;
    if (studyPdfIsPinching) return;

    var pageDiv = document.querySelector('.pdf-scroll-page[data-page="' + pageNum + '"]');
    if (!pageDiv) return;
    var canvas = pageDiv.querySelector(".pdf-scroll-canvas");
    var textDiv = pageDiv.querySelector(".textLayer");
    if (!canvas) return;

    var existing = pageDiv.dataset.rendering;
    if (existing === "active") return;
    pageDiv.dataset.rendering = "active";

    var w = studyPdfBaseWidth * studyPdfZoom;
    var dpr = window.devicePixelRatio || 1;

    studyPdfDoc.getPage(pageNum).then(function(page) {
        var vp = page.getViewport({ scale: 1 });
        var scale = w / vp.width;
        var scaledVP = page.getViewport({ scale: scale * dpr });
        var aspect = vp.height / vp.width;
        var displayH = Math.round(w * aspect);

        pageDiv.style.width = Math.round(w) + "px";
        pageDiv.style.height = displayH + "px";

        // Off-screen staging canvas
        var staging = document.createElement("canvas");
        staging.width = scaledVP.width;
        staging.height = scaledVP.height;
        var sCtx = staging.getContext("2d");

        page.render({ canvasContext: sCtx, viewport: scaledVP }).promise.then(function() {
            canvas.width = scaledVP.width;
            canvas.height = scaledVP.height;
            canvas.style.width = Math.round(w) + "px";
            canvas.style.height = displayH + "px";
            var ctx = canvas.getContext("2d");
            ctx.drawImage(staging, 0, 0);
            staging = null;

            if (textDiv) {
                textDiv.innerHTML = "";
                textDiv.style.width = Math.round(w) + "px";
                textDiv.style.height = displayH + "px";
                page.getTextContent().then(function(tc) {
                    var textVP = page.getViewport({ scale: scale });
                    tc.items.forEach(function(item) {
                        var tx = pdfjsLib.Util.transform(textVP.transform, item.transform);
                        var span = document.createElement("span");
                        span.textContent = item.str;
                        span.style.left = tx[4] + "px";
                        span.style.top = (textVP.height - tx[5] - (item.height * scale * 0.7)) + "px";
                        span.style.fontSize = (item.height * scale * 0.85) + "px";
                        span.style.fontFamily = "sans-serif";
                        textDiv.appendChild(span);
                    });
                });
            }
            pageDiv.dataset.rendering = "done";
        }).catch(function() {
            pageDiv.dataset.rendering = "done";
        });
    });
}

/* --- Debounced re-render all pages --- */
function schedulePdfRerender(delay) {
    if (studyPdfRenderDebounce) clearTimeout(studyPdfRenderDebounce);
    studyPdfRenderDebounce = setTimeout(function() {
        if (!studyPdfDoc || studyPdfIsPinching) return;
        for (var i = 1; i <= studyPdfPageCount; i++) {
            var pd = document.querySelector('.pdf-scroll-page[data-page="' + i + '"]');
            if (pd) pd.dataset.rendering = "";
            renderStudyPdfScrollPage(i);
        }
    }, delay || 180);
}

/* --- Update zoom label --- */
function updatePdfZoomLabel() {
    var lbl = document.getElementById("studyPdfZoomLabel");
    if (lbl) lbl.textContent = Math.round(studyPdfZoom * 100) + "%";
}

/* =============================================
   PINCH ZOOM — Focal-point locked, zero drift
   ============================================= */
function setupStudyPdfPinch() {
    var stage = document.getElementById("studyPdfStage");
    var book = document.getElementById("studyPdfBook");
    if (!stage || !book) return;

    // Remove old listeners by cloning (clean slate)
    var newStage = stage.cloneNode(true);
    stage.parentNode.replaceChild(newStage, stage);
    stage = newStage;
    book = stage.querySelector("#studyPdfBook");
    if (!book) return;

    function getTouchDist(t1, t2) {
        var dx = t1.clientX - t2.clientX;
        var dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function onPinchStart(t1, t2) {
        studyPdfIsPinching = true;
        pinchState.active = true;
        pinchState.startZoom = studyPdfZoom;

        var stageRect = stage.getBoundingClientRect();
        var mx = (t1.clientX + t2.clientX) / 2 - stageRect.left;
        var my = (t1.clientY + t2.clientY) / 2 - stageRect.top;

        pinchState.viewportX = mx;
        pinchState.viewportY = my;
        pinchState.contentX = mx + stage.scrollLeft;
        pinchState.contentY = my + stage.scrollTop;
        pinchState.startDist = getTouchDist(t1, t2);

        // Freeze scroll & kill transitions
        stage.style.overflow = "hidden";
        stage.style.touchAction = "none";
        book.classList.add("pinching");
        book.style.transformOrigin = "0 0";
    }

    function onPinchMove(t1, t2) {
        if (!pinchState.active) return;

        var dist = getTouchDist(t1, t2);
        var ratio = dist / pinchState.startDist;
        var newZoom = pinchState.startZoom * ratio;
        newZoom = Math.max(0.5, Math.min(4, newZoom));

        var r = newZoom / pinchState.startZoom;
        var cx = pinchState.contentX;
        var cy = pinchState.contentY;

        // Focal-locked transform: point (cx,cy) stays at viewport (vx,vy)
        var tx = cx * (1 - r);
        var ty = cy * (1 - r);

        book.style.transform = "translate3d(" + tx + "px," + ty + "px,0) scale(" + r + ")";
        pinchState._currentR = r;
    }

    function onPinchEnd() {
        if (!pinchState.active) return;
        pinchState.active = false;
        studyPdfIsPinching = false;

        var r = pinchState._currentR || 1;
        var cx = pinchState.contentX;
        var cy = pinchState.contentY;
        var mx = pinchState.viewportX;
        var my = pinchState.viewportY;

        var newZoom = pinchState.startZoom * r;
        newZoom = Math.max(0.5, Math.min(4, newZoom));
        studyPdfZoom = newZoom;
        updatePdfZoomLabel();

        // Single-frame bake: remove transform → set real sizes → set scroll
        book.style.transform = "";
        book.classList.remove("pinching");

        // Set real page sizes (no transition during bake)
        var pages = book.querySelectorAll(".pdf-scroll-page");
        pages.forEach(function(p) {
            var baseW = studyPdfBaseWidth;
            var w = baseW * studyPdfZoom;
            var aspect = parseFloat(p.style.height) / parseFloat(p.style.width) || 1.414;
            p.style.width = Math.round(w) + "px";
            p.style.height = Math.round(w * aspect) + "px";
            var c = p.querySelector(".pdf-scroll-canvas");
            if (c) {
                c.style.width = Math.round(w) + "px";
                c.style.height = Math.round(w * aspect) + "px";
            }
            var t = p.querySelector(".textLayer");
            if (t) {
                t.style.width = Math.round(w) + "px";
                t.style.height = Math.round(w * aspect) + "px";
            }
        });

        // Restore scroll & overflow in next frame
        requestAnimationFrame(function() {
            stage.scrollLeft = Math.max(0, cx * r - mx);
            stage.scrollTop = Math.max(0, cy * r - my);
            stage.style.overflow = "";
            stage.style.touchAction = "";

            // Sharp re-render after layout settles
            schedulePdfRerender(120);
        });

        pinchState._currentR = 1;
    }

    // Touch event handlers
    stage.addEventListener("touchstart", function(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            onPinchStart(e.touches[0], e.touches[1]);
        }
    }, { passive: false });

    stage.addEventListener("touchmove", function(e) {
        if (e.touches.length === 2 && pinchState.active) {
            e.preventDefault();
            onPinchMove(e.touches[0], e.touches[1]);
        }
    }, { passive: false, desynchronized: true });

    stage.addEventListener("touchend", function(e) {
        if (pinchState.active && e.touches.length < 2) {
            onPinchEnd();
        }
    }, { passive: true });

    stage.addEventListener("touchcancel", function() {
        if (pinchState.active) onPinchEnd();
    }, { passive: true });
}

/* =============================================
   WHEEL ZOOM — ultra-smooth fine steps
   ============================================= */
function setupStudyPdfWheel() {
    var stage = document.getElementById("studyPdfStage");
    if (!stage) return;

    var wheelAccum = 0;
    var wheelTimer = null;

    stage.addEventListener("wheel", function(e) {
        if (!studyPdfDoc) return;
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();

            wheelAccum += e.deltaY;

            if (wheelTimer) clearTimeout(wheelTimer);
            wheelTimer = setTimeout(function() {
                var step = 1.035;
                if (wheelAccum > 0) {
                    studyPdfZoom = Math.max(0.5, studyPdfZoom / step);
                } else {
                    studyPdfZoom = Math.min(4, studyPdfZoom * step);
                }
                wheelAccum = 0;
                applyStudyPdfZoomSmooth();
            }, 16);
        }
    }, { passive: false });
}

/* --- Smooth zoom apply (for wheel & buttons) --- */
function applyStudyPdfZoomSmooth() {
    if (!studyPdfDoc) return;
    var stage = document.getElementById("studyPdfStage");
    var book = document.getElementById("studyPdfBook");
    if (!stage || !book) return;

    updatePdfZoomLabel();

    var oldZoom = parseFloat(book.dataset.prevZoom) || 1;
    var ratio = studyPdfZoom / oldZoom;
    book.dataset.prevZoom = studyPdfZoom;

    // Keep center of viewport stable
    var cx = stage.scrollLeft + stage.clientWidth / 2;
    var cy = stage.scrollTop + stage.clientHeight / 2;

    var pages = book.querySelectorAll(".pdf-scroll-page");
    pages.forEach(function(p) {
        var w = studyPdfBaseWidth * studyPdfZoom;
        var curW = parseFloat(p.style.width) || w;
        var aspect = parseFloat(p.style.height) / curW || 1.414;
        p.style.width = Math.round(w) + "px";
        p.style.height = Math.round(w * aspect) + "px";
        var c = p.querySelector(".pdf-scroll-canvas");
        if (c) {
            c.style.width = Math.round(w) + "px";
            c.style.height = Math.round(w * aspect) + "px";
        }
        var t = p.querySelector(".textLayer");
        if (t) {
            t.style.width = Math.round(w) + "px";
            t.style.height = Math.round(w * aspect) + "px";
        }
    });

    // Adjust scroll to keep center point stable
    requestAnimationFrame(function() {
        stage.scrollLeft = Math.max(0, cx * ratio - stage.clientWidth / 2);
        stage.scrollTop = Math.max(0, cy * ratio - stage.clientHeight / 2);
        schedulePdfRerender(200);
    });
}

/* =============================================
   BUTTON ZOOM
   ============================================= */
function setupStudyPdfButtons() {
    var btnIn = document.getElementById("studyPdfZoomIn");
    var btnOut = document.getElementById("studyPdfZoomOut");
    var btnFit = document.getElementById("studyPdfFit");

    if (btnIn) {
        btnIn.onclick = function() {
            studyPdfZoom = Math.min(4, studyPdfZoom + 0.12);
            applyStudyPdfZoomSmooth();
        };
    }
    if (btnOut) {
        btnOut.onclick = function() {
            studyPdfZoom = Math.max(0.5, studyPdfZoom - 0.12);
            applyStudyPdfZoomSmooth();
        };
    }
    if (btnFit) {
        btnFit.onclick = function() {
            studyPdfZoom = 1;
            applyStudyPdfZoomSmooth();
        };
    }
}

// =============================================
//  TEST
// =============================================
function launchTest() {
    switchSubView("test-view");
    var container = document.getElementById("testContent");
    if (!container) return;
    container.innerHTML = '<p style="padding:20px;color:#888;text-align:center;">Test load ho raha hai...</p>';

    fetch(WORKER_URL + "/api/test")
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.questions) {
                var html = '<h3>Practice Test</h3>';
                data.questions.forEach(function(q, idx) {
                    html += '<div class="test-question">';
                    html += '<p>' + (idx + 1) + '. ' + escapeStudyHtml(q.question) + '</p>';
                    (q.options || []).forEach(function(opt) {
                        html += '<div class="test-option" onclick="this.classList.toggle(\'selected\')">' +
                                escapeStudyHtml(opt) + '</div>';
                    });
                    html += '</div>';
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = '<p style="padding:20px;color:#888;text-align:center;">Koi test nahi mila.</p>';
            }
        })
        .catch(function() {
            container.innerHTML = '<p style="padding:20px;color:#e74c3c;text-align:center;">Test load nahi ho paaya.</p>';
        });
}

// =============================================
//  CHAT SYSTEM
// =============================================
var chatPollInterval = null;

function toggleChat() {
    var panel = document.getElementById("chatPanel");
    if (!panel) return;
    var isOpen = panel.classList.contains("open");
    if (isOpen) {
        panel.classList.remove("open");
        if (chatPollInterval) { clearInterval(chatPollInterval); chatPollInterval = null; }
    } else {
        panel.classList.add("open");
        pollChat();
        chatPollInterval = setInterval(pollChat, 4000);
    }
}

function pollChat() {
    var name = getStudentName();
    fetch(WORKER_URL + "/api/chat?user=" + encodeURIComponent(name))
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.messages) {
                renderChat(data.messages);
            }
        })
        .catch(function() {});
}

function sendChatMessage() {
    var input = document.getElementById("chatInput");
    if (!input) return;
    var msg = input.value.trim();
    if (!msg) return;
    var name = getStudentName();

    fetch(WORKER_URL + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: name, message: msg })
    })
    .then(function() {
        input.value = "";
        pollChat();
    })
    .catch(function() {});
}

function renderChat(messages) {
    var container = document.getElementById("chatMessages");
    if (!container) return;
    var name = getStudentName();
    var html = "";
    messages.forEach(function(m) {
        var isMine = (m.user === name);
        var cls = isMine ? "sent" : "received";
        var time = m.time ? new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
        html += '<div class="chat-msg ' + cls + '">';
        if (!isMine) html += '<strong style="font-size:.72rem;color:#0f3460;">' + escapeStudyHtml(m.user) + '</strong><br>';
        html += escapeStudyHtml(m.message);
        html += '<div class="msg-time">' + time + '</div>';
        html += '</div>';
    });
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

function setChatStatus(text) {
    var el = document.getElementById("chatStatus");
    if (el) el.textContent = text;
}

// =============================================
//  INIT
// =============================================
function initPortal() {
    checkExistingSession();

    var loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    // Close dropdowns on outside click
    document.addEventListener("click", function(e) {
        if (!e.target.closest(".profile-btn") && !e.target.closest(".profile-menu")) {
            closeAllDropdowns();
        }
    });
}

// ---- Window exports ----
window.handleLogin = handleLogin;
window.logout = logout;
window.switchSubView = switchSubView;
window.goHome = goHome;
window.toggleProfileMenu = toggleProfileMenu;
window.closeAllDropdowns = closeAllDropdowns;
window.openStudyMaterial = openStudyMaterial;
window.openStudyPdf = openStudyPdf;
window.launchTest = launchTest;
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;

// ---- Boot ----
document.addEventListener("DOMContentLoaded", initPortal);

// ---- Terminal Animation (cosmetic) ----
(function() {
    var term = document.getElementById("terminalText");
    if (!term) return;
    var lines = [
        "> Initializing RJ Study Portal...",
        "> Loading modules...",
        "> Connecting to server...",
        "> Ready. Welcome!"
    ];
    var li = 0;
    function typeLine() {
        if (li >= lines.length) return;
        var line = lines[li];
        var ci = 0;
        var span = document.createElement("div");
        term.appendChild(span);
        function typeChar() {
            if (ci < line.length) {
                span.textContent += line[ci];
                ci++;
                setTimeout(typeChar, 25);
            } else {
                li++;
                setTimeout(typeLine, 300);
            }
        }
        typeChar();
    }
    typeLine();
})();
