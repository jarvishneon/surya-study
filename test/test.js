// ==========================================
// RJ STUDY ACADEMY - DYNAMIC EXAM CONTROLLER (DIRECT START - NO MODAL)
// ==========================================

const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";

let testConfig = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let remainingSeconds = 0;
let studentName = "";

document.addEventListener("DOMContentLoaded", () => {
    fetchConfigAndInit();
});

async function fetchConfigAndInit() {
    try {
        const res = await fetch(`${WORKER_URL}/api/config?t=${Date.now()}`);
        if (!res.ok) throw new Error("Server Error");
        testConfig = await res.json();

        if (testConfig.status !== "open") {
            showLockedScreen("TEST CURRENTLY CLOSED", "This test is currently closed or locked by Admin. Please contact Academy Admin.");
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

    // Auto-detect student name from login session (No modal popups needed!)
    studentName = sessionStorage.getItem("student_name") || localStorage.getItem("rjStudyUsername") || "Guest Student";
    sessionStorage.setItem("student_name", studentName);

    // Hide credentials modal permanently if present in DOM
    const modal = document.getElementById("student-modal");
    if (modal) modal.classList.add("hidden");

    // DIRECT START EXAM
    initExam();
}

function initExam() {
    const studentDisplay = document.getElementById("student-display-name");
    if (studentDisplay) studentDisplay.innerText = studentName;

    const candidateHeader = document.querySelector('.candidate-info') || document.querySelector('header');
    if (candidateHeader) {
        const candidateEl = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && el.textContent.includes('CANDIDATE:'));
        if (candidateEl) candidateEl.textContent = `CANDIDATE: ${studentName}`;
    }

    const examApp = document.getElementById("exam-app");
    if (examApp) examApp.classList.remove("hidden");

    remainingSeconds = (testConfig.durationMinutes || 45) * 60;
    renderPalette();
    loadQuestion(0);
    startTimer();
}

function renderPalette() {
    const grid = document.getElementById("palette-grid");
    if (!grid) return;
    grid.innerHTML = "";
    testConfig.questions.forEach((q, idx) => {
        const btn = document.createElement("button");
        btn.className = "palette-num";
        btn.innerText = idx + 1;
        btn.id = `palette-item-${idx}`;
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
        textarea.style.cssText = "width:100%; height:120px; background:#111; color:#00f2ff; border:1px solid #00f2ff; padding:12px; font-family:monospace; border-radius:5px;";
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
    if (nextBtn) nextBtn.innerText = index === testConfig.questions.length - 1 ? "FINISH ►" : "NEXT ►";

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
    const formatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    const timerElem = document.getElementById("exam-timer");
    if (timerElem) {
        timerElem.innerText = formatted;
        if (remainingSeconds <= 60) timerElem.style.color = "#ff0055";
    }
}

function confirmSubmission() {
    const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k] !== "").length;
    const totalCount = testConfig.questions.length;
    
    const summary = document.getElementById("submission-summary");
    if (summary) {
        summary.innerText = `You have answered ${answeredCount} out of ${totalCount} questions. Submit test now?`;
    }
    
    const modal = document.getElementById("confirm-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeConfirmModal() {
    const modal = document.getElementById("confirm-modal");
    if (modal) modal.classList.add("hidden");
}

async function finalSubmitExam() {
    if (timerInterval) clearInterval(timerInterval);
    closeConfirmModal();

    const now = Date.now();
    const payload = {
        studentName: studentName || "Student",
        testId: testConfig.testId,
        answers: userAnswers,
        submittedAt: now
    };

    try {
        const res = await fetch(`${WORKER_URL}/api/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.success) {
            localStorage.setItem(`submitted_${testConfig.testId}`, "true");
            localStorage.setItem(`submitted_time_${testConfig.testId}`, now.toString());
            showLockedScreen("TEST SUBMITTED SUCCESSFULLY", `Thank you, ${studentName}. Score: ${result.score}. Result sent to Admin Telegram!`);
        } else {
            alert(result.error || "Submission failed.");
        }
    } catch (err) {
        alert("Submission failed. Check network connection.");
    }
}

function autoSubmitExam() {
    alert("Time limit reached! Auto-submitting your exam.");
    finalSubmitExam();
}

function showLockedScreen(title, msg) {
    const examApp = document.getElementById("exam-app");
    if (examApp) examApp.classList.add("hidden");

    const studentModal = document.getElementById("student-modal");
    if (studentModal) studentModal.classList.add("hidden");

    const lTitle = document.getElementById("locked-title");
    if (lTitle) lTitle.innerText = title;

    const lMsg = document.getElementById("locked-message");
    if (lMsg) lMsg.innerText = msg;

    const lockedScreen = document.getElementById("locked-screen");
    if (lockedScreen) lockedScreen.classList.remove("hidden");
}
