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

/* -------------- STUDY PDF SCROLL READER (PDF.js) -------------- */
var currentStudyPdfParentView = "study-pdf-competitive-view";
var studyPdfDocument = null;
var studyPdfLoadToken = 0;
var studyPdfLoadingTask = null;
var studyPdfZoom = 1;
var studyPdfPageInfo = [];
var studyPdfObserver = null;
var studyPdfActiveRenders = {};
var studyPdfTouchStartDistance = 0;
var studyPdfTouchStartZoom = 1;
var studyPdfTouchPreviewZoom = 1;

function openStudyPdf(pdfPath, title) {
    var titleEl = document.getElementById("studyPdfTitle");
    var bookEl = document.getElementById("studyPdfBook");
    var loadingEl = document.getElementById("studyPdfLoading");
    var errorEl = document.getElementById("studyPdfError");
    if (!titleEl || !bookEl || !loadingEl || !errorEl) return;
    var activeView = document.querySelector(".page-view.active");
    if (activeView && activeView.id !== "study-pdf-reader-view") currentStudyPdfParentView = activeView.id;
    var token = ++studyPdfLoadToken;
    cleanupStudyPdfResources();
    studyPdfZoom = 1;
    updateStudyPdfZoomLabel();
    titleEl.textContent = title || "Study PDF";
    bookEl.innerHTML = "";
    errorEl.hidden = true;
    errorEl.textContent = "";
    loadingEl.hidden = false;
    switchSubView("study-pdf-reader-view");
    if (!window.pdfjsLib) {
        showStudyPdfError("PDF reading library could not be loaded. Please check your internet connection and refresh the page.");
        loadingEl.hidden = true;
        return;
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    var task = window.pdfjsLib.getDocument({ url: String(pdfPath || "").split("#")[0], withCredentials: false });
    studyPdfLoadingTask = task;
    task.promise.then(function (pdf) {
        if (token !== studyPdfLoadToken) { try { pdf.destroy(); } catch (e) {} return; }
        studyPdfLoadingTask = null;
        studyPdfDocument = pdf;
        buildStudyPdfScrollDocument(pdf, token);
    }).catch(function (error) {
        if (token !== studyPdfLoadToken) return;
        studyPdfLoadingTask = null;
        loadingEl.hidden = true;
        showStudyPdfError(error && error.name === "InvalidPDFException" ? "This file is not a valid PDF." : "PDF could not be loaded. Check the GitHub folder path, file name, and whether the PDF is uploaded.");
        console.error("Study PDF load error:", error);
    });
}

function buildStudyPdfScrollDocument(pdf, token) {
    var container = document.getElementById("studyPdfBook");
    var stage = document.getElementById("studyPdfBookStage");
    var loading = document.getElementById("studyPdfLoading");
    if (!container || !stage) return;
    container.innerHTML = "";
    studyPdfPageInfo = [];
    var availableWidth = Math.max(280, stage.clientWidth - 28);
    var fragment = document.createDocumentFragment();
    var promises = [];
    for (var i = 1; i <= pdf.numPages; i++) {
        (function(pageNumber) {
            promises.push(pdf.getPage(pageNumber).then(function(page) {
                if (token !== studyPdfLoadToken) { page.cleanup(); return; }
                var base = page.getViewport({ scale: 1 });
                var fitScale = availableWidth / base.width;
                var info = { number: pageNumber, width: base.width, height: base.height, fitScale: fitScale, page: page };
                studyPdfPageInfo[pageNumber] = info;
                var wrapper = document.createElement("section");
                wrapper.className = "pdf-scroll-page";
                wrapper.dataset.pageNumber = String(pageNumber);
                wrapper.style.width = Math.round(base.width * fitScale) + "px";
                wrapper.style.height = Math.round(base.height * fitScale) + "px";
                var canvas = document.createElement("canvas");
                canvas.className = "pdf-scroll-canvas";
                canvas.setAttribute("aria-label", "PDF page " + pageNumber);
                var textLayer = document.createElement("div");
                textLayer.className = "textLayer";
                wrapper.appendChild(canvas);
                wrapper.appendChild(textLayer);
                fragment.appendChild(wrapper);
            }));
        })(i);
    }
    Promise.all(promises).then(function() {
        if (token !== studyPdfLoadToken) return;
        container.appendChild(fragment);
        loading.hidden = true;
        setupStudyPdfPageObserver(token);
        bindStudyPdfScrollZoom(stage, token);
        // Render the first page immediately; remaining pages render as they enter view.
        renderStudyPdfScrollPage(1, token);
    }).catch(function(error) {
        if (token !== studyPdfLoadToken) return;
        loading.hidden = true;
        showStudyPdfError("PDF pages could not be prepared. Please reload and try again.");
        console.error("PDF page setup error:", error);
    });
}

function setupStudyPdfPageObserver(token) {
    if (studyPdfObserver) studyPdfObserver.disconnect();
    var stage = document.getElementById("studyPdfBookStage");
    var pages = document.querySelectorAll("#studyPdfBook .pdf-scroll-page");
    if ("IntersectionObserver" in window) {
        studyPdfObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) renderStudyPdfScrollPage(Number(entry.target.dataset.pageNumber), token);
            });
        }, { root: stage, rootMargin: "900px 0px" });
        pages.forEach(function(page) { studyPdfObserver.observe(page); });
    } else {
        pages.forEach(function(page) { renderStudyPdfScrollPage(Number(page.dataset.pageNumber), token); });
    }
}

function renderStudyPdfScrollPage(pageNumber, token) {
    var info = studyPdfPageInfo[pageNumber];
    var wrapper = document.querySelector('#studyPdfBook .pdf-scroll-page[data-page-number="' + pageNumber + '"]');
    if (!info || !wrapper || wrapper.dataset.rendered === "true") return;
    if (studyPdfActiveRenders[pageNumber]) {
        wrapper.dataset.renderPending = "true";
        return;
    }
    wrapper.dataset.renderPending = "false";
    studyPdfActiveRenders[pageNumber] = true;
    var canvas = wrapper.querySelector("canvas");
    var textLayer = wrapper.querySelector(".textLayer");
    var cssScale = info.fitScale * studyPdfZoom;
    var dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 3);
    var renderScale = cssScale * dpr;
    var maxCanvasPixels = 16000000;
    renderScale = Math.min(renderScale, Math.sqrt(maxCanvasPixels / (info.width * info.height)));
    var viewport = info.page.getViewport({ scale: renderScale });
    var cssViewport = info.page.getViewport({ scale: cssScale });
    wrapper.style.width = Math.ceil(cssViewport.width) + "px";
    wrapper.style.height = Math.ceil(cssViewport.height) + "px";
    // Render off-screen first. Keep the previous bitmap visible until the new
    // high-resolution render completes, avoiding the black flash during zoom.
    var stagingCanvas = document.createElement("canvas");
    stagingCanvas.width = Math.ceil(viewport.width);
    stagingCanvas.height = Math.ceil(viewport.height);
    var renderTask = info.page.render({
        canvasContext: stagingCanvas.getContext("2d", { alpha: false }),
        viewport: viewport
    });
    studyPdfActiveRenders[pageNumber] = renderTask;
    renderTask.promise.then(function() {
        if (token !== studyPdfLoadToken || !canvas.isConnected) return;
        canvas.width = stagingCanvas.width;
        canvas.height = stagingCanvas.height;
        canvas.style.width = cssViewport.width + "px";
        canvas.style.height = cssViewport.height + "px";
        canvas.getContext("2d", { alpha: false }).drawImage(stagingCanvas, 0, 0);
        textLayer.innerHTML = "";
        textLayer.style.width = cssViewport.width + "px";
        textLayer.style.height = cssViewport.height + "px";
        if (window.pdfjsLib.renderTextLayer) {
            return info.page.getTextContent().then(function(textContent) {
                if (token !== studyPdfLoadToken || !textLayer.isConnected) return;
                var textTask = window.pdfjsLib.renderTextLayer({
                    textContent: textContent, container: textLayer,
                    viewport: cssViewport, textDivs: []
                });
                return textTask.promise;
            });
        }
    }).then(function() {
        if (token === studyPdfLoadToken) wrapper.dataset.rendered = "true";
    }).catch(function(error) {
        if (error && error.name !== "RenderingCancelledException" && error.name !== "AbortException") {
            console.error("PDF page render error:", error);
        }
    }).finally(function() {
        delete studyPdfActiveRenders[pageNumber];
        if (token === studyPdfLoadToken && wrapper.dataset.renderPending === "true") {
            wrapper.dataset.renderPending = "false";
            renderStudyPdfScrollPage(pageNumber, token);
        }
    });
}

function setStudyPdfZoom(value, focalX, focalY) {
    var next = Math.max(0.75, Math.min(3, Math.round(value * 100) / 100));
    if (Math.abs(next - studyPdfZoom) < 0.01 || !studyPdfDocument) return;
    var oldZoom = studyPdfZoom;
    var stage = document.getElementById("studyPdfBookStage");
    var stageRect = stage ? stage.getBoundingClientRect() : null;
    var localX = stageRect ? (focalX == null ? stageRect.width / 2 : focalX - stageRect.left) : 0;
    var localY = stageRect ? (focalY == null ? stageRect.height / 2 : focalY - stageRect.top) : 0;
    var contentX = stage ? stage.scrollLeft + localX : 0;
    var contentY = stage ? stage.scrollTop + localY : 0;
    var ratio = next / oldZoom;
    studyPdfZoom = next;
    updateStudyPdfZoomLabel();

    var pages = document.querySelectorAll("#studyPdfBook .pdf-scroll-page");
    pages.forEach(function(wrapper) {
        var n = Number(wrapper.dataset.pageNumber);
        wrapper.dataset.rendered = "false";
        var oldTask = studyPdfActiveRenders[n];
        if (oldTask && oldTask.cancel) {
            wrapper.dataset.renderPending = "true";
            try { oldTask.cancel(); } catch (e) {}
        }
        var info = studyPdfPageInfo[n];
        if (info) {
            wrapper.style.width = Math.ceil(info.width * info.fitScale * next) + "px";
            wrapper.style.height = Math.ceil(info.height * info.fitScale * next) + "px";
        }
    });

    // Keep the exact point under the user's fingers stationary while zooming.
    if (stage) {
        requestAnimationFrame(function() {
            stage.scrollLeft = Math.max(0, contentX * ratio - localX);
            stage.scrollTop = Math.max(0, contentY * ratio - localY);
        });
    }
    // Re-render visible and nearby pages. Off-screen pages are rendered by
    // IntersectionObserver when the reader scrolls to them.
    requestAnimationFrame(function() {
        pages.forEach(function(wrapper) {
            var r = wrapper.getBoundingClientRect();
            var sr = stage.getBoundingClientRect();
            if (r.bottom >= sr.top - 700 && r.top <= sr.bottom + 700) {
                renderStudyPdfScrollPage(Number(wrapper.dataset.pageNumber), studyPdfLoadToken);
            }
        });
    });
}

function updateStudyPdfZoomLabel() {
    var label = document.getElementById("studyPdfZoomLabel");
    if (label) label.textContent = Math.round(studyPdfZoom * 100) + "%";
}

function bindStudyPdfZoomButtons() {
    var plus = document.getElementById("studyPdfZoomIn");
    var minus = document.getElementById("studyPdfZoomOut");
    var fit = document.getElementById("studyPdfFit");
    if (plus && plus.dataset.bound !== "true") { plus.dataset.bound = "true"; plus.addEventListener("click", function() { setStudyPdfZoom(studyPdfZoom + 0.2); }); }
    if (minus && minus.dataset.bound !== "true") { minus.dataset.bound = "true"; minus.addEventListener("click", function() { setStudyPdfZoom(studyPdfZoom - 0.2); }); }
    if (fit && fit.dataset.bound !== "true") { fit.dataset.bound = "true"; fit.addEventListener("click", function() { setStudyPdfZoom(1); }); }
}

function bindStudyPdfScrollZoom(stage, token) {
    if (!stage || stage.dataset.scrollZoomBound === "true") return;
    stage.dataset.scrollZoomBound = "true";
    var pinchCenterX = 0, pinchCenterY = 0;
    stage.addEventListener("wheel", function(event) {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        setStudyPdfZoom(studyPdfZoom * (event.deltaY < 0 ? 1.12 : 0.89), event.clientX, event.clientY);
    }, { passive: false });
    stage.addEventListener("touchstart", function(event) {
        if (event.touches.length === 2) {
            var a = event.touches[0], b = event.touches[1];
            studyPdfTouchStartDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            studyPdfTouchStartZoom = studyPdfZoom;
            studyPdfTouchPreviewZoom = studyPdfZoom;
            pinchCenterX = (a.clientX + b.clientX) / 2;
            pinchCenterY = (a.clientY + b.clientY) / 2;
        }
    }, { passive: true });
    stage.addEventListener("touchmove", function(event) {
        if (event.touches.length !== 2 || !studyPdfTouchStartDistance) return;
        event.preventDefault();
        var a = event.touches[0], b = event.touches[1];
        var distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        studyPdfTouchPreviewZoom = Math.max(0.75, Math.min(3,
            studyPdfTouchStartZoom * distance / studyPdfTouchStartDistance));
        pinchCenterX = (a.clientX + b.clientX) / 2;
        pinchCenterY = (a.clientY + b.clientY) / 2;
        var book = document.getElementById("studyPdfBook");
        if (book) {
            var rect = book.getBoundingClientRect();
            book.style.transformOrigin =
                (pinchCenterX - rect.left) + "px " + (pinchCenterY - rect.top) + "px";
            book.style.transform = "scale(" + (studyPdfTouchPreviewZoom / studyPdfZoom) + ")";
        }
    }, { passive: false });
    function finishPinch() {
        if (!studyPdfTouchStartDistance) return;
        var book = document.getElementById("studyPdfBook");
        if (book) { book.style.transform = ""; book.style.transformOrigin = ""; }
        var finalZoom = studyPdfTouchPreviewZoom;
        studyPdfTouchStartDistance = 0;
        setStudyPdfZoom(finalZoom, pinchCenterX, pinchCenterY);
    }
    stage.addEventListener("touchend", function(event) {
        if (event.touches.length < 2) finishPinch();
    }, { passive: true });
    stage.addEventListener("touchcancel", finishPinch, { passive: true });
}

function cleanupStudyPdfResources() {
    if (studyPdfObserver) { studyPdfObserver.disconnect(); studyPdfObserver = null; }
    Object.keys(studyPdfActiveRenders).forEach(function(key) {
        var task = studyPdfActiveRenders[key];
        if (task && task.cancel) { try { task.cancel(); } catch (e) {} }
    });
    studyPdfActiveRenders = {};
    if (studyPdfLoadingTask) {
        try { var result = studyPdfLoadingTask.destroy(); if (result && result.catch) result.catch(function() {}); } catch (e) {}
        studyPdfLoadingTask = null;
    }
    if (studyPdfDocument) {
        try { var destroyResult = studyPdfDocument.destroy(); if (destroyResult && destroyResult.catch) destroyResult.catch(function() {}); } catch (e) {}
        studyPdfDocument = null;
    }
    studyPdfPageInfo = [];
}

function showStudyPdfError(message) {
    var errorEl = document.getElementById("studyPdfError");
    if (errorEl) { errorEl.textContent = message; errorEl.hidden = false; }
}

function backFromStudyPdf() {
    studyPdfLoadToken++;
    cleanupStudyPdfResources();
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
