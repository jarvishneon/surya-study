const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";
let testConfig = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval;

async function init() {
    try {
        // Fetch config from worker
        const response = await fetch(`${WORKER_URL}/api/config?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        testConfig = await response.json();

        // 1. Check if closed by Admin
        if (testConfig.status !== "open") {
            showLockedScreen("TEST CLOSED", "The administrator has closed this test.");
            return;
        }

        // 2. Reopen / Lock checks
        const testId = testConfig.testId;
        const isSubmitted = localStorage.getItem(`submitted_${testId}`);
        const submittedTimeRaw = localStorage.getItem(`submitted_time_${testId}`);

        if (isSubmitted) {
            const reopenTime = testConfig.reopenTimestamp || 0;
            const submittedTime = submittedTimeRaw ? parseInt(submittedTimeRaw, 10) : 0;

            if (reopenTime > 0 && submittedTime < reopenTime) {
                localStorage.removeItem(`submitted_${testId}`);
                localStorage.removeItem(`submitted_time_${testId}`);
                console.log("Admin reopened test. Lock cleared!");
            } else {
                showLockedScreen("ALREADY SUBMITTED", "You have already completed this test.");
                return;
            }
        }

        // Setup Modal "START ASSESSMENT" Button Handler
        setupModalHandler();

    } catch (error) {
        console.error("Failed to load test:", error);
        alert("Failed to load test configuration.");
    }
}

function setupModalHandler() {
    // Find input field and start button dynamically
    const nameInput = document.querySelector('input[type="text"]') || 
                      document.getElementById('student-name-input') || 
                      document.getElementById('candidate-name');

    const startBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent.toUpperCase().includes('START') || b.textContent.toUpperCase().includes('ASSESSMENT')
    ) || document.getElementById('start-btn');

    // Auto-fill student name if present in localStorage / sessionStorage
    const existingName = sessionStorage.getItem('student_name') || localStorage.getItem('rjStudyUsername') || "";
    if (nameInput && existingName) {
        nameInput.value = existingName;
    }

    const startExamAction = () => {
        const enteredName = nameInput ? nameInput.value.trim() : "";
        if (!enteredName) {
            alert("Please enter your Full Name or Roll Number to start.");
            if (nameInput) nameInput.focus();
            return;
        }

        sessionStorage.setItem('student_name', enteredName);

        // Find modal container and hide it
        const modalOverlay = document.querySelector('.modal-overlay') || 
                             document.querySelector('.credentials-modal') ||
                             document.getElementById('credentials-modal') ||
                             nameInput?.closest('div[style*="fixed"]') ||
                             nameInput?.parentElement?.parentElement;

        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        } else if (nameInput) {
            // Backup hide
            let parent = nameInput.parentElement;
            for (let i = 0; i < 3; i++) {
                if (parent) {
                    parent.style.display = 'none';
                    parent = parent.parentElement;
                }
            }
        }

        // Update Top Header Candidate Name
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.children.length === 0 && el.textContent.includes('Loading')) {
                el.textContent = `CANDIDATE: ${enteredName}`;
            }
        });

        // Start Test Engine
        startTest();
    };

    if (startBtn) {
        startBtn.onclick = startExamAction;
    }

    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') startExamAction();
        });
    }
}

function showLockedScreen(title, message) {
    document.body.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#0a0a0a; color:#ff0055; font-family:sans-serif; text-align:center; padding:20px;">
            <h1 style="font-size:2.5rem; text-shadow: 0 0 10px #ff0055; margin-bottom:10px;">${title}</h1>
            <p style="color:#00f2ff; font-size:1.1rem; max-width:500px;">${message}</p>
            <button onclick="location.reload()" style="margin-top:25px; padding:12px 25px; background:transparent; border:1px solid #00f2ff; color:#00f2ff; cursor:pointer; font-weight:bold; border-radius:5px;">RETRY / REFRESH</button>
        </div>
    `;
}

function startTest() {
    renderQuestionPalette();
    showQuestion(0);
    startTimer((testConfig.durationMinutes || 45) * 60);
}

function renderQuestionPalette() {
    const palette = document.getElementById('question-palette') || document.querySelector('.palette-grid') || document.querySelector('.matrix-grid');
    if (!palette) return;
    palette.innerHTML = '';
    testConfig.questions.forEach((_, idx) => {
        const btn = document.createElement('button');
        btn.textContent = idx + 1;
        btn.id = `palette-btn-${idx}`;
        btn.onclick = () => showQuestion(idx);
        palette.appendChild(btn);
    });
}

function showQuestion(index) {
    currentQuestionIndex = index;
    const q = testConfig.questions[index];
    const container = document.getElementById('question-container') || document.querySelector('.question-box') || document.querySelector('.question-card');
    if (!container) return;
    
    let html = `<h3>Question ${index + 1} of ${testConfig.questions.length}</h3><p style="font-size:1.2rem; margin:15px 0;">${q.question}</p>`;
    
    if (q.type === "mcq") {
        html += `<div class="options" style="margin-top:15px;">`;
        q.options.forEach((opt, i) => {
            const isChecked = userAnswers[index] === i ? "checked" : "";
            html += `
                <label class="option-card" style="display:block; margin:10px 0; padding:12px 15px; background:rgba(255,255,255,0.05); border:1px solid #00f2ff33; border-radius:5px; cursor:pointer;">
                    <input type="radio" name="q${index}" value="${i}" ${isChecked} onchange="saveAnswer(${index}, ${i})">
                    <span style="margin-left:10px; color:#fff;">${opt}</span>
                </label>
            `;
        });
        html += `</div>`;
    } else {
        const val = userAnswers[index] || "";
        html += `<textarea placeholder="Type your answer here..." style="width:100%; height:120px; background:#111; color:#00f2ff; border:1px solid #00f2ff; padding:10px; margin-top:10px; border-radius:5px;" oninput="saveAnswer(${index}, this.value)">${val}</textarea>`;
    }
    
    container.innerHTML = html;
    updatePaletteUI();
}

function saveAnswer(index, value) {
    userAnswers[index] = value;
    updatePaletteUI();
}

function updatePaletteUI() {
    testConfig.questions.forEach((_, idx) => {
        const btn = document.getElementById(`palette-btn-${idx}`);
        if (!btn) return;
        
        if (userAnswers[idx] !== undefined && userAnswers[idx] !== "") {
            btn.classList.add('answered');
            btn.style.background = "#00f2ff";
            btn.style.color = "#000";
        } else {
            btn.classList.remove('answered');
            btn.style.background = "";
            btn.style.color = "";
        }
        
        if (idx === currentQuestionIndex) {
            btn.style.outline = "2px solid #fff";
        } else {
            btn.style.outline = "none";
        }
    });
}

function nextQuestion() {
    if (currentQuestionIndex < testConfig.questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

function startTimer(seconds) {
    let timeLeft = seconds;
    const timerDisplay = document.getElementById('timer') || document.querySelector('.timer-display') || document.querySelector('.time-remaining');
    
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        if (timerDisplay) {
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            if (timeLeft <= 60) timerDisplay.style.color = "#ff0055";
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitTest(true);
        }
        timeLeft--;
    }, 1000);
}

async function submitTest(isAuto = false) {
    if (!isAuto && !confirm("Are you sure you want to submit the test?")) return;

    clearInterval(timerInterval);
    const studentName = sessionStorage.getItem('student_name') || "Student";
    const now = Date.now();

    const payload = {
        studentName: studentName,
        answers: userAnswers,
        submittedAt: now
    };

    try {
        const response = await fetch(`${WORKER_URL}/api/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem(`submitted_${testConfig.testId}`, "true");
            localStorage.setItem(`submitted_time_${testConfig.testId}`, now.toString());

            alert(`Test Submitted Successfully!\nYour Score: ${result.score}`);
            location.href = "../index.html";
        } else {
            alert(result.error || "Submission failed.");
        }
    } catch (error) {
        alert("Submission failed. Please check your internet connection.");
    }
}

// Run
init();
