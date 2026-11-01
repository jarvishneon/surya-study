// ==========================================
// RJ STUDY ACADEMY - DYNAMIC EXAM CONTROLLER
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
        const res = await fetch(`${WORKER_URL}/api/config`);
        testConfig = await res.json();

        if (testConfig.status !== "open") {
            showLockedScreen("TEST CURRENTLY CLOSED", "This test is currently closed or locked by Admin. Please contact Academy Admin.");
            return;
        }

        checkLockStatus();
    } catch (err) {
        alert("Server connection error. Please refresh.");
    }
}

function checkLockStatus() {
    const isSubmitted = localStorage.getItem(`submitted_${testConfig.testId}`);
    const submittedTime = localStorage.getItem(`submitted_time_${testConfig.testId}`);

    if (isSubmitted) {
        // If Admin issued /reopen command AFTER student submitted -> Unlock test!
        if (testConfig.reopenTimestamp && submittedTime && parseInt(submittedTime) < testConfig.reopenTimestamp) {
            localStorage.removeItem(`submitted_${testConfig.testId}`);
            localStorage.removeItem(`submitted_time_${testConfig.testId}`);
        } else {
            showLockedScreen("TEST ALREADY SUBMITTED", "You have already completed this test.");
            return;
        }
    }

    const savedName = sessionStorage.getItem("student_name");
    if (savedName) {
        studentName = savedName;
        document.getElementById("student-modal").classList.add("hidden");
        initExam();
    } else {
        document.getElementById("student-modal").classList.remove("hidden");
    }
}

function startExamSession() {
    const input = document.getElementById("student-name-input").value.trim();
    if (!input) {
        alert("Please enter your name.");
        return;
    }
    studentName = input;
    sessionStorage.setItem("student_name", studentName);
    document.getElementById("student-modal").classList.add("hidden");
    initExam();
}

function initExam() {
    document.getElementById("student-display-name").innerText = studentName;
    remainingSeconds = testConfig.durationMinutes * 60;
    renderPalette();
    loadQuestion(0);
    startTimer();
}

function renderPalette() {
    const grid = document.getElementById("palette-grid");
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

    document.getElementById("question-number").innerText = `QUESTION ${index + 1} OF ${testConfig.questions.length}`;
    document.getElementById("question-type-badge").innerText = q.type.toUpperCase();
    document.getElementById("question-text").innerText = q.question;

    const container = document.getElementById("options-container");
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
    }

    document.getElementById("prev-btn").disabled = index === 0;
    document.getElementById("next-btn").innerText = index === testConfig.questions.length - 1 ? "FINISH ►" : "NEXT ►";
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
    document.getElementById("exam-timer").innerText = formatted;
}

function confirmSubmission() {
    const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k] !== "").length;
    const totalCount = testConfig.questions.length;
    document.getElementById("submission-summary").innerText =
        `You have answered ${answeredCount} out of ${totalCount} questions. Submit test now?`;
    document.getElementById("confirm-modal").classList.remove("hidden");
}

function closeConfirmModal() {
    document.getElementById("confirm-modal").classList.add("hidden");
}

async function finalSubmitExam() {
    clearInterval(timerInterval);
    document.getElementById("confirm-modal").classList.add("hidden");

    const payload = {
        studentName: studentName,
        testId: testConfig.testId,
        answers: userAnswers,
        submittedAt: new Date().toISOString()
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
            localStorage.setItem(`submitted_time_${testConfig.testId}`, Date.now().toString());
            showLockedScreen("TEST SUBMITTED SUCCESSFULLY", `Thank you, ${studentName}. Score logged and sent to Admin Telegram!`);
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
    document.getElementById("exam-app").classList.add("hidden");
    document.getElementById("student-modal").classList.add("hidden");
    document.getElementById("locked-title").innerText = title;
    document.getElementById("locked-message").innerText = msg;
    document.getElementById("locked-screen").classList.remove("hidden");
}
