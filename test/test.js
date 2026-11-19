// ==========================================================================
// RJ ACADEMY PRO - Core Functional Script (v29.1 LOCK FIX)
// Multi-Subject | Server-Side Lock + localStorage Backup | Server Timer
// Login Required | Question Shuffle
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
let sessionId = "";
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

// ==================== HELPERS: LOCAL LOCK BACKUP ====================
function localLockKey(subject) {
    return `submitted_${String(subject || "english").toLowerCase().trim()}`;
}
function localLockTimeKey(subject) {
    return `submitted_time_${String(subject || "english").toLowerCase().trim()}`;
}
function setLocalLock(subject) {
    // Reattempts are enabled: submissions never create a local lock.
    clearLocalLock(subject);
}
function clearLocalLock(subject) {
    try {
        localStorage.removeItem(localLockKey(subject));
        localStorage.removeItem(localLockTimeKey(subject));
    } catch (e) {}
}
function hasLocalLock(subject) {
    try {
        return localStorage.getItem(localLockKey(subject)) === "true";
    } catch (e) {
        return false;
    }
}


function draftStorageKey() {
    return `rj_test_draft_${String(studentName || "").trim().toLowerCase()}_${String(currentSubject || "english").toLowerCase()}`;
}
function saveDraft() {
    // Save the complete in-progress state, not only the selected answers.
    // This lets a student resume at the same question after refresh/network loss.
    try {
        const draft = {
            version: 2,
            answers: userAnswers,
            currentQIndex,
            visitedQuestions: Array.from(visitedQuestions),
            flaggedQuestions: Array.from(flaggedQuestions),
            savedAt: Date.now()
        };
        localStorage.setItem(draftStorageKey(), JSON.stringify(draft));
    } catch (e) {
        console.warn("Could not save test progress locally:", e);
    }
}
function restoreDraft() {
    try {
        const raw = localStorage.getItem(draftStorageKey());
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;

        // Backward compatibility: v30 drafts stored only the answers object.
        if (parsed.version === 2 && parsed.answers && typeof parsed.answers === "object") {
            userAnswers = parsed.answers;
            const maxIndex = Math.max(0, (testConfig?.questions?.length || 1) - 1);
            currentQIndex = Math.min(maxIndex, Math.max(0, Number(parsed.currentQIndex) || 0));
            visitedQuestions = new Set(
                (Array.isArray(parsed.visitedQuestions) ? parsed.visitedQuestions : [])
                    .map(Number).filter(i => Number.isInteger(i) && i >= 0 && i <= maxIndex)
            );
            flaggedQuestions = new Set(
                (Array.isArray(parsed.flaggedQuestions) ? parsed.flaggedQuestions : [])
                    .map(Number).filter(i => Number.isInteger(i) && i >= 0 && i <= maxIndex)
            );
        } else {
            userAnswers = parsed; // legacy answers-only draft
            currentQIndex = 0;
        }
    } catch (e) {
        console.warn("Could not restore test draft:", e);
        userAnswers = {};
        currentQIndex = 0;
    }
}
function clearDraft() {
    try { localStorage.removeItem(draftStorageKey()); } catch (e) {}
}

// Save progress immediately when the page is being refreshed, closed, or hidden.
window.addEventListener("beforeunload", saveDraft);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && testStarted && !isSubmitting) saveDraft();
});

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
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

// ==================== FETCH CONFIG ====================
async function fetchConfigAndInit() {
    try {
        const res = await fetch(
            `${WORKER_URL}/api/config?subject=${encodeURIComponent(currentSubject)}&student=${encodeURIComponent(studentName)}&t=${Date.now()}`
        );

        const data = await res.json();

        if (data.error === "LOGIN_REQUIRED" || res.status === 401) {
            showLockedScreen("LOGIN REQUIRED", "Please login from Dashboard first.");
            setTimeout(() => { window.location.href = DASHBOARD_URL; }, 2500);
            return;
        }

        if (!res.ok) throw new Error(data.error || "Server Error");

        testConfig = data;

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

        if (testConfig.subject) currentSubject = testConfig.subject.toLowerCase();
        restoreDraft();

        beginTest();
    } catch (err) {
        console.error("Config fetch error:", err);
        showLockedScreen(
            "CONNECTION ERROR",
            "Could not load test. Please check internet and try again."
        );
    }
}

// ==================== START TEST ====================
async function beginTest() {
    const titleEl = document.getElementById("test-title-display");
    if (titleEl) {
        titleEl.innerText = testConfig.title || testConfig.testName || currentSubject.toUpperCase();
    }

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
            if (typeof startData.timeRemaining === "number") {
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
    // Resume from the last saved question instead of always restarting at Q1.
    const resumeIndex = Math.min(
        Math.max(0, Number(currentQIndex) || 0),
        testConfig.questions.length - 1
    );
    renderQuestion(resumeIndex);
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
        } catch (e) {}
    }, 15000);
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
    saveDraft();
    const nextBtn = document.getElementById("mob-next-btn");
    if (nextBtn) {
        const isLastQuestion = index === testConfig.questions.length - 1;
        nextBtn.innerHTML = isLastQuestion
            ? 'Save & Submit'
            : 'Save & Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        nextBtn.classList.toggle("save-submit-btn", isLastQuestion);
    }

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
            saveDraft();
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
    saveDraft();
    renderQuestion(currentQIndex);
}

function toggleFlag() {
    if (flaggedQuestions.has(currentQIndex)) {
        flaggedQuestions.delete(currentQIndex);
    } else {
        flaggedQuestions.add(currentQIndex);
    }
    saveDraft();
    renderQuestion(currentQIndex);
}

function nextQuestion() {
    // Persist the current response before moving to the next question.
    saveDraft();
    if (currentQIndex < testConfig.questions.length - 1) {
        renderQuestion(currentQIndex + 1);
    } else {
        openSubmitConfirm();
    }
}

function prevQuestion() {
    if (currentQIndex > 0) {
        renderQuestion(currentQIndex - 1);
    }
}

// ==================== MATRIX ====================
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

// ==================== FAB ====================
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

    const answersArray = [];
    for (let i = 0; i < testConfig.questions.length; i++) {
        answersArray.push(userAnswers[i] !== undefined ? userAnswers[i] : "");
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

        if (result.success === true) {
            // Reattempts remain enabled after every successful submission.
            clearLocalLock(currentSubject);
            clearDraft();
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

// ==================== SCORECARD ====================
function showResultScreen(result, name) {
    const score = result.score !== undefined ? result.score : "—";
    const total = result.total !== undefined ? result.total : (testConfig ? testConfig.questions.length : "—");
    const attempted = result.attempted !== undefined ? result.attempted : "—";
    const unattempted = result.unattempted !== undefined ? result.unattempted : "—";
    const wrong = result.attempted !== undefined && result.score !== undefined ? result.attempted - result.score : "—";

    const titleEl = document.getElementById("locked-title");
    if (titleEl) titleEl.innerText = "Assessment Completed";

    const msgEl = document.getElementById("locked-message");
    if (msgEl) {
        msgEl.innerText = `Well done, ${name}! Your ${currentSubject.toUpperCase()} test has been recorded.`;
    }

    const scoreDisplay = document.getElementById("final-score-display");
    if (scoreDisplay) {
        scoreDisplay.style.display = "block";
        const marksEl = document.getElementById("final-marks");
        if (marksEl) marksEl.innerText = `${score}/${total}`;
        const correctEl = document.getElementById("final-correct");
        if (correctEl) correctEl.innerText = score;
        const wrongEl = document.getElementById("final-wrong");
        if (wrongEl) wrongEl.innerText = wrong;
        const attEl = document.getElementById("final-attempted");
        if (attEl) attEl.innerText = attempted;
        const unEl = document.getElementById("final-unattempted");
        if (unEl) unEl.innerText = unattempted;
    }

    const timeEl = document.getElementById("locked-timestamp");
    if (timeEl) timeEl.innerText = `Submitted: ${new Date().toLocaleString("en-IN")}`;

    renderDetailedReview(result.detailedResults || []);
    const dashBtn = document.getElementById("dash-btn");
    if (dashBtn) dashBtn.innerText = "Back to Dashboard / Reattempt";
    const lockedScreen = document.getElementById("locked-screen");
    if (lockedScreen) lockedScreen.classList.remove("hidden");
}

function renderDetailedReview(items) {
    const host = document.getElementById("detailed-review");
    if (!host) return;
    host.innerHTML = "";
    const heading = document.createElement("h3");
    heading.className = "review-heading";
    heading.textContent = "Your Answer Review";
    host.appendChild(heading);

    if (!Array.isArray(items) || !items.length) {
        const note = document.createElement("p");
        note.textContent = "Detailed answer review is unavailable for this submission.";
        host.appendChild(note);
        return;
    }

    items.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = `review-card review-${item.status || (item.isCorrect ? "correct" : "wrong")}`;
        const status = item.status === "unattempted" ? "UNATTEMPTED" : (item.isCorrect ? "CORRECT" : "INCORRECT");
        const q = document.createElement("h4");
        q.textContent = `Q${index + 1}. ${item.question || ""}`;
        const badge = document.createElement("span");
        badge.className = "review-status";
        badge.textContent = status;
        const your = document.createElement("p");
        your.textContent = `Your answer: ${item.selectedAnswer || "Not attempted"}`;
        const correct = document.createElement("p");
        correct.className = "review-correct-answer";
        correct.textContent = `Correct answer: ${item.correctAnswer || "—"}`;
        card.append(q, badge, your, correct);
        if (item.explanation) {
            const explanation = document.createElement("p");
            explanation.className = "review-explanation";
            explanation.textContent = `Review: ${item.explanation}`;
            card.appendChild(explanation);
        } else if (item.status === "wrong") {
            const mistake = document.createElement("p");
            mistake.className = "review-explanation";
            mistake.textContent = "Mistake: Your selected answer does not match the correct answer.";
            card.appendChild(mistake);
        }
        host.appendChild(card);
    });
}

function showLockedScreen(title, msg) {
    const titleEl = document.getElementById("locked-title");
    if (titleEl && title) titleEl.innerText = title;

    const msgEl = document.getElementById("locked-message");
    if (msgEl) msgEl.innerText = msg;

    const scoreDisplay = document.getElementById("final-score-display");
    if (scoreDisplay) scoreDisplay.style.display = "none";

    const timeEl = document.getElementById("locked-timestamp");
    if (timeEl) timeEl.innerText = `Time: ${new Date().toLocaleString("en-IN")}`;

    const review = document.getElementById("detailed-review");
    if (review) review.innerHTML = "";
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

// Global bindings
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.toggleFlag = toggleFlag;
window.toggleMatrix = toggleMatrix;
window.openSubmitConfirm = openSubmitConfirm;
window.closeSubmitConfirm = closeSubmitConfirm;
window.submitTestFinal = submitTestFinal;
window.goToDashboard = goToDashboard;
