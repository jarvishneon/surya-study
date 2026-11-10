// RJ STUDY ACADEMY - script.js v29.0 (Pro Design Update)
// Chat: poll sync + max 3 msgs + 2 min auto wipe (server)

const VALID_PASSWORDS = ["04783", "padhlo", "4181723"];
const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";
const PAGE_STATE_KEY = "rj_portal_page_state_v1";
var isRestoringPortalState = false;
var currentStudyMaterialState = null;
var currentStudyPdfPath = "";
var currentStudyPdfTitle = "";
var pendingPdfRestore = null;
var worksheetManifest = null;
var currentWorksheetCategory = "competitive";
var currentWorksheetSubject = "";
var currentWorksheetTitle = "Worksheets";
var currentWorksheetParentView = "worksheets-competitive-view";
var worksheetZoom = 1;
var worksheetSaveTimer = null;

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

        localStorage.removeItem(PAGE_STATE_KEY);
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
            restorePortalPageState(savedName);
            return true;
        }
        localStorage.removeItem("rj_student_name");
        localStorage.removeItem("rj_login_time");
        localStorage.removeItem(PAGE_STATE_KEY);
    } else {
        localStorage.removeItem(PAGE_STATE_KEY);
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

    ["profileInitial", "profileInitial2", "profileInitial3", "profileInitial4", "profileInitial5"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.innerText = initial;
    });

    document.querySelectorAll(".dropdown-avatar").forEach(function (el) {
        el.innerText = initial;
    });

    var greetEl = document.getElementById("greetingText");
    if (greetEl) greetEl.innerText = getGreeting();

    hideAllViews();
    var dash = document.getElementById("dashboard-view");
    if (dash) dash.classList.add("active");
}

function hideAllViews() {
    ["login-view", "dashboard-view", "competitive-view", "boards-view", "notifications-view", "subjects-view", "study-material-view", "study-competitive-view", "study-board-view", "study-class-9-view", "study-class-10-view", "study-content-view", "study-pdf-home-view", "study-pdf-competitive-view", "study-pdf-board-view", "study-pdf-class-9-view", "study-pdf-class-10-view", "study-pdf-reader-view", "worksheets-home-view", "worksheets-competitive-view", "worksheets-board-view", "worksheets-class-9-view", "worksheets-class-10-view", "worksheets-reader-view"].forEach(function (id) {
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
    localStorage.removeItem(PAGE_STATE_KEY);
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
    savePortalPageState();
}

function goHome() {
    closeAllDropdowns();
    hideAllViews();
    var dash = document.getElementById("dashboard-view");
    if (dash) dash.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    savePortalPageState();
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

async function openStudyMaterial(folder, fileName, subjectTitle, isRestore) {
    currentStudyMaterialState = { folder: folder, fileName: fileName, subjectTitle: subjectTitle };
    currentStudyParentView = folder === "Competitive" ? "study-competitive-view" :
        (folder === "Board/9th class" ? "study-class-9-view" : "study-class-10-view");

    var title = document.getElementById("studyContentTitle");
    var subtitle = document.getElementById("studyContentSubtitle");
    var list = document.getElementById("studyContentList");
    if (!title || !subtitle || !list) return;

    title.textContent = subjectTitle + " Study Material";
    subtitle.textContent = "Loading material...";
    list.innerHTML = '<div class="study-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading study material...</div>';
    if (isRestore) {
        isRestoringPortalState = true;
        hideAllViews();
        document.getElementById("study-content-view").classList.add("active");
        isRestoringPortalState = false;
    } else {
        switchSubView("study-content-view");
    }

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
var studyPdfRenderDebounce = null;
var studyPdfIsPinching = false;

// Pinch state (focal-locked, scroll-frozen system)
var pinchState = {
    active: false,
    startDist: 0,
    startZoom: 1,
    contentX: 0,
    contentY: 0,
    viewportX: 0,
    viewportY: 0,
    frozenScrollLeft: 0,
    frozenScrollTop: 0,
    currentRatio: 1
};

function openStudyPdf(pdfPath, title, isRestore, restoreData) {
    var titleEl = document.getElementById("studyPdfTitle");
    var bookEl = document.getElementById("studyPdfBook");
    var loadingEl = document.getElementById("studyPdfLoading");
    var errorEl = document.getElementById("studyPdfError");
    if (!titleEl || !bookEl || !loadingEl || !errorEl) return;
    var activeView = document.querySelector(".page-view.active");
    if (!isRestore && activeView && activeView.id !== "study-pdf-reader-view") currentStudyPdfParentView = activeView.id;
    currentStudyPdfPath = String(pdfPath || "");
    currentStudyPdfTitle = title || "Study PDF";
    pendingPdfRestore = isRestore && restoreData ? restoreData : null;
    var token = ++studyPdfLoadToken;
    cleanupStudyPdfResources();
    studyPdfZoom = (pendingPdfRestore && Number(pendingPdfRestore.zoom)) || 1;
    updateStudyPdfZoomLabel();
    titleEl.textContent = currentStudyPdfTitle;
    bookEl.innerHTML = "";
    var pdfStageReset = document.getElementById("studyPdfBookStage");
    if (pdfStageReset && !isRestore) { pdfStageReset.scrollTop = 0; pdfStageReset.scrollLeft = 0; }
    errorEl.hidden = true;
    errorEl.textContent = "";
    loadingEl.hidden = false;
    if (isRestore) {
        hideAllViews();
        document.getElementById("study-pdf-reader-view").classList.add("active");
    } else {
        switchSubView("study-pdf-reader-view");
    }
    savePortalPageState();
    bindStudyPdfZoomButtons();
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
                wrapper.style.width = Math.round(base.width * fitScale * studyPdfZoom) + "px";
                wrapper.style.height = Math.round(base.height * fitScale * studyPdfZoom) + "px";
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
        var restore = pendingPdfRestore;
        if (restore) {
            stage.scrollTop = Math.max(0, Number(restore.scrollTop) || 0);
            stage.scrollLeft = Math.max(0, Number(restore.scrollLeft) || 0);
            var restorePage = Math.max(1, Number(restore.page) || 1);
            renderStudyPdfScrollPage(restorePage, token);
            pendingPdfRestore = null;
        } else {
            renderStudyPdfScrollPage(1, token);
        }
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
    if (studyPdfIsPinching) {
        wrapper.dataset.renderPending = "true";
        return;
    }
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

// Zoom via buttons/wheel — keeps focal point stable
function setStudyPdfZoom(value, focalX, focalY, instant) {
    var next = Math.max(0.5, Math.min(4, Math.round(value * 100) / 100));
    if (Math.abs(next - studyPdfZoom) < 0.005 || !studyPdfDocument) return;
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
        var info = studyPdfPageInfo[n];
        if (info) {
            var newW = Math.ceil(info.width * info.fitScale * next);
            var newH = Math.ceil(info.height * info.fitScale * next);
            wrapper.style.width = newW + "px";
            wrapper.style.height = newH + "px";
            var canvas = wrapper.querySelector("canvas");
            if (canvas) {
                canvas.style.width = newW + "px";
                canvas.style.height = newH + "px";
            }
            var textLayer = wrapper.querySelector(".textLayer");
            if (textLayer) {
                textLayer.style.width = newW + "px";
                textLayer.style.height = newH + "px";
            }
        }
    });

    if (stage) {
        requestAnimationFrame(function() {
            stage.scrollLeft = Math.max(0, contentX * ratio - localX);
            stage.scrollTop = Math.max(0, contentY * ratio - localY);
        });
    }

    if (studyPdfRenderDebounce) clearTimeout(studyPdfRenderDebounce);
    var delay = instant ? 60 : 200;
    studyPdfRenderDebounce = setTimeout(function() {
        studyPdfRenderDebounce = null;
        var tk = studyPdfLoadToken;
        pages.forEach(function(wrapper) {
            var n = Number(wrapper.dataset.pageNumber);
            wrapper.dataset.rendered = "false";
            var oldTask = studyPdfActiveRenders[n];
            if (oldTask && oldTask.cancel) {
                wrapper.dataset.renderPending = "true";
                try { oldTask.cancel(); } catch (e) {}
            }
            var r = wrapper.getBoundingClientRect();
            var sr = stage ? stage.getBoundingClientRect() : null;
            if (sr && r.bottom >= sr.top - 700 && r.top <= sr.bottom + 700) {
                renderStudyPdfScrollPage(n, tk);
            }
        });
    }, delay);
    savePortalPageState();
}

function updateStudyPdfZoomLabel() {
    var label = document.getElementById("studyPdfZoomLabel");
    if (label) label.textContent = Math.round(studyPdfZoom * 100) + "%";
}

function bindStudyPdfZoomButtons() {
    var plus = document.getElementById("studyPdfZoomIn");
    var minus = document.getElementById("studyPdfZoomOut");
    var fit = document.getElementById("studyPdfFit");
    if (plus && plus.dataset.bound !== "true") { plus.dataset.bound = "true"; plus.addEventListener("click", function() { setStudyPdfZoom(studyPdfZoom + 0.12); }); }
    if (minus && minus.dataset.bound !== "true") { minus.dataset.bound = "true"; minus.addEventListener("click", function() { setStudyPdfZoom(studyPdfZoom - 0.12); }); }
    if (fit && fit.dataset.bound !== "true") { fit.dataset.bound = "true"; fit.addEventListener("click", function() { setStudyPdfZoom(1); }); }
}

function bindStudyPdfScrollZoom(stage, token) {
    if (!stage || stage.dataset.scrollZoomBound === "true") return;
    stage.dataset.scrollZoomBound = "true";

    // ===== Ctrl+Wheel zoom =====
    stage.addEventListener("wheel", function(event) {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        var factor = event.deltaY < 0 ? 1.045 : 0.957;
        setStudyPdfZoom(studyPdfZoom * factor, event.clientX, event.clientY, false);
    }, { passive: false });

    // ===== PINCH ZOOM — Ultimate Google-Drive-style focal lock =====
    // Strategy:
    //   1. On start: freeze scroll (overflow:hidden), record content point under fingers
    //   2. On move: apply transform: translate(cx*(1-r), cy*(1-r)) scale(r)
    //      — this math EXACTLY keeps the content point (cx,cy) stationary under fingers
    //   3. On end: bake transform → real size + scroll in single frame, no jump

    function getPinchData(touches) {
        var a = touches[0], b = touches[1];
        return {
            dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
            cx: (a.clientX + b.clientX) / 2,
            cy: (a.clientY + b.clientY) / 2
        };
    }

    stage.addEventListener("touchstart", function(event) {
        if (event.touches.length === 2) {
            event.preventDefault();
            var p = getPinchData(event.touches);
            var stageRect = stage.getBoundingClientRect();
            var localX = p.cx - stageRect.left;
            var localY = p.cy - stageRect.top;

            pinchState.active = true;
            studyPdfIsPinching = true;
            pinchState.startDist = p.dist;
            pinchState.startZoom = studyPdfZoom;
            pinchState.viewportX = localX;
            pinchState.viewportY = localY;
            pinchState.contentX = stage.scrollLeft + localX;
            pinchState.contentY = stage.scrollTop + localY;
            pinchState.frozenScrollLeft = stage.scrollLeft;
            pinchState.frozenScrollTop = stage.scrollTop;
            pinchState.currentRatio = 1;

            // Freeze scroll → no interference with transform
            stage.style.overflow = "hidden";
            stage.style.touchAction = "none";

            // Kill all transitions on book during pinch
            var book = document.getElementById("studyPdfBook");
            if (book) {
                book.classList.add("pinching");
                book.style.transformOrigin = "0 0";
                book.style.transition = "none";
            }
        }
    }, { passive: false });

    stage.addEventListener("touchmove", function(event) {
        if (!pinchState.active || event.touches.length !== 2) return;
        event.preventDefault();
        var p = getPinchData(event.touches);
        if (pinchState.startDist < 1) return;

        var newZoom = Math.max(0.5, Math.min(4,
            pinchState.startZoom * (p.dist / pinchState.startDist)));
        var r = newZoom / pinchState.startZoom;
        pinchState.currentRatio = r;

        var stageRect = stage.getBoundingClientRect();
        var localX = p.cx - stageRect.left;
        var localY = p.cy - stageRect.top;

        // Focal lock math:
        // After scale(r) with origin (0,0), content point (cx,cy) moves to (cx*r, cy*r).
        // We want it to appear at viewport position (localX, localY), accounting for frozen scroll.
        // Scroll is frozen at (frozenScrollLeft, frozenScrollTop), so screen pos = content_pos - scroll + translate
        //   localX = pinchState.contentX * r - frozenScrollLeft + tx
        //   tx = localX + frozenScrollLeft - pinchState.contentX * r
        var tx = localX + pinchState.frozenScrollLeft - (pinchState.contentX * r);
        var ty = localY + pinchState.frozenScrollTop - (pinchState.contentY * r);

        var book = document.getElementById("studyPdfBook");
        if (book) {
            book.style.transform = "translate3d(" + tx + "px," + ty + "px,0) scale(" + r + ")";
        }
    }, { passive: false });

    function finishPinch() {
        if (!pinchState.active) return;
        pinchState.active = false;
        studyPdfIsPinching = false;

        var r = pinchState.currentRatio;
        var finalZoom = Math.max(0.5, Math.min(4, Math.round(pinchState.startZoom * r * 100) / 100));
        studyPdfZoom = finalZoom;
        updateStudyPdfZoomLabel();

        // Calculate target scroll so focal point stays locked
        var actualRatio = finalZoom / pinchState.startZoom;
        var targetScrollLeft = (pinchState.contentX * actualRatio) - pinchState.viewportX;
        var targetScrollTop = (pinchState.contentY * actualRatio) - pinchState.viewportY;

        var book = document.getElementById("studyPdfBook");

        // Remove transform
        if (book) {
            book.style.transform = "";
            book.style.transformOrigin = "";
        }

        // Set real page sizes (no transition for instant bake)
        var pages = document.querySelectorAll("#studyPdfBook .pdf-scroll-page");
        pages.forEach(function(wrapper) {
            var n = Number(wrapper.dataset.pageNumber);
            var info = studyPdfPageInfo[n];
            if (info) {
                var newW = Math.ceil(info.width * info.fitScale * studyPdfZoom);
                var newH = Math.ceil(info.height * info.fitScale * studyPdfZoom);
                wrapper.style.width = newW + "px";
                wrapper.style.height = newH + "px";
                var canvas = wrapper.querySelector("canvas");
                if (canvas) {
                    canvas.style.width = newW + "px";
                    canvas.style.height = newH + "px";
                }
                var textLayer = wrapper.querySelector(".textLayer");
                if (textLayer) {
                    textLayer.style.width = newW + "px";
                    textLayer.style.height = newH + "px";
                }
            }
        });

        // Single-frame bake: restore scroll + overflow + transitions
        requestAnimationFrame(function() {
            stage.style.overflow = "";
            stage.style.touchAction = "";
            stage.scrollLeft = Math.max(0, targetScrollLeft);
            stage.scrollTop = Math.max(0, targetScrollTop);

            requestAnimationFrame(function() {
                if (book) {
                    book.classList.remove("pinching");
                    book.style.transition = "";
                }
            });
        });

        // Debounced sharp re-render
        if (studyPdfRenderDebounce) clearTimeout(studyPdfRenderDebounce);
        studyPdfRenderDebounce = setTimeout(function() {
            studyPdfRenderDebounce = null;
            var tk = studyPdfLoadToken;
            pages.forEach(function(wrapper) {
                var n = Number(wrapper.dataset.pageNumber);
                wrapper.dataset.rendered = "false";
                var oldTask = studyPdfActiveRenders[n];
                if (oldTask && oldTask.cancel) {
                    wrapper.dataset.renderPending = "true";
                    try { oldTask.cancel(); } catch (e) {}
                }
                var rect = wrapper.getBoundingClientRect();
                var sr = stage.getBoundingClientRect();
                if (rect.bottom >= sr.top - 700 && rect.top <= sr.bottom + 700) {
                    renderStudyPdfScrollPage(n, tk);
                }
            });
        }, 140);
    }

    stage.addEventListener("touchend", function(event) {
        if (event.touches.length < 2 && pinchState.active) finishPinch();
    }, { passive: true });
    stage.addEventListener("touchcancel", function() {
        if (pinchState.active) finishPinch();
    }, { passive: true });
}

function cleanupStudyPdfResources() {
    if (studyPdfRenderDebounce) { clearTimeout(studyPdfRenderDebounce); studyPdfRenderDebounce = null; }
    studyPdfIsPinching = false;
    pinchState.active = false;
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

/* -------------- SESSION-SAFE PAGE RESTORE -------------- */
function getActivePortalViewId() {
    var active = document.querySelector(".page-view.active");
    return active ? active.id : "dashboard-view";
}

function readPortalPageState() {
    try { return JSON.parse(localStorage.getItem(PAGE_STATE_KEY) || "null"); }
    catch (e) { return null; }
}

function savePortalPageState() {
    if (isRestoringPortalState || !getStudentName()) return;
    var viewId = getActivePortalViewId();
    if (!viewId || viewId === "login-view") return;
    var state = {
        user: getStudentName(), viewId: viewId, scrollY: window.scrollY || 0,
        savedAt: Date.now(), studyMaterial: currentStudyMaterialState
    };
    if (viewId === "study-pdf-reader-view") {
        var pdfStage = document.getElementById("studyPdfBookStage");
        state.pdf = { path: currentStudyPdfPath, title: currentStudyPdfTitle,
            parentView: currentStudyPdfParentView, scrollTop: pdfStage ? pdfStage.scrollTop : 0,
            scrollLeft: pdfStage ? pdfStage.scrollLeft : 0, zoom: studyPdfZoom,
            page: getVisiblePdfPageNumber() };
    }
    if (viewId === "worksheets-reader-view") {
        var imageStage = document.getElementById("worksheetsReaderStage");
        state.worksheets = { category: currentWorksheetCategory, subject: currentWorksheetSubject,
            title: currentWorksheetTitle, parentView: currentWorksheetParentView,
            scrollTop: imageStage ? imageStage.scrollTop : 0, zoom: worksheetZoom };
    }
    try { localStorage.setItem(PAGE_STATE_KEY, JSON.stringify(state)); } catch (e) {}
}

function schedulePortalStateSave() {
    if (worksheetSaveTimer) clearTimeout(worksheetSaveTimer);
    worksheetSaveTimer = setTimeout(savePortalPageState, 280);
}

function getVisiblePdfPageNumber() {
    var stage = document.getElementById("studyPdfBookStage");
    if (!stage) return 1;
    var pages = document.querySelectorAll("#studyPdfBook .pdf-scroll-page");
    var best = 1, distance = Infinity, sr = stage.getBoundingClientRect();
    pages.forEach(function (page) {
        var r = page.getBoundingClientRect();
        var d = Math.abs(r.top - sr.top);
        if (d < distance) { distance = d; best = Number(page.dataset.pageNumber) || 1; }
    });
    return best;
}

function restorePortalPageState(studentName) {
    var state = readPortalPageState();
    if (!state || state.user !== studentName || !state.viewId || !document.getElementById(state.viewId)) return;
    isRestoringPortalState = true;
    if (state.viewId === "study-pdf-reader-view" && state.pdf && state.pdf.path) {
        currentStudyPdfParentView = state.pdf.parentView || "study-pdf-home-view";
        openStudyPdf(state.pdf.path, state.pdf.title || "Study PDF", true, state.pdf);
        isRestoringPortalState = false;
        return;
    }
    if (state.viewId === "worksheets-reader-view" && state.worksheets) {
        var w = state.worksheets;
        isRestoringPortalState = false;
        openWorksheets(w.category, w.subject, w.title, true, w);
        return;
    }
    if (state.viewId === "study-content-view" && state.studyMaterial) {
        var sm = state.studyMaterial;
        isRestoringPortalState = false;
        openStudyMaterial(sm.folder, sm.fileName, sm.subjectTitle, true);
        return;
    }
    hideAllViews();
    document.getElementById(state.viewId).classList.add("active");
    isRestoringPortalState = false;
    requestAnimationFrame(function () {
        window.scrollTo(0, Math.max(0, Number(state.scrollY) || 0));
        savePortalPageState();
    });
}

/* -------------- WORKSHEETS IMAGE READER -------------- */
async function loadWorksheetManifest(forceRefresh) {
    if (worksheetManifest && !forceRefresh) return worksheetManifest;

    // Cache-busting ensures the latest auto-generated manifest is requested.
    var manifestUrl = "worksheets.json?v=" + Date.now();
    var response = await fetch(manifestUrl, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
    });

    if (!response.ok) {
        throw new Error("worksheets.json could not be loaded (HTTP " + response.status + ")");
    }

    var data = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Invalid worksheets.json format");
    }

    worksheetManifest = data;
    return data;
}

function getWorksheetPages(category, subject) {
    var root = worksheetManifest || {};
    var parts = String(category || "competitive").split("/");
    var section = root[parts[0]] || root[parts[0].toLowerCase()] || {};
    if (parts.length > 1) section = section[parts[1]] || section[parts[1].toLowerCase()] || {};
    var pages = section[subject] || section[String(subject || "").toLowerCase()];
    if (Array.isArray(pages)) return pages;
    if (pages && Array.isArray(pages.pages)) return pages.pages;
    if (pages && Array.isArray(pages.images)) return pages.images;
    return [];
}

function getWorksheetPageSource(page) {
    if (typeof page === "string") return page;
    if (!page || typeof page !== "object") return "";
    return page.src || page.path || page.file || page.image || page.url || "";
}

function getWorksheetPageId(page, src) {
    if (typeof page === "string") page = {};
    page = page || {};
    var fileName = String(src || "").split(/[?#]/)[0].split("/").pop() || "";
    var fileStem = fileName.replace(/\.[^.]+$/, "");
    return String(page.id || page.name || page.pageId || page.key || fileStem || "Worksheet");
}

function normalizeWorksheetSearch(value) {
    return String(value || "").toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[\s_\-]+/g, "").replace(/[^a-z0-9]/g, "");
}

async function openWorksheets(category, subject, title, isRestore, restoreData) {
    var activeView = document.querySelector(".page-view.active");
    if (!isRestore && activeView && activeView.id !== "worksheets-reader-view") currentWorksheetParentView = activeView.id;
    currentWorksheetCategory = String(category || "competitive").toLowerCase();
    currentWorksheetSubject = String(subject || "");
    currentWorksheetTitle = title || subject || "Worksheets";
    if (restoreData && restoreData.parentView) currentWorksheetParentView = restoreData.parentView;
    worksheetZoom = restoreData && Number(restoreData.zoom) ? Number(restoreData.zoom) : 1;
    var titleEl = document.getElementById("worksheetsReaderTitle");
    var list = document.getElementById("worksheetsReaderList");
    var loading = document.getElementById("worksheetsReaderLoading");
    var empty = document.getElementById("worksheetsReaderEmpty");
    if (!titleEl || !list || !loading || !empty) return;
    titleEl.textContent = currentWorksheetTitle + " Worksheets";
    list.innerHTML = ""; empty.hidden = true; loading.hidden = false;
    if (isRestore) { hideAllViews(); document.getElementById("worksheets-reader-view").classList.add("active"); }
    else switchSubView("worksheets-reader-view");
    updateWorksheetZoomLabel();
    try {
        await loadWorksheetManifest();
        var pages = getWorksheetPages(currentWorksheetCategory, currentWorksheetSubject);
        loading.hidden = true;
        if (!pages.length) {
            empty.hidden = false;
            empty.innerHTML = '<i class="fa-regular fa-images"></i><strong>Worksheets coming soon</strong><span>Is folder mein abhi koi worksheet image nahi mili. GitHub par image upload karne ke baad automatic update ka wait karein.</span>';
            updateWorksheetPageCount(0);
            savePortalPageState();
            return;
        }
        var fragment = document.createDocumentFragment();
        var renderedCount = 0;
        pages.forEach(function (page, index) {
            var pageSrc = getWorksheetPageSource(page);
            if (!pageSrc) return;
            var pageId = getWorksheetPageId(page, pageSrc);
            var pageTitle = (page && typeof page === "object" && (page.title || page.label)) || pageId;
            var wrapper = document.createElement("article");
            wrapper.className = "worksheet-image-page";
            wrapper.id = "worksheet-page-" + pageId.replace(/[^a-zA-Z0-9_-]/g, "-") + "-" + index;
            wrapper.dataset.pageId = pageId;
            wrapper.dataset.pageTitle = pageTitle;
            wrapper.dataset.pageSrc = pageSrc;
            var label = document.createElement("div"); label.className = "worksheet-image-label";
            label.textContent = pageTitle;
            var img = document.createElement("img");
            img.loading = renderedCount < 2 ? "eager" : "lazy";
            img.alt = pageTitle;
            img.src = pageSrc;
            img.draggable = false;
            img.addEventListener("error", function () {
                wrapper.classList.add("worksheet-image-error");
                img.remove();
                var err = document.createElement("span"); err.textContent = "Image not found: " + pageSrc;
                wrapper.appendChild(err);
            });
            wrapper.appendChild(label); wrapper.appendChild(img); fragment.appendChild(wrapper);
            renderedCount++;
        });
        list.appendChild(fragment);
        updateWorksheetZoomLabel();
        updateWorksheetPageCount(renderedCount);
        updateWorksheetActivePage();
        var search = document.getElementById("worksheetSearch"); if (search) search.value = "";
        if (restoreData) {
            var stage = document.getElementById("worksheetsReaderStage");
            requestAnimationFrame(function () { if (stage) stage.scrollTop = Math.max(0, Number(restoreData.scrollTop) || 0); savePortalPageState(); });
        } else savePortalPageState();
    } catch (error) {
        loading.hidden = true; empty.hidden = false;
        empty.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><strong>Worksheets load nahi ho paayin</strong><span>' + escapeStudyHtml(error.message) + '</span>';
        updateWorksheetPageCount(0);
    }
}

function updateWorksheetPageCount(count) {
    var el = document.getElementById("worksheetPageCount");
    if (el) { el.dataset.total = String(count); el.textContent = count + (count === 1 ? " page" : " pages"); }
}

function updateWorksheetActivePage() {
    var stage = document.getElementById("worksheetsReaderStage");
    var label = document.getElementById("worksheetPageCount");
    var pages = document.querySelectorAll(".worksheet-image-page");
    if (!stage || !label || !pages.length) return;
    var stageTop = stage.getBoundingClientRect().top;
    var best = 0, distance = Infinity;
    pages.forEach(function (page, index) {
        var d = Math.abs(page.getBoundingClientRect().top - stageTop);
        if (d < distance) { distance = d; best = index; }
    });
    label.textContent = "Page " + (best + 1) + " / " + pages.length;
}

function handleWorksheetKeyboardNavigation(event) {
    var view = document.getElementById("worksheets-reader-view");
    if (!view || !view.classList.contains("active")) return;
    if (event.key === "Escape" && view.classList.contains("worksheet-fullscreen")) {
        toggleWorksheetFullscreen(true);
        return;
    }
    if (event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (["ArrowDown", "PageDown", "ArrowUp", "PageUp"].indexOf(event.key) === -1) return;
    var pages = document.querySelectorAll(".worksheet-image-page");
    if (!pages.length) return;
    event.preventDefault();
    var stage = document.getElementById("worksheetsReaderStage");
    var top = stage ? stage.getBoundingClientRect().top : 0;
    var current = 0, distance = Infinity;
    pages.forEach(function (page, index) { var d = Math.abs(page.getBoundingClientRect().top - top); if (d < distance) { distance = d; current = index; } });
    var next = Math.max(0, Math.min(pages.length - 1, current + ((event.key === "ArrowDown" || event.key === "PageDown") ? 1 : -1)));
    pages[next].scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateWorksheetZoomLabel() {
    var label = document.getElementById("worksheetZoomLabel");
    if (label) label.textContent = Math.round(worksheetZoom * 100) + "%";

    var list = document.getElementById("worksheetsReaderList");
    var stage = document.getElementById("worksheetsReaderStage");
    if (!list || !stage) return;

    /* Keep the zoomed worksheet inside a real, horizontally scrollable layout. */
    var stageStyle = window.getComputedStyle(stage);
    var availableWidth = Math.max(1, stage.clientWidth -
        (parseFloat(stageStyle.paddingLeft) || 0) -
        (parseFloat(stageStyle.paddingRight) || 0));
    var baseWidth = Math.min(900, availableWidth);
    var pageWidth = Math.max(1, Math.round(baseWidth * worksheetZoom));
    var contentWidth = Math.max(availableWidth, pageWidth);

    list.style.setProperty("--worksheet-zoom", String(worksheetZoom));
    list.style.width = contentWidth + "px";
    list.style.maxWidth = "none";
    list.querySelectorAll(".worksheet-image-page").forEach(function (page) {
        page.style.width = pageWidth + "px";
        page.style.flex = "0 0 auto";
    });
    list.querySelectorAll(".worksheet-image-page img").forEach(function (img) {
        img.style.width = "100%";
    });
}

function changeWorksheetZoom(delta) {
    worksheetZoom = Math.max(0.6, Math.min(3, Math.round((worksheetZoom + delta) * 100) / 100));
    updateWorksheetZoomLabel(); savePortalPageState();
}

function searchWorksheetPage() {
    var input = document.getElementById("worksheetSearch");
    var rawQuery = input ? input.value.trim() : "";
    var query = normalizeWorksheetSearch(rawQuery);
    if (!query) return;
    var pages = document.querySelectorAll(".worksheet-image-page");
    var match = null, partial = null;
    pages.forEach(function (page) {
        var id = normalizeWorksheetSearch(page.dataset.pageId || "");
        var title = normalizeWorksheetSearch(page.dataset.pageTitle || "");
        var src = normalizeWorksheetSearch((page.dataset.pageSrc || "").split("/").pop() || "");
        if (id === query || src === query || title === query) match = match || page;
        else if (!partial && (id.indexOf(query) !== -1 || title.indexOf(query) !== -1 || src.indexOf(query) !== -1)) partial = page;
    });
    match = match || partial;
    if (match) {
        match.scrollIntoView({ behavior: "smooth", block: "start" });
        match.classList.add("worksheet-search-hit");
        setTimeout(function () { match.classList.remove("worksheet-search-hit"); }, 1600);
        savePortalPageState();
    } else if (input) {
        input.setCustomValidity("Page nahi mila. Tenses12, Synonyms1 ya image ka filename try karein."); input.reportValidity();
        input.addEventListener("input", function clearValidity() { input.setCustomValidity(""); input.removeEventListener("input", clearValidity); }, { once: true });
    }
}

function toggleWorksheetFullscreen(forceExit) {
    var view = document.getElementById("worksheets-reader-view");
    var button = document.getElementById("worksheetFullscreenToggle");
    if (!view) return;

    var shouldExit = typeof forceExit === "boolean" ? forceExit : view.classList.contains("worksheet-fullscreen");
    if (shouldExit) {
        view.classList.remove("worksheet-fullscreen");
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(function () {});
        }
    } else {
        view.classList.add("worksheet-fullscreen");
        if (view.requestFullscreen) {
            var request = view.requestFullscreen();
            if (request && typeof request.catch === "function") request.catch(function () { /* CSS full-screen fallback remains active. */ });
        }
    }

    if (button) {
        var active = view.classList.contains("worksheet-fullscreen");
        button.setAttribute("aria-pressed", active ? "true" : "false");
        button.setAttribute("aria-label", active ? "Exit full screen" : "Open full screen");
        button.title = active ? "Exit full screen" : "Open full screen";
        button.innerHTML = active ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
    }
    requestAnimationFrame(function () { updateWorksheetZoomLabel(); updateWorksheetActivePage(); });
}

function backFromWorksheets() {
    toggleWorksheetFullscreen(true);
    switchSubView(currentWorksheetParentView || "worksheets-competitive-view");
}

function bindWorksheetControls() {
    var minus = document.getElementById("worksheetZoomOut");
    var plus = document.getElementById("worksheetZoomIn");
    var search = document.getElementById("worksheetSearch");
    var fullscreen = document.getElementById("worksheetFullscreenToggle");
    if (fullscreen && !fullscreen.dataset.bound) {
        fullscreen.dataset.bound = "1";
        fullscreen.addEventListener("click", function () { toggleWorksheetFullscreen(); });
    }
    if (minus && !minus.dataset.bound) { minus.dataset.bound = "1"; minus.addEventListener("click", function () { changeWorksheetZoom(-0.1); }); }
    if (plus && !plus.dataset.bound) { plus.dataset.bound = "1"; plus.addEventListener("click", function () { changeWorksheetZoom(0.1); }); }
    if (search && !search.dataset.bound) { search.dataset.bound = "1"; search.addEventListener("keydown", function (e) { if (e.key === "Enter") searchWorksheetPage(); }); }
    var view = document.getElementById("worksheets-reader-view");
    if (view && !view.dataset.fullscreenBound) {
        view.dataset.fullscreenBound = "1";
        document.addEventListener("fullscreenchange", function () {
            if (!document.fullscreenElement && view.classList.contains("worksheet-fullscreen")) {
                view.classList.remove("worksheet-fullscreen");
                var button = document.getElementById("worksheetFullscreenToggle");
                if (button) {
                    button.setAttribute("aria-pressed", "false");
                    button.setAttribute("aria-label", "Open full screen");
                    button.title = "Open full screen";
                    button.innerHTML = '<i class="fa-solid fa-expand"></i>';
                }
                requestAnimationFrame(function () { updateWorksheetZoomLabel(); updateWorksheetActivePage(); });
            }
        });
    }
    if (stage && !stage.dataset.resizeBound) {
        stage.dataset.resizeBound = "1";
        window.addEventListener("resize", updateWorksheetZoomLabel, { passive: true });
    }
    if (stage && !stage.dataset.pinchBound) {
        stage.dataset.pinchBound = "1";
        var startDistance = 0, startZoom = 1;
        stage.addEventListener("touchstart", function (e) {
            if (e.touches.length === 2) { startDistance = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); startZoom = worksheetZoom; }
        }, { passive: true });
        stage.addEventListener("touchmove", function (e) {
            if (e.touches.length === 2 && startDistance > 0) {
                e.preventDefault();
                var d = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
                worksheetZoom = Math.max(0.6, Math.min(3, startZoom * d / startDistance));
                updateWorksheetZoomLabel();
            }
        }, { passive: false });
        stage.addEventListener("touchend", function (e) { if (e.touches.length < 2 && startDistance) { startDistance = 0; savePortalPageState(); } }, { passive: true });
        stage.addEventListener("wheel", function (e) {
            if (e.ctrlKey || e.metaKey) { e.preventDefault(); changeWorksheetZoom(e.deltaY < 0 ? 0.08 : -0.08); }
        }, { passive: false });
    }
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
    var pdfStage = document.getElementById("studyPdfBookStage");
    if (pdfStage) pdfStage.addEventListener("scroll", schedulePortalStateSave, { passive: true });
    var worksheetStage = document.getElementById("worksheetsReaderStage");
    if (worksheetStage) worksheetStage.addEventListener("scroll", function () { schedulePortalStateSave(); updateWorksheetActivePage(); }, { passive: true });
    bindWorksheetControls();
    document.addEventListener("keydown", handleWorksheetKeyboardNavigation);
    window.addEventListener("scroll", schedulePortalStateSave, { passive: true });
    window.addEventListener("beforeunload", savePortalPageState);
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
window.openWorksheets = openWorksheets;
window.searchWorksheetPage = searchWorksheetPage;
window.backFromWorksheets = backFromWorksheets;

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
