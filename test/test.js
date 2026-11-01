// ==========================================
// RJ STUDY ACADEMY - DIRECT TEST ENGINE (SUBMIT FIXED)
// ==========================================

// Sirf CREDENTIALS modal ko hide karo — Confirm/Submit modal ko MAT chhua
const killModalStyle = document.createElement('style');
killModalStyle.innerHTML = `
    #student-modal,
    .student-modal,
    .credentials-modal {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }
    #exam-app {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
    /* Confirm modal hamesha upar rahe */
    #confirm-modal:not(.hidden) {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        z-index: 9999 !important;
    }
    #locked-screen:not(.hidden) {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 9999 !important;
    }
`;
document.head.appendChild(killModalStyle);

const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";

let testConfig = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let remainingSeconds = 0;
let studentName = "";
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", () => {
    removeCredentialsModal();
    fetchConfigAndInit();
});

function removeCredentialsModal() {
    const el = document.getElementById("student-modal");
    if (el) el.style.setProperty("display", "none", "important");

    document.querySelectorAll("div, section").forEach((node) => {
        const t = (node.textContent || "").trim();
        if (t.includes("ENTER EXAM CREDENTIALS") && node.children.length < 12) {
            node.style.setProperty("display", "none", "important");
        }
    });
}

async function fetchConfigAndInit() {
    try {
        const res = await fetch(`${WORKER_URL}/api/config?t=${Date.now()}`);
        if (!res.ok) throw new Error("Server Error");
        testConfig = await res.json();

        if (testConfig.status !== "open") {
            showLockedScreen(
                "TEST CURRENTLY CLOSED",
                "This test is currently closed or locked by Admin. Please contact Academy Admin."
            );
            return;
        }

        checkLockStatus();
    } catch (err) {
        console.error("Config load error:", err);
        setTimeout(fetchConfigAndInit, 3000);
    }
}

function checkLockStatus() {
    const isSubmitted = localStorage.getItem(`submitted_${testConfig.testId}`);
    const submittedTimeRaw = localStorage.getItem(`submitted_time_${testConfig.testId}`);

    if (isSubmitted) {
        const reopenTime = testConfig.reopenTimestamp || 0;
        const submittedTime = submittedTimeRaw ? parseInt(submittedTimeRaw, 10) : 0;

        if (reopenTime > 0 && (submittedTime === 0 || submittedTime < reopenTime)) {
            localStorage.removeItem(`submitted_${testConfig.testId}`);
            localStorage.removeItem(`submitted_time_${testConfig.testId}`);
            console.log("Admin issued /reopen. Lock cleared!");
        } else {
            showLockedScreen("TEST ALREADY SUBMITTED", "You have already completed this test.");
            return;
        }
    }

    studentName =
        sessionStorage.getItem("student_name") ||
        localStorage.getItem("rjStudyUsername") ||
        "Student";
    sessionStorage.setItem("student_name", studentName);

    initExam();
}

function initExam() {
    removeCredentialsModal();

    const studentDisplay = document.getElementById("student-display-name");
    if (studentDisplay) studentDisplay.innerText = studentName;

    document.querySelectorAll("*").forEach((el) => {
        if (el.children.length === 0 && (el.textContent || "").includes("CANDIDATE")) {
            el.textContent = `CANDIDATE: ${studentName}`;
        }
    });

    const examApp = document.getElementById("exam-app");
    if (examApp) {
        examApp.classList.remove("hidden");
        examApp.style.setProperty("display", "block", "important");
    }

    remainingSeconds = (testConfig.durationMinutes || 45) * 60;
    renderPalette();
    loadQuestion(0);
    startTimer();
}

function renderPalette() {
    const grid = document.getElementById("palette-grid");
    if (!grid) return;
    grid.innerHTML = "";
    testConfig.questions.forEach((_, idx) => {
        const btn = document.createElement("button");
        btn.className = "palette-num";
        btn.innerText = idx + 1;
        btn.id = `palette-item-${idx}`;
        btn.type = "button";
        btn.onclick = () => jumpToQuestion(idx);
        grid.appendChild(btn);
    });
    updatePaletteUI();
}

function updatePaletteUI() {
    testConfig.questions.forEach((_, idx) => {
        const btn = document.getElementById(`palette-item-${idx}`);
        if (!btn) return;
        btn.className = "palette-num";
        if (idx === currentQuestionIndex) btn.classList.add("active");
        if (userAnswers[idx] !== undefined && userAnswers[idx] !== "") {
            btn.classList.add("answered");
        }
    });
}

function loadQuestion(index) {
    currentQuestionIndex = index;
    const q = testConfig.questions[index];

    const qNum = document.getElementById("question-number");
    if (qNum) qNum.innerText = `QUESTION ${index + 1} OF ${testConfig.questions.length}`;

    const qBadge = document.getElementById("question-type-badge");
    if (qBadge) qBadge.innerText = (q.type || "mcq").toUpperCase();

    const qText = document.getElementById("question-text");
    if (qText) qText.innerText = q.question;

    const container = document.getElementById("options-container");
    if (!container) return;
    container.innerHTML = "";

    if (q.type === "mcq") {
        q.options.forEach((optText, optIdx) => {
            const card = document.createElement("div");
            card.className = "option-card";
            if (userAnswers[index] === optIdx) card.classList.add("selected");
            card.onclick = () => selectMCQOption(optIdx);
            card.innerHTML = `
                <input type="radio" name="option" ${userAnswers[index] === optIdx ? "checked" : ""}>
                <span>${optText}</span>
            `;
            container.appendChild(card);
        });
    } else {
        const val = userAnswers[index] || "";
        const textarea = document.createElement("textarea");
        textarea.placeholder = "Type your answer here...";
        textarea.style.cssText =
            "width:100%;height:120px;background:#111;color:#00E5FF;border:1px solid #00E5FF;padding:12px;font-family:inherit;border-radius:8px;";
        textarea.value = val;
        textarea.oninput = (e) => {
            userAnswers[index] = e.target.value;
            updatePaletteUI();
        };
        container.appendChild(textarea);
    }

    const prevBtn = document.getElementById("prev-btn");
    if (prevBtn) prevBtn.disabled = index === 0;

    const nextBtn = document.getElementById("next-btn");
    if (nextBtn) {
        nextBtn.innerText =
            index === testConfig.questions.length - 1 ? "FINISH ►" : "Next →";
    }

    updatePaletteUI();
}

function selectMCQOption(optIdx) {
    userAnswers[currentQuestionIndex] = optIdx;
    loadQuestion(currentQuestionIndex);
}

function clearAnswer() {
    delete userAnswers[currentQuestionIndex];
    loadQuestion(currentQuestionIndex);
}

function nextQuestion() {
    if (currentQuestionIndex < testConfig.questions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
    } else {
        confirmSubmission();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) loadQuestion(currentQuestionIndex - 1);
}

function jumpToQuestion(idx) {
    loadQuestion(idx);
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay();
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            autoSubmitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;
    const formatted = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    const timerElem = document.getElementById("exam-timer");
    if (timerElem) {
        timerElem.innerText = formatted;
        if (remainingSeconds <= 60) timerElem.style.color = "#EF4444";
    }
}

function confirmSubmission() {
    const answeredCount = Object.keys(userAnswers).filter(
        (k) => userAnswers[k] !== undefined && userAnswers[k] !== 
