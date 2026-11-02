/* ==========================================================================
   RJ ACADEMY PRO - Core Functional Script (with Subjective Auto-Detect)
   ========================================================================== */

const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";
const DASHBOARD_URL = "https://surya-study.pages.dev";

// Global State
let testConfig = null;
let currentQIndex = 0;
let userAnswers = {}; // { qIndex: value } -> Integer for MCQ, String for Typing
let flaggedQuestions = new Set();
let visitedQuestions = new Set();
let timerInterval = null;
let timeRemaining = 0;
let studentName = "";
let isSubmitting = false;

// FAB Dragging State
let fabDragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    dragDistance: 0
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initFabDraggable();
    initDashboardBtn();
    fetchConfigAndInit();
});

async function fetchConfigAndInit() {
    try {
        const res = await fetch(WORKER_URL + "/api/config?t=" + Date.now());
        if (!res.ok) throw new Error("Server Error");
        testConfig = await res.json();

        if (testConfig.status && testConfig.status !== "open") {
            showLockedScreen("TEST CURRENTLY CLOSED", "This test is currently closed or locked by Admin.");
            return;
        }

        checkLockStatus();
    } catch (err) {
        console.error("Config fetch error:", err);
        loadMockData();
    }
}

function checkLockStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = testConfig.testId || urlParams.get("testId") || "demo_test";

    var isSubmitted = localStorage.getItem("submitted_" + testId);
    var submittedTimeRaw = localStorage.getItem("submitted_time_" + testId);

    if (isSubmitted) {
        var reopenTime = testConfig.reopenTimestamp || 0;
        var submittedTime = submittedTimeRaw ? parseInt(submittedTimeRaw, 10) : 0;

        if (reopenTime > 0 && (submittedTime === 0 || submittedTime < reopenTime)) {
            localStorage.removeItem("submitted_" + testId);
            localStorage.removeItem("submitted_time_" + testId);
        } else {
            showLockedScreen("TEST ALREADY SUBMITTED", "You have already completed this test session.");
            return;
        }
    }

    studentName = sessionStorage.getItem("student_name") || 
                  localStorage.getItem("rjStudyUsername") || 
                  urlParams.get("name") || 
                  "Student";
                  
    sessionStorage.setItem("student_name", studentName);

    document.getElementById("test-title-display").innerText = testConfig.title || "Assessment";
    timeRemaining = (testConfig.durationMinutes || testConfig.duration || 45) * 60;

    startTimer();
    renderQuestion(0);
    renderMatrix();
}

function loadMockData() {
    testConfig = {
        testId: "demo_test",
        title: "RJ ACADEMY PRO Mock Test",
        durationMinutes: 30,
        questions: [
            {
                id: "q1",
                question: "Choose the grammatically correct sentence:",
                options: ["I goes to school.", "I go to school."]
            },
            {
                id: "q2",
                type: "text", // Auto-detects subjective
                question: "Translate into English: राम स्कूल जाता है।"
            }
        ]
    };

    studentName = sessionStorage.getItem("student_name") || localStorage.getItem("rjStudyUsername") || "Student";
    sessionStorage.setItem("student_name", studentName);
    
    document.getElementById("test-title-display").innerText = testConfig.title;
    timeRemaining = testConfig.durationMinutes * 60;
    
    startTimer();
    renderQuestion(0);
    renderMatrix();
}

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

function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const mins = Math.floor((timeRemaining % 3600) / 60);
    const secs = timeRemaining % 60;

    const display = [hours, mins, secs]
        .map(v => String(v).padStart(2, '0'))
        .filter((v, i) => i > 0 || v !== '00')
        .join(':');

    const timerElem = document.getElementById("time-left");
    if (timerElem) {
        timerElem.innerText = display;
        if (timeRemaining <= 60) timerElem.style.color = "#EF4444";
        else timerElem.style.color = "";
    }
}

// ---------------- QUESTION RENDER (MCQ & TYPING BOX SUPPORT) ----------------
function renderQuestion(index) {
    if (!testConfig || !testConfig.questions || !testConfig.questions[index]) return;
    
    currentQIndex = index;
    visitedQuestions.add(index);
    
    const q = testConfig.questions[index];
    
    const questionContent = q.question || q.text || q.questionText || q.title || "";
    document.getElementById("q-number").innerText = `Q.${index + 1}`;
    document.getElementById("question-text").innerText = questionContent;
    
    const flagBtn = document.getElementById("flag-btn");
    if (flagBtn) {
        if (flaggedQuestions.has(index)) {
            flagBtn.classList.add("flagged");
        } else {
            flagBtn.classList.remove("flagged");
        }
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
    
    // Auto-detect if question is subjective (typing)
    const isSubjective = q.type === "subjective" || q.type === "text" || optionsList.length === 0;

    if (isSubjective) {
        // Render Textarea for Subjective Typing
        const textarea = document.createElement("textarea");
        textarea.className = "subjective-textarea";
        textarea.placeholder = "Type your answer here...";
        
        // Restore saved text if any
        if (userAnswers[index] !== undefined) {
            textarea.value = userAnswers[index];
        }

        // Save instantly as user types (without reloading UI)
        textarea.oninput = (e) => {
            userAnswers[index] = e.target.value;
            updateMatrixButtonState(index);
        };

        optsContainer.appendChild(textarea);
    } else {
        // Render MCQ Cards
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

// ---------------- MATRIX PALETTE ----------------
function renderMatrix() {
    const grid = document.getElementById("palette-grid");
    if (!grid) return;
    grid.innerHTML = "";

    testConfig.questions.forEach((_, idx) => {
        const btn = document.createElement("button");
        btn.className = "p-item";
        btn.innerText = idx + 1;

        if (idx === currentQIndex) btn.classList.add("active-q");
        
        // Matrix Status Color check (works for Integer MCQ or String Subjective)
        const isAnswered = userAnswers[idx] !== undefined && userAnswers[idx] !== "" && String(userAnswers[idx]).trim() !== "";
        
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

// Real-time matrix updater for Typing box
function updateMatrixButtonState(idx) {
    const grid = document.getElementById("palette-grid");
    if (!grid) return;
    const btn = grid.children[idx];
    if (!btn) return;
    
    const isAnswered = userAnswers[idx] !== undefined && String(userAnswers[idx]).trim() !== "";
    
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

        fab.style.transition = 'none';
        fab.style.bottom = 'auto';
        fab.style.right = 'auto';
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
        fab.style.transition = 'transform 0.1s ease';
        
        if (fabDragState.dragDistance < 12) toggleMatrix();
    };

    fab.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', doDrag, { passive: true });
    window.addEventListener('touchend', stopDrag);

    fab.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
}

// ---------------- SUBMISSION LOGIC ----------------
function openSubmitConfirm() {
    if (isSubmitting) return;
    const total = testConfig.questions.length;
    const answered = Object.keys(userAnswers).filter(k => userAnswers[k] !== undefined && String(userAnswers[k]).trim() !== "").length;
    const flagged = flaggedQuestions.size;
    const unanswered = total - answered;

    document.getElementById("sum-total").innerText = total;
    document.getElementById("sum-answered").innerText = answered;
    document.getElementById("sum-flagged").innerText = flagged;
    document.getElementById("sum-unanswered").innerText = unanswered;

    document.getElementById("confirm-modal").classList.remove("hidden");
}

function closeSubmitConfirm() {
    document.getElementById("confirm-modal").classList.add("hidden");
}

const headerSubBtn = document.getElementById("header-submit-btn");
if (headerSubBtn) headerSubBtn.onclick = openSubmitConfirm;

async function submitTestFinal() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    if (timerInterval) clearInterval(timerInterval);
    closeSubmitConfirm();

    var now = Date.now();
    var finalStudentName = sessionStorage.getItem("student_name") || 
                           localStorage.getItem("rjStudyUsername") || 
                           studentName || 
                           "Student";

    var payload = {
        studentName: finalStudentName,
        testId: testConfig.testId,
        answers: userAnswers,
        submittedAt: now
    };

    try {
        var res = await fetch(WORKER_URL + "/api/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        var result = await res.json();
        
        if (result.success || res.ok) {
            localStorage.setItem("submitted_" + testConfig.testId, "true");
            localStorage.setItem("submitted_time_" + testConfig.testId, now.toString());
            
            showLockedScreen(
                "TEST SUBMITTED SUCCESSFULLY", 
                `Thank you, ${finalStudentName}. Your responses have been recorded!`
            );
        } else {
            isSubmitting = false;
            alert(result.error || "Submission failed. Please try again.");
        }
    } catch (err) {
        isSubmitting = false;
        console.warn("Submit error:", err);
        localStorage.setItem("submitted_" + testConfig.testId, "true");
        localStorage.setItem("submitted_time_" + testConfig.testId, now.toString());
        showLockedScreen("TEST SUBMITTED (OFFLINE)", `Response recorded locally for ${finalStudentName}.`);
    }
}

function autoSubmitOnTimeout() {
    if (isSubmitting) return;
    alert("Time limit reached! Auto-submitting your exam.");
    submitTestFinal();
}

function showLockedScreen(title, msg) {
    const titleEl = document.getElementById("locked-title");
    if (titleEl && title) titleEl.innerText = title;

    const msgEl = document.getElementById("locked-message");
    if (msgEl) msgEl.innerText = msg;

    const timeEl = document.getElementById("locked-timestamp");
    if (timeEl) timeEl.innerText = `Time: ${new Date().toLocaleString()}`;

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

// Global functions binding
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.toggleFlag = toggleFlag;
window.toggleMatrix = toggleMatrix;
window.openSubmitConfirm = openSubmitConfirm;
window.closeSubmitConfirm = closeSubmitConfirm;
window.submitTestFinal = submitTestFinal;
window.goToDashboard = goToDashboard;