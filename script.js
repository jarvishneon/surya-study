// =========================
// RJ STUDY ACADEMY - PORTAL
// =========================

// ===== VALID PASSWORDS =====
var VALID_PASSWORDS = ["04783", "padhlo", "4181723"];

// ===== BACKEND WORKER URL =====
var WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";

// ===== GLOBAL STATE =====
var currentStudent = null;
var chatHistory = [];
var isChatLoading = false;
var chatInitialized = false;

// ===== PDF STATE =====
var studyPdfDocument = null;
var studyPdfZoom = 1;
var studyPdfBaseScale = 1;
var studyPdfPageInfo = {};
var studyPdfLoadToken = 0;
var studyPdfRenderDebounce = null;
var studyPdfIsPinching = false;

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", function() {
    initPortal();
});

function initPortal() {
    checkExistingSession();
    setupEventListeners();
    setupChatSystem();
}

function setupEventListeners() {
    var loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    var profileBtn = document.getElementById("profileBtn");
    if (profileBtn) {
        profileBtn.addEventListener("click", toggleProfileMenu);
    }

    document.addEventListener("click", function(e) {
        var profileMenu = document.getElementById("profileMenu");
        var profileBtn = document.getElementById("profileBtn");
        if (profileMenu && profileMenu.classList.contains("active")) {
            if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
                profileMenu.classList.remove("active");
            }
        }
    });

    var closeChatBtn = document.getElementById("closeChatBtn");
    if (closeChatBtn) {
        closeChatBtn.addEventListener("click", closeChat);
    }

    var sendChatBtn = document.getElementById("sendChatBtn");
    if (sendChatBtn) {
        sendChatBtn.addEventListener("click", sendChatMessage);
    }

    var chatInput = document.getElementById("chatInput");
    if (chatInput) {
        chatInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                sendChatMessage();
            }
        });
    }
}

// ===== AUTHENTICATION =====
function handleLogin(e) {
    e.preventDefault();

    var studentId = document.getElementById("studentId").value.trim();
    var password = document.getElementById("password").value.trim();
    var errorMsg = document.getElementById("loginError");

    if (!studentId || !password) {
        showError(errorMsg, "Please fill in all fields");
        return;
    }

    if (!VALID_PASSWORDS.includes(password)) {
        showError(errorMsg, "Invalid password. Please try again.");
        return;
    }

    currentStudent = {
        id: studentId,
        name: getStudentName(studentId)
    };

    sessionStorage.setItem("rjStudySession", JSON.stringify(currentStudent));

    showDashboard();
}

function checkExistingSession() {
    var session = sessionStorage.getItem("rjStudySession");
    if (session) {
        try {
            currentStudent = JSON.parse(session);
            showDashboard();
        } catch (e) {
            sessionStorage.removeItem("rjStudySession");
        }
    }
}

function getStudentName(studentId) {
    var names = {
        "RJ001": "Rahul Sharma",
        "RJ002": "Priya Patel",
        "RJ003": "Amit Kumar",
        "RJ004": "Sneha Gupta",
        "RJ005": "Vikram Singh"
    };
    return names[studentId] || "Student " + studentId;
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = "block";
        setTimeout(function() {
            element.style.display = "none";
        }, 3000);
    }
}

function logout() {
    currentStudent = null;
    chatHistory = [];
    chatInitialized = false;
    sessionStorage.removeItem("rjStudySession");

    document.getElementById("loginView").classList.add("active");
    document.getElementById("dashboardView").classList.remove("active");

    document.getElementById("studentId").value = "";
    document.getElementById("password").value = "";
}

// ===== DASHBOARD =====
function showDashboard() {
    document.getElementById("loginView").classList.remove("active");
    document.getElementById("dashboardView").classList.add("active");

    updateGreeting();
    updateProfileInfo();
    activateDashboard();
}

function updateGreeting() {
    var greetingEl = document.getElementById("greetingText");
    if (greetingEl && currentStudent) {
        var greeting = getGreeting();
        greetingEl.textContent = greeting + ", " + currentStudent.name + "!";
    }
}

function getGreeting() {
    var hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
}

function updateProfileInfo() {
    if (!currentStudent) return;

    var profileName = document.getElementById("profileName");
    var profileId = document.getElementById("profileId");

    if (profileName) profileName.textContent = currentStudent.name;
    if (profileId) profileId.textContent = "ID: " + currentStudent.id;
}

function toggleProfileMenu() {
    var menu = document.getElementById("profileMenu");
    if (menu) {
        menu.classList.toggle("active");
    }
}

// ===== NAVIGATION =====
function activateDashboard() {
    hideAllViews();
    document.getElementById("dashboardHome").classList.add("active");

    var navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(function(item) {
        item.classList.remove("active");
    });
    var homeNav = document.querySelector('[data-view="dashboardHome"]');
    if (homeNav) homeNav.classList.add("active");
}

function hideAllViews() {
    var views = document.querySelectorAll(".dashboard-content > div");
    views.forEach(function(view) {
        view.classList.remove("active");
    });
}

function switchView(viewId) {
    hideAllViews();
    var target = document.getElementById(viewId);
    if (target) {
        target.classList.add("active");
    }

    var navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(function(item) {
        item.classList.remove("active");
        if (item.getAttribute("data-view") === viewId) {
            item.classList.add("active");
        }
    });
}

function switchSubView(viewId) {
    var studyViews = document.querySelectorAll(".study-sub-view");
    studyViews.forEach(function(v) {
        v.classList.remove("active");
    });
    var target = document.getElementById(viewId);
    if (target) {
        target.classList.add("active");
    }
}

function goHome() {
    activateDashboard();
}

// ===== STUDY MATERIAL SYSTEM =====
var studyMaterials = {
    "competitive-jee": [
        { id: "jee-phy-ch1", title: "Physics - Mechanics", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/jee-physics-ch1", icon: "fa-atom" },
        { id: "jee-chem-ch1", title: "Chemistry - Organic", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/jee-chemistry-ch1", icon: "fa-flask" },
        { id: "jee-math-ch1", title: "Mathematics - Calculus", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/jee-maths-ch1", icon: "fa-square-root-variable" }
    ],
    "competitive-neet": [
        { id: "neet-bio-ch1", title: "Biology - Cell Structure", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/neet-biology-ch1", icon: "fa-dna" },
        { id: "neet-phy-ch1", title: "Physics - Optics", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/neet-physics-ch1", icon: "fa-atom" },
        { id: "neet-chem-ch1", title: "Chemistry - Inorganic", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/neet-chemistry-ch1", icon: "fa-flask" }
    ],
    "boards-10th": [
        { id: "10th-math-ch1", title: "Mathematics - Real Numbers", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/10th-maths-ch1", icon: "fa-calculator" },
        { id: "10th-sci-ch1", title: "Science - Chemical Reactions", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/10th-science-ch1", icon: "fa-microscope" },
        { id: "10th-eng-ch1", title: "English - First Flight", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/10th-english-ch1", icon: "fa-book-open" }
    ],
    "boards-12th": [
        { id: "12th-phy-ch1", title: "Physics - Electrostatics", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/12th-physics-ch1", icon: "fa-bolt" },
        { id: "12th-chem-ch1", title: "Chemistry - Solid State", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/12th-chemistry-ch1", icon: "fa-flask" },
        { id: "12th-math-ch1", title: "Mathematics - Relations", type: "pdf", url: "https://rj-test-backen.internationalbgi.workers.dev/api/pdf/12th-maths-ch1", icon: "fa-square-root-variable" }
    ]
};

function loadStudyMaterials(category) {
    var container = document.getElementById("studyMaterialList");
    if (!container) return;

    var materials = studyMaterials[category] || [];
    container.innerHTML = "";

    if (materials.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No materials available yet</p></div>';
        return;
    }

    materials.forEach(function(material) {
        var card = document.createElement("div");
        card.className = "material-card";
        card.innerHTML =
            '<div class="material-icon"><i class="fa-solid ' + material.icon + '"></i></div>' +
            '<div class="material-info">' +
                '<h4>' + material.title + '</h4>' +
                '<span class="material-type">' + material.type.toUpperCase() + '</span>' +
            '</div>' +
            '<button class="material-open-btn" onclick="openMaterial(\'' + material.id + '\', \'' + category + '\')">' +
                '<i class="fa-solid fa-eye"></i> Open' +
            '</button>';
        container.appendChild(card);
    });
}

function openMaterial(materialId, category) {
    var materials = studyMaterials[category] || [];
    var material = materials.find(function(m) { return m.id === materialId; });

    if (!material) {
        alert("Material not found!");
        return;
    }

    if (material.type === "pdf") {
        openStudyPdf(material.id);
    }
}

// ===== PDF READER =====
function loadStudyPdfFromUrl(url, title) {
    var loadToken = ++studyPdfLoadToken;
    var book = document.getElementById("studyPdfBook");
    var loader = document.getElementById("studyPdfLoader");
    var titleEl = document.getElementById("studyPdfTitle");

    if (titleEl) titleEl.textContent = title || "Study Material";
    if (book) book.innerHTML = "";
    if (loader) loader.style.display = "flex";

    studyPdfDocument = null;
    studyPdfPageInfo = {};
    studyPdfZoom = 1;
    updateStudyPdfZoomLabel();

    if (typeof pdfjsLib === "undefined") {
        if (loader) loader.innerHTML = '<p style="color:#ff6b6b;">PDF.js library nahi load hui. Page refresh karein.</p>';
        return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    pdfjsLib.getDocument(url).promise.then(function(pdf) {
        if (loadToken !== studyPdfLoadToken) return;
        studyPdfDocument = pdf;
        if (loader) loader.style.display = "none";

        var totalPages = pdf.numPages;
        if (book) {
            book.innerHTML = "";
            for (var i = 1; i <= totalPages; i++) {
                var pageWrapper = document.createElement("div");
                pageWrapper.className = "pdf-scroll-page";
                pageWrapper.dataset.pageNumber = i;
                pageWrapper.dataset.rendered = "false";

                var canvas = document.createElement("canvas");
                canvas.className = "pdf-scroll-canvas";
                pageWrapper.appendChild(canvas);

                var textLayerDiv = document.createElement("div");
                textLayerDiv.className = "textLayer";
                pageWrapper.appendChild(textLayerDiv);

                book.appendChild(pageWrapper);
            }
        }

        var firstPagePromise = pdf.getPage(1);
        firstPagePromise.then(function(firstPage) {
            if (loadToken !== studyPdfLoadToken) return;
            var viewport = firstPage.getViewport({ scale: 1 });
            var stage = document.getElementById("studyPdfBookStage");
            var stageWidth = stage ? stage.clientWidth : 800;
            var fitScale = (stageWidth * 0.92) / viewport.width;
            studyPdfBaseScale = fitScale;

            for (var p = 1; p <= totalPages; p++) {
                studyPdfPageInfo[p] = {
                    width: viewport.width,
                    height: viewport.height,
                    fitScale: fitScale
                };
                var wrapper = book.querySelector('[data-page-number="' + p + '"]');
                if (wrapper) {
                    var w = Math.ceil(viewport.width * fitScale);
                    var h = Math.ceil(viewport.height * fitScale);
                    wrapper.style.width = w + "px";
                    wrapper.style.height = h + "px";
                }
            }

            bindStudyPdfScrollEvents();
            bindStudyPdfScrollZoom();
            bindStudyPdfZoomButtons();

            for (var r = 1; r <= Math.min(3, totalPages); r++) {
                renderStudyPdfScrollPage(r, loadToken);
            }
        });
    }).catch(function(err) {
        console.error("PDF load error:", err);
        if (loader) {
            loader.innerHTML = '<p style="color:#ff6b6b;">PDF load nahi hua. URL check karein.</p>';
        }
    });
}

function openStudyPdf(pdfId) {
    var allMaterials = [];
    Object.keys(studyMaterials).forEach(function(cat) {
        studyMaterials[cat].forEach(function(m) { allMaterials.push(m); });
    });
    var material = allMaterials.find(function(m) { return m.id === pdfId; });
    if (!material) return;

    switchSubView("study-pdf-reader-view");
    bindStudyPdfZoomButtons();
    loadStudyPdfFromUrl(material.url, material.title);
}

function renderStudyPdfScrollPage(pageNumber, loadToken) {
    if (!studyPdfDocument) return;
    if (loadToken !== studyPdfLoadToken) return;

    var wrapper = document.querySelector('#studyPdfBook .pdf-scroll-page[data-page-number="' + pageNumber + '"]');
    if (!wrapper) return;

    var canvas = wrapper.querySelector("canvas");
    var textLayerDiv = wrapper.querySelector(".textLayer");
    if (!canvas) return;

    var info = studyPdfPageInfo[pageNumber];
    if (!info) return;

    var effectiveScale = info.fitScale * studyPdfZoom;

    studyPdfDocument.getPage(pageNumber).then(function(page) {
        if (loadToken !== studyPdfLoadToken) return;

        var viewport = page.getViewport({ scale: effectiveScale });
        var dpr = window.devicePixelRatio || 1;

        canvas.width = Math.ceil(viewport.width * dpr);
        canvas.height = Math.ceil(viewport.height * dpr);

        if (!studyPdfIsPinching && !studyPdfRenderDebounce) {
            canvas.style.width = Math.ceil(viewport.width) + "px";
            canvas.style.height = Math.ceil(viewport.height) + "px";
            if (textLayerDiv) {
                textLayerDiv.style.width = Math.ceil(viewport.width) + "px";
                textLayerDiv.style.height = Math.ceil(viewport.height) + "px";
            }
        }

        var ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        page.render(renderContext).promise.then(function() {
            if (loadToken !== studyPdfLoadToken) return;
            wrapper.dataset.rendered = "true";

            if (textLayerDiv && typeof pdfjsLib !== "undefined" && pdfjsLib.renderTextLayer) {
                textLayerDiv.innerHTML = "";
                pdfjsLib.renderTextLayer({
                    textContentSource: page.streamTextContent ? page.streamTextContent() : page.getTextContent(),
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });
            }
        });
    });
}

function setStudyPdfZoom(value, focalX, focalY, instant) {
    var next = Math.max(0.5, Math.min(4, Math.round(value * 100) / 100));
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
    var delay = instant ? 50 : 280;
    studyPdfRenderDebounce = setTimeout(function() {
        studyPdfRenderDebounce = null;
        var loadToken = studyPdfLoadToken;
        pages.forEach(function(wrapper) {
            var n = Number(wrapper.dataset.pageNumber);
            wrapper.dataset.rendered = "false";
            var r = wrapper.getBoundingClientRect();
            var sr = stage ? stage.getBoundingClientRect() : null;
            if (sr && r.bottom >= sr.top - 500 && r.top <= sr.bottom + 500) {
                renderStudyPdfScrollPage(n, loadToken);
            }
        });
    }, delay);
}

function updateStudyPdfZoomLabel() {
    var label = document.getElementById("studyPdfZoomLabel");
    if (label) {
        label.textContent = Math.round(studyPdfZoom * 100) + "%";
    }
}

function bindStudyPdfScrollZoom() {
    var stage = document.getElementById("studyPdfBookStage");
    if (!stage) return;

    stage._pdfZoomBound = true;

    stage.addEventListener("wheel", function(e) {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        e.stopPropagation();

        var delta = e.deltaY > 0 ? 0.94 : 1.06;
        var newZoom = studyPdfZoom * delta;
        setStudyPdfZoom(newZoom, e.clientX, e.clientY, false);
    }, { passive: false });

    var pinchStartDist = 0;
    var pinchStartZoom = 1;
    var pinchCenterX = 0;
    var pinchCenterY = 0;

    function getTouchDist(t1, t2) {
        var dx = t1.clientX - t2.clientX;
        var dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    stage.addEventListener("touchstart", function(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            studyPdfIsPinching = true;
            pinchStartDist = getTouchDist(e.touches[0], e.touches[1]);
            pinchStartZoom = studyPdfZoom;
            pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
    }, { passive: false });

    stage.addEventListener("touchmove", function(e) {
        if (e.touches.length === 2 && studyPdfIsPinching) {
            e.preventDefault();
            var dist = getTouchDist(e.touches[0], e.touches[1]);
            if (pinchStartDist < 1) return;
            var scale = dist / pinchStartDist;
            var newZoom = pinchStartZoom * scale;
            pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            setStudyPdfZoom(newZoom, pinchCenterX, pinchCenterY, true);
        }
    }, { passive: false });

    function finishPinch() {
        if (!studyPdfIsPinching) return;
        studyPdfIsPinching = false;
        if (studyPdfRenderDebounce) clearTimeout(studyPdfRenderDebounce);
        studyPdfRenderDebounce = setTimeout(function() {
            studyPdfRenderDebounce = null;
            var loadToken = studyPdfLoadToken;
            var pages = document.querySelectorAll("#studyPdfBook .pdf-scroll-page");
            var stg = document.getElementById("studyPdfBookStage");
            pages.forEach(function(wrapper) {
                var n = Number(wrapper.dataset.pageNumber);
                wrapper.dataset.rendered = "false";
                var r = wrapper.getBoundingClientRect();
                var sr = stg ? stg.getBoundingClientRect() : null;
                if (sr && r.bottom >= sr.top - 500 && r.top <= sr.bottom + 500) {
                    renderStudyPdfScrollPage(n, loadToken);
                }
            });
        }, 150);
    }

    stage.addEventListener("touchend", function(e) {
        if (e.touches.length < 2) finishPinch();
    }, { passive: true });

    stage.addEventListener("touchcancel", function() {
        finishPinch();
    }, { passive: true });
}

function bindStudyPdfZoomButtons() {
    var btnIn = document.getElementById("studyPdfZoomIn");
    var btnOut = document.getElementById("studyPdfZoomOut");
    var btnFit = document.getElementById("studyPdfFit");

    if (btnIn) {
        btnIn.onclick = function() {
            setStudyPdfZoom(studyPdfZoom + 0.15, null, null, false);
        };
    }
    if (btnOut) {
        btnOut.onclick = function() {
            setStudyPdfZoom(studyPdfZoom - 0.15, null, null, false);
        };
    }
    if (btnFit) {
        btnFit.onclick = function() {
            setStudyPdfZoom(1, null, null, false);
        };
    }
}

function bindStudyPdfScrollEvents() {
    var stage = document.getElementById("studyPdfBookStage");
    if (!stage) return;

    stage.addEventListener("scroll", function() {
        if (!studyPdfDocument) return;
        var loadToken = studyPdfLoadToken;
        var pages = document.querySelectorAll("#studyPdfBook .pdf-scroll-page");
        var stageRect = stage.getBoundingClientRect();

        pages.forEach(function(wrapper) {
            if (wrapper.dataset.rendered === "true") return;
            var rect = wrapper.getBoundingClientRect();
            if (rect.bottom >= stageRect.top - 400 && rect.top <= stageRect.bottom + 400) {
                var n = Number(wrapper.dataset.pageNumber);
                renderStudyPdfScrollPage(n, loadToken);
            }
        });
    }, { passive: true });
}

// ===== TEST SYSTEM =====
function launchTest(testType) {
    alert(testType + " test module coming soon!");
}

// ===== CHAT SYSTEM =====
function setupChatSystem() {
    var chatFab = document.getElementById("chatFab");
    if (chatFab) {
        chatFab.addEventListener("click", openChat);
    }
}

function openChat() {
    var overlay = document.getElementById("chatOverlay");
    if (overlay) {
        overlay.classList.add("active");
    }

    if (!chatInitialized) {
        chatInitialized = true;
        addBotMessage("Hello! Main RJ Study Academy ka AI assistant hoon. Aap mujhse koi bhi study-related question pooch sakte hain. Bataiye, kaise madad kar sakta hoon?");
    }
}

function closeChat() {
    var overlay = document.getElementById("chatOverlay");
    if (overlay) {
        overlay.classList.remove("active");
    }
}

function addBotMessage(text) {
    var messagesDiv = document.getElementById("chatMessages");
    if (!messagesDiv) return;

    var msgDiv = document.createElement("div");
    msgDiv.className = "chat-message bot";
    msgDiv.innerHTML = '<div class="message-bubble">' + text + '</div>';
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addUserMessage(text) {
    var messagesDiv = document.getElementById("chatMessages");
    if (!messagesDiv) return;

    var msgDiv = document.createElement("div");
    msgDiv.className = "chat-message user";
    msgDiv.innerHTML = '<div class="message-bubble">' + text + '</div>';
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addTypingIndicator() {
    var messagesDiv = document.getElementById("chatMessages");
    if (!messagesDiv) return;

    var typingDiv = document.createElement("div");
    typingDiv.className = "chat-message bot typing-indicator";
    typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = '<div class="message-bubble"><span></span><span></span><span></span></div>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeTypingIndicator() {
    var typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
}

function sendChatMessage() {
    var input = document.getElementById("chatInput");
    if (!input) return;

    var message = input.value.trim();
    if (!message || isChatLoading) return;

    addUserMessage(message);
    input.value = "";

    chatHistory.push({ role: "user", content: message });

    isChatLoading = true;
    addTypingIndicator();

    fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            messages: chatHistory,
            studentId: currentStudent ? currentStudent.id : "guest"
        })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        removeTypingIndicator();
        isChatLoading = false;

        var reply = data.reply || data.message || "Sorry, koi error aa gaya. Dobara try karein.";
        addBotMessage(reply);
        chatHistory.push({ role: "assistant", content: reply });
    })
    .catch(function(err) {
        removeTypingIndicator();
        isChatLoading = false;
        console.error("Chat error:", err);
        addBotMessage("Network error aa gaya. Apna internet check karein aur dobara try karein.");
    });
}

// ===== CLOSE DROPDOWNS =====
function closeAllDropdowns() {
    var menus = document.querySelectorAll(".dropdown-menu");
    menus.forEach(function(menu) {
        menu.classList.remove("active");
    });
}

// ===== EXPORT FOR HTML ONCLICK =====
window.switchView = switchView;
window.switchSubView = switchSubView;
window.goHome = goHome;
window.logout = logout;
window.toggleProfileMenu = toggleProfileMenu;
window.openMaterial = openMaterial;
window.openStudyPdf = openStudyPdf;
window.launchTest = launchTest;
window.loadStudyMaterials = loadStudyMaterials;
window.closeChat = closeChat;
window.sendChatMessage = sendChatMessage;
