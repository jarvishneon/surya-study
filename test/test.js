// ==========================================
// RJ STUDY ACADEMY - SECURE EXAM CONTROLLER
// ==========================================

const testConfig = {
    testId: "TEST_001",
    testName: "Secured Entrance Test",
    durationMinutes: 30, // Test duration in minutes
    questions: [
        {
            id: 1,
            type: "mcq",
            question: "What is the primary execution environment for Cloudflare Workers?",
            options: ["Node.js", "V8 JavaScript Engine", "Python VM", "Docker Container"],
            correctOption: 1
        },
        {
            id: 2,
            type: "mcq",
            question: "Which CSS property is used for glowing neon text effects?",
            options: ["text-shadow", "box-shadow", "color-glow", "border-radius"],
            correctOption: 0
        },
        {
            id: 3,
            type: "typed",
            question: "Briefly explain what an API is and why it is used in web development."
        }
    ]
};

// ⚠️ यहाँ अपना CLOUDFLARE WORKER URL पेस्ट करें:
const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev/";

// Global State
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let remainingSeconds = testConfig.durationMinutes * 60;
let studentName = "";

// Initialize App on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    checkLockStatus();
});

function checkLockStatus() {
    const isSubmitted = localStorage.getItem(`submitted_${testConfig.testId}`);
    if (isSubmitted) {
        showLockedScreen("TEST ALREADY SUBMITTED", "You have already completed and submitted this test. Re-opening is disabled.");
        return;
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
        alert("Please enter a valid Name or Roll Number.");
        return;
    }
    studentName = input;
    sessionStorage.setItem("student_name", studentName);
    document.getElementById("student-modal").classList.add("hidden");
    initExam();
}

function initExam() {
    document.getElementById("student-display-name").innerText = studentName;
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
        if (idx === currentQuestionIndex) {
            btn.classList.add("active");
        }
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
            if (userAnswers[index] === optIdx) {
                card.classList.add("selected");
            }

            card.onclick = () => selectMCQOption(optIdx);

            card.innerHTML = `
                <input type="radio" name="option" ${userAnswers[index] === optIdx ? "checked" : ""}>
                <span>${optText}</span>
            `;
            container.appendChild(card);
        });
    } else if (q.type === "typed") {
        const textarea = document.createElement("textarea");
        textarea.className = "typed-answer-box";
        textarea.placeholder = "Type your detailed answer here...";
        textarea.value = userAnswers[index] || "";
        textarea.oninput = (e) => saveTypedAnswer(e.target.value);
        container.appendChild(textarea);
    }

    document.getElementById("prev-btn").disabled = index === 0;
    document.getElementById("next-btn").innerText = index === testConfig.questions.length - 1 ? "FINISH ►" : "NEXT ►";

    updatePaletteUI();
}

function selectMCQOption(optIdx) {
    userAnswers[currentQuestionIndex] = optIdx;
    loadQuestion(currentQuestionIndex);
}

function saveTypedAnswer(val) {
    userAnswers[currentQuestionIndex] = val.trim();
    updatePaletteUI();
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
    if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
    }
}

function jumpToQuestion(idx) {
    loadQuestion(idx);
}

// Timer Logic
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

    const formatted = 
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

    let score = 0;
    let mcqTotal = 0;
    
    testConfig.questions.forEach((q, idx) => {
        if (q.type === "mcq") {
            mcqTotal++;
            if (userAnswers[idx] === q.correctOption) {
                score++;
            }
        }
    });

    const payload = {
        studentName: studentName,
        testId: testConfig.testId,
        score: `${score}/${mcqTotal}`,
        answers: userAnswers,
        submittedAt: new Date().toISOString()
    };

    // Lock local access
    localStorage.setItem(`submitted_${testConfig.testId}`, "true");

    // Send payload to Cloudflare Worker -> Telegram Admin
    try {
        if (WORKER_URL && !WORKER_URL.includes("YOUR_WORKER_SUBDOMAIN")) {
            await fetch(`${WORKER_URL}/api/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }
    } catch (err) {
        console.error("Failed to post submission to backend:", err);
    }

    showLockedScreen("TEST SUBMITTED SUCCESSFULLY", `Thank you, ${studentName}. Your answers have been recorded.`);
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
