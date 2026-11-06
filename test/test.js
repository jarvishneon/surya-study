// ==========================================================================
// RJ ACADEMY PRO - Core Functional Script (v29.0 SECURITY PATCH)
// Multi-Subject | Server-Side Lock | Server Timer | Login Required | Shuffle
// ==========================================================================

const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";
const DASHBOARD_URL = "https://surya-study.pages.dev";

// Global State
let testConfig = null;
let currentQIndex = 0;
let userAnswers = {};
let flaggedQuestions = new Set();
let visitedQuestions = new Set();
let timerInterval = null;
let timeRemaining = 0;
let studentName = "";
let currentSubject = "english";
let isSubmitting = false;
let testStarted = false;
let sessionId = ""; // Server session for timer + lock
let serverSyncInterval = null;

// FAB Dragging State
let fabDragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    dragDistance: 0
};

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
    // Read subject from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSubject = (urlParams.get("subject") || "english").toLowerCase().trim();

    // 🔒 STRICT LOGIN CHECK — No fallback to "Student"
    const loggedInName =
        localStorage.getItem("rj_student_name") ||
        localStorage.getItem("rjStudyUsername") ||
        sessionStorage.getItem("student_name") ||
        "";

    const cleanName = String(loggedInName).trim();

    if (!cleanName || cleanName.toLowerCase() === "student" || cleanName.length < 2) {
        // No valid login found — block test and redirect
        showLockedScreen(
            "LOGIN REQUIRED",
            "Please login from Dashboard first to start the test.\nRedirecting..."
        );
        setTimeout(() => {
            window.location.href = DASHBOARD_URL;
        }, 2500);
        return;
    }

    studentName = cleanName;
    sessionStorage.setItem("student_name", studentName);

    initFabDraggable();
    initDashboardBtn();
    fetchConfigAndInit();
});

// ==================== FETCH CONFIG + ANTI-CHEAT ====================
async function fetchConfigAndInit() {
    try {
        const res = await fetch(
            `${WORKER_URL}/api/config?subject=${currentSubject}&student=${encodeURIComponent(studentName)}&t=${Date.now()}`
        );
        if (!res.ok) throw new Error("Server Error");
        testConfig = await res.json();

        if (testConfig.status && testConfig.status !== "open") {
            showLockedScreen(
                "TEST CURRENTLY CLOSED",
                "This test is currently closed or locked by Admin."
            );
            return;
        }

        if (!testConfig.questions || !Array.isArray(testConfig.questions) || testConfig.questions.length === 0) {
            showLockedScreen(
                "NO QUESTIONS FOUND",
                `No questions available for ${currentSubject.toUpperCase()}. Please contact Admin.`
            );
            return;
        }

        // Sync subject from server response if present
        if (testConfig.subject) currentSubject = testConfig.subject.toLowerCase();

        checkLockStatus();
    } catch (err) {
        console.error("Config fetch error:", err);
        showLockedScreen(
            "CONNECTION ERROR",
            "Could not load test. Please check internet and try again."
        );
    }
}

// ==================== SERVER-SIDE LOCK CHECK ====================
async function checkLockStatus() {
    try {
        const res = await fetch(`${WORKER_URL}/api/check-lock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentName: studentName,
                subject: currentSubject
            })
        });
        const data = await res.json();

        if (data.locked) {
            showLockedScreen(
                "TEST ALREADY SUBMITTED",
                `You have already completed the ${currentSubject.toUpperCase()} test.\nAsk Admin to unlock if needed.`
            );
            return;
        }

        // All clear — start the test
        beginTest();
    } catch (err) {
        console.error("Lock check error:", err);
        showLockedScreen(
            "CONNECTION ERROR",
            "Could not verify test status. Please check internet and try again."
        );
    }
}

// ==================== START TEST + LIVE INVIGILATION + SERVER TIMER ====================
async function beginTest() {
    const titleEl = document.getElementById("test-title-display");
    if (titleEl) {
        titleEl.innerText = testConfig.title || testConfig.testName || currentSubject.toUpperCase();
    }

    // 🔥 LIVE INVIGILATION + SERVER TIMER START
    if (!testStarted) {
        testStarted = true;
        try {
            const startRes = await fetch(`${WORKER_URL}/api/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentName: studentName,
                    subject: currentSubject
                })
            });
            const startData = await startRes.json();

            if (startData.sessionId) sessionId = startData.sessionId;
            if (startData.timeRemaining !== undefined) {
                timeRemaining = startData.timeRemaining;
            } else {
                timeRemaining = (testConfig.durationMinutes || testConfig.duration || 15) * 60;
            }
        } catch (e) {
            console.warn("Start alert failed (non-critical):", e);
            timeRemaining = (testConfig.durationMinutes || testConfig.duration || 15) * 60;
        }
    }

    startTimer();
    startServerSync();
    renderQuestion(0);
    renderMatrix();
}

// ==================== TIMER ====================
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            autoSubmitOnTimeout();
        }
    }, 1000);
}

// ==================== SERVER TIMER SYNC (Every 15 sec) ====================
function startServerSync() {
    if (serverSyncInterval) clearInterval(serverSyncInterval);
    serverSyncInterval = setInterval(async () => {
        try {
            const res = await fetch(`${WORKER_URL}/api/sync-timer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentName: studentName,
                    subject: currentSubject,
                    sessionId: sessionId
                })
            });
            const data = await res.json();
            if (data.success && typeof data.timeRemaining === "number") {
                // Trust server time — prevents browser tampering
                timeRemaining = data.timeRemaining;
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    clearInterval(serverSyncInterval);
                    autoSubmitOnTimeout();
                }
            }
            if (data.forceSubmit) {
                clearInterval(timerInterval);
                clearInterval(serverSyncInterval);
                autoSubmitOnTimeout();
            }
        } catch (e) {
            // Silent fail — local timer continues
        }
    }, 15000); // Sync every 15 seconds
}

function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const mins = Math.floor((timeRemaining % 3600) / 60);
    const secs = timeRemaining % 60;

    const display = [hours, mins, secs]
        .map(v => String(v).padStart(2, "0"))
        .filter((v, i) => i > 0 || v !== "00")
        .join(":");

    const timerElem = document.getElementById("time-left");
    const timerBox = document.getElementById("timer-box");
    if (timerElem) {
        timerElem.innerText = display;
        if (timeRemaining <= 60) {
            timerElem.style.color = "#EF4444";
            if (timerBox) timerBox.classList.add("timer-warning");
        } else {
            timerElem.style.color = "";
            if (timerBox) timerBox.classList.remove("timer-warning");
        }
    }
}

// ==================== QUESTION RENDER ====================
function renderQuestion(index) {
    if (!testConfig || !testConfig.questions || !testConfig.questions[index]) return;

    currentQIndex = index;
    visitedQuestions.add(index);

    const q = testConfig.questions[index];
    const questionContent = q.question || q.text || q.questionText || q.title || "";

    const qNumEl = document.getElementById("q-number");
    if (qNumEl) qNumEl.innerText = `Q.${index + 1}`;

    const qTextEl = document.getElementById("question-text");
    if (qTextEl) qTextEl.innerText = questionContent;

    const flagBtn = document.getElementById("flag-btn");
    if (flagBtn) {
        flagBtn.classList.toggle("flagged", flaggedQuestions.has(index));
    }

    // Optional image
    const imgContainer = document.getElementById("question-image-container");
    const imgEl = document.getElementById("question-image");
    const imageUrl = q.imageUrl || q.image || q.img || "";
    if (imgContainer && imgEl) {
        if (imageUrl) {
            imgEl.src = imageUrl;
            imgContainer.classList.remove("hidden");
        } else {
            imgContainer.classList.add("hidden");
        }
    }

    const optsContainer = document.getElementById("options-container");
    if (!optsContainer) return;
    optsContainer.innerHTML = "";

    const optionsList = q.options || q.choices || [];
    const isSubjective = q.type === "subjective" || q.type === "text" || optionsList.length === 0;

    if (isSubjective) {
        const textarea = document.createElement("textarea");
        textarea.className = "subjective-textarea";
        textarea.placeholder = "Type your answer here...";
        if (userAnswers[index] !== undefined) textarea.value = userAnswers[index];

        textarea.oninput = (e) => {
            userAnswers[index] = e.target.value;
            updateMatrixButtonState(index);
        };
        optsContainer.appendChild(textarea);
    } else {
        const labels = ["A", "B", "C", "D", "E"];
        optionsList.forEach((optText, optIdx) => {
            const optCard = document.createElement("div");
            optCard.className = `option-card ${userAnswers[index] === optIdx ? "selected" : ""}`;
            optCard.onclick = () => selectOption(optIdx);
            optCard.innerHTML = `
                <div class="opt-index">${labels[optIdx] || optIdx + 1}</div>
                <div class="opt-label">${optText}</div>
            `;
            optsContainer.appendChild(optCard);
        });
    }

    renderMatrix();
}

function selectOption(optIndex) {
    userAnswers[currentQIndex] = optIndex;
    renderQuestion(currentQIndex);
}

function toggleFlag() {
    if (flaggedQuestions.has(currentQIndex)) {
        flaggedQuestions.delete(currentQIndex);
    } else {
        flaggedQuestions.add(currentQIndex);
    }
    renderQuestion(currentQIndex);
}

function nextQuestion() {
    if (currentQIndex < testConfig.questions.length - 1) {
        renderQuestion(currentQIndex + 1);
    }
}

function prevQuestion() {
    if (currentQIndex > 0) {
        renderQuestion(currentQIndex - 1);
    }
}

// ==================== MATRIX PALETTE ====================
function renderMatrix() {
    const grid = document.getElementById("palette-grid");
    if (!grid || !testConfig) return;
    grid.innerHTML = "";

    testConfig.questions.forEach((_, idx) => {
        const btn = document.createElement("button");
        btn.className = "p-item";
        btn.innerText = idx + 1;

        if (idx === currentQIndex) btn.classList.add("active-q");

        const isAnswered =
            userAnswers[idx] !== undefined &&
            userAnswers[idx] !== "" &&
            String(userAnswers[idx]).trim() !== "";

        if (isAnswered) {
            btn.classList.add("status-answered");
        } else if (flaggedQuestions.has(idx)) {
            btn.classList.add("status-flagged");
        } else if (visitedQuestions.has(idx)) {
            btn.classList.add("status-visited");
        }

        btn.onclick = () => {
            renderQuestion(idx);
            if (window.innerWidth <= 992) toggleMatrix();
        };
        grid.appendChild(btn);
    });
}

function updateMatrixButtonState(idx) {
    const grid = document.getElementById("palette-grid");
    if (!grid) return;
    const btn = grid.children[idx];
    if (!btn) return;

    const isAnswered =
        userAnswers[idx] !== undefined && String(userAnswers[idx]).trim() !== "";

    if (isAnswered) {
        btn.classList.add("status-answered");
        btn.classList.remove("status-visited");
    } else {
        btn.classList.remove("status-answered");
        if (visitedQuestions.has(idx)) btn.classList.add("status-visited");
    }
}

function toggleMatrix() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("active-matrix");
}

// ==================== FAB DRAGGABLE ====================
function initFabDraggable() {
    const fab = document.getElementById("draggable-fab");
    if (!fab) return;

    const startDrag = (e) => {
        fabDragState.isDragging = true;
        fabDragState.dragDistance = 0;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        fabDragState.startX = clientX;
        fabDragState.startY = clientY;
        const rect = fab.getBoundingClientRect();
        fabDragState.initialLeft = rect.left;
        fabDragState.initialTop = rect.top;
        fab.style.transition = "none";
        fab.style.bottom = "auto";
        fab.style.right = "auto";
        fab.style.left = `${rect.left}px`;
        fab.style.top = `${rect.top}px`;
    };

    const doDrag = (e) => {
        if (!fabDragState.isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaX = clientX - fabDragState.startX;
        const deltaY = clientY - fabDragState.startY;
        fabDragState.dragDistance = Math.hypot(deltaX, deltaY);
        let newLeft = fabDragState.initialLeft + deltaX;
        let newTop = fabDragState.initialTop + deltaY;
        const maxLeft = window.innerWidth - fab.offsetWidth - 10;
        const maxTop = window.innerHeight - fab.offsetHeight - 10;
        newLeft = Math.max(10, Math.min(newLeft, maxLeft));
        newTop = Math.max(10, Math.min(newTop, maxTop));
        fab.style.left = `${newLeft}px`;
        fab.style.top = `${newTop}px`;
    };

    const stopDrag = () => {
        if (!fabDragState.isDragging) return;
        fabDragState.isDragging = false;
        fab.style.transition = "transform 0.1s ease";
        if (fabDragState.dragDistance < 12) toggleMatrix();
    };

    fab.addEventListener("touchstart", startDrag, { passive: true });
    window.addEventListener("touchmove", doDrag, { passive: true });
    window.addEventListener("touchend", stopDrag);
    fab.addEventListener("mousedown", startDrag);
    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);
}

// ==================== SUBMISSION ====================
function openSubmitConfirm() {
    if (isSubmitting) return;
    const total = testConfig.questions.length;
    const answered = Object.keys(userAnswers).filter(
        (k) => userAnswers[k] !== undefined && String(userAnswers[k]).trim() !== ""
    ).length;
    const flagged = flaggedQuestions.size;
    const unanswered = total - answered;

    const el = (id) => document.getElementById(id);
    if (el("sum-total")) el("sum-total").innerText = total;
    if (el("sum-answered")) el("sum-answered").innerText = answered;
    if (el("sum-flagged")) el("sum-flagged").innerText = flagged;
    if (el("sum-unanswered")) el("sum-unanswered").innerText = unanswered;

    const modal = document.getElementById("confirm-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeSubmitConfirm() {
    const modal = document.getElementById("confirm-modal");
    if (modal) modal.classList.add("hidden");
}

const headerSubBtn = document.getElementById("header-submit-btn");
if (headerSubBtn) headerSubBtn.onclick = openSubmitConfirm;

async function submitTestFinal() {
    if (isSubmitting) return;
    isSubmitting = true;

    if (timerInterval) clearInterval(timerInterval);
    if (serverSyncInterval) clearInterval(serverSyncInterval);
    closeSubmitConfirm();

    const now = Date.now();

    // Build answers array in correct order (index-based)
    // IMPORTANT: Server uses questionOrder (shuffled map) to grade correctly
    const answersArray = [];
    for (let i = 0; i < testConfig.questions.length; i++) {
        answersArray.push(
            userAnswers[i] !== undefined ? userAnswers[i] : ""
        );
    }

    const payload = {
        studentName: studentName,
        subject: currentSubject,
        testId: testConfig.testId || `${currentSubject.toUpperCase()}_TEST`,
        answers: answersArray,
        sessionId: sessionId,
        submittedAt: now
    };

    try {
        const res = await fetch(`${WORKER_URL}/api/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (result.success || res.ok) {
            // Server has locked — show scorecard
            showResultScreen(result, studentName);
        } else {
            isSubmitting = false;
            alert(result.error || "Submission failed. Please try again.");
            startTimer();
            startServerSync();
        }
    } catch (err) {
        isSubmitting = false;
        console.warn("Submit error:", err);
        alert("Network error. Please check internet and try again.");
        startTimer();
        startServerSync();
    }
}

function autoSubmitOnTimeout() {
    if (isSubmitting) return;
    alert("Time limit reached! Auto-submitting your exam.");
    submitTestFinal();
}

// ==================== MINIMAL STUDENT SCORECARD ====================
function showResultScreen(result, name) {
    const score = result.score !== undefined ? result.score : "—";
    const total = result.total !== undefined ? result.total : testConfig.questions.length;
    const attempted = result.attempted !== undefined ? result.attempted : "—";
    const unattempted = result.unattempted !== undefined ? result.unattempted : "—";

    const titleEl = document.getElementById("locked-title");
    if (titleEl) titleEl.innerText = "Assessment Completed";

    const msgEl = document.getElementById("locked-message");
    if (msgEl) {
        msgEl.innerText = `Well done, ${name}! Your ${currentSubject.toUpperCase()} test has been recorded.`;
    }

    // Show score display block
    const scoreDisplay = document.getElementById("final-score-display");
    if (scoreDisplay) {
        scoreDisplay.style.display = "block";
        const marksEl = document.getElementById("final-marks");
        if (marksEl) marksEl.innerText = `${score}/${total}`;
        const attEl = document.getElementById("final-attempted");
        if (attEl) attEl.innerText = attempted;
        const unEl = document.getElementById("final-unattempted");
        if (unEl) unEl.innerText = unattempted;
    }

    const timeEl = document.getElementById("locked-timestamp");
    if (timeEl) timeEl.innerText = `Submitted: ${new Date().toLocaleString("en-IN")}`;

    const lockedScreen = document.getElementById("locked-screen");
    if (lockedScreen) lockedScreen.classList.remove("hidden");
}

function showLockedScreen(title, msg) {
    const titleEl = document.getElementById("locked-title");
    if (titleEl && title) titleEl.innerText = title;

    const msgEl = document.getElementById("locked-message");
    if (msgEl) msgEl.innerText = msg;

    // Hide score if just locked/closed
    const scoreDisplay = document.getElementById("final-score-display");
    if (scoreDisplay) scoreDisplay.style.display = "none";

    const timeEl = document.getElementById("locked-timestamp");
    if (timeEl) timeEl.innerText = `Time: ${new Date().toLocaleString("en-IN")}`;

    const lockedScreen = document.getElementById("locked-screen");
    if (lockedScreen) lockedScreen.classList.remove("hidden");
}

function goToDashboard() {
    window.location.href = DASHBOARD_URL;
}

function initDashboardBtn() {
    const btn = document.getElementById("dash-btn");
    if (btn) {
        btn.addEventListener("click", goToDashboard);
        btn.addEventListener("touchend", (e) => {
            e.preventDefault();
            goToDashboard();
        });
    }
}

// Global bindings for HTML onclick
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.toggleFlag = toggleFlag;
window.toggleMatrix = toggleMatrix;
window.openSubmitConfirm = openSubmitConfirm;
window.closeSubmitConfirm = closeSubmitConfirm;
window.submitTestFinal = submitTestFinal;
window.goToDashboard = goToDashboard;
