/* ==========================================================================
   RJ ACADEMY PRO - Core Functional Script
   ========================================================================== */

const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";
const DASHBOARD_URL = "https://surya-study.pages.dev";

// Global State
let testConfig = null;
let currentQIndex = 0;
let userAnswers = {}; // { qIndex: selectedOptionIndex }
let flaggedQuestions = new Set();
let visitedQuestions = new Set();
let timerInterval = null;
let timeRemaining = 0;
let studentName = "";
let isSubmitting = false;

// FAB Dragging & Click State
let fabDragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    dragDistance: 0
};

// Application Initialization
document.addEventListener("DOMContentLoaded", () => {
    initFabDraggable();
    initDashboardBtn();
    fetchConfigAndInit();
});

// Fetch Test Config from Worker
async function fetchConfigAndInit() {
    try {
        const res = await fetch(WORKER_URL + "/api/config?t=" + Date.now());
        if (!res.ok) throw new Error("Server Error");
        testConfig = await res.json();

        // Check test open/closed status
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

// Lock Status & Reopen Logic
function checkLockStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = testConfig.testId || urlParams.get("testId") || "demo_test";

    var isSubmitted = localStorage.getItem("submitted_" + testId);
    var submittedTimeRaw = localStorage.getItem("submitted_time_" + testId);

    // Reopen test logic if Admin reset test timestamp
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

    // Student Name logic
    studentName = sessionStorage.getItem("student_name") || 
                  localStorage.getItem("rjStudyUsername") || 
                  urlParams.get("name") || 
                  "Student";
                  
    sessionStorage.setItem("student_name", studentName);

    // Display test title
    document.getElementById("test-title-display").innerText = testConfig.title || "Assessment";
    timeRemaining = (testConfig.durationMinutes || testConfig.duration || 45) * 60;

    startTimer();
    renderQuestion(0);
    renderMatrix();
}

// Fallback Mock Data
function loadMockData() {
    testConfig = {
        testId: "demo_test",
        title: "RJ ACADEMY PRO Mock Test",
        durationMinutes: 30,
        questions: [
            {
                id: "q1",
                question: "Choose the grammatically correct sentence:",
                options: [
                    "I goes to school every day.",
                    "I go to school every day.",
                    "I going to school every day.",
                    "I went to school every day."
                ]
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

// Timer Logic
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

// Question Rendering
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

    const labels = ["A", "B", "C", "D", "E"];
    const optionsList = q.options || q.choices || [];

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

    renderMatrix();
}

// Select MCQ Option
function selectOption(optIndex) {
    userAnswers[currentQIndex] = optIndex;
    renderQuestion(currentQIndex);
}

// Toggle Flag Status
function toggleFlag() {
    if (flaggedQuestions.has(currentQIndex)) {
        flaggedQuestions.delete(currentQIndex);
    } else {
        flaggedQuestions.add(currentQIndex);
    }
    renderQuestion(currentQIndex);
}

// Navigation Controls
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

// Render Palette Matrix
function renderMatrix() {
    const grid = document.getElementById("palette-grid");
    if (!grid) return;
    grid.innerHTML = "";

    testConfig.questions.forEach((_, idx) => {
        const btn = document.createElement("button");
        btn.className = "p-item";
        btn.innerText = idx + 1;

        if (idx === currentQIndex) btn.classList.add("active-q");
        
        if (userAnswers[idx] !== undefined && userAnswers[idx] !== "") {
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

// Toggle Bottom Sheet / Sidebar Matrix
function toggleMatrix() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("active-matrix");
}

// FAB Touch / Mouse Dragging Implementation
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
        
        if (fabDragState.dragDistance < 12) {
            toggleMatrix();
        }
    };

    fab.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', doDrag, { passive: true });
    window.addEventListener('touchend', stopDrag);

    fab.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
}

// Confirmation & Submission Logic
function openSubmitConfirm() {
    if (isSubmitting) return;
    const total = testConfig.questions.length;
    const answered = Object.keys(userAnswers).filter(k => userAnswers[k] !== "").length;
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

// Final Submission Logic
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

// Redirect to Dashboard (Guaranteed Absolute URL)
function goToDashboard() {
    window.location.href = DASHBOARD_URL;
}

// Direct event listener binding for Dashboard Button
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