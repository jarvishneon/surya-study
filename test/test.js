const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";
let testConfig = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval;

async function init() {
    try {
        const response = await fetch(`${WORKER_URL}/api/config`);
        testConfig = await response.json();

        // Pehle check karein Admin ne Test band to nahi kiya
        if (testConfig.status !== "open") {
            showLockedScreen("TEST CLOSED", "The administrator has closed this test.");
            return;
        }

        // Ab check karein Reopen logic
        const testId = testConfig.testId;
        const isSubmitted = localStorage.getItem(`submitted_${testId}`);
        const submittedTime = localStorage.getItem(`submitted_time_${testId}`);

        // REOPEN LOGIC: Agar server ka timestamp student ke submission time se naya hai
        if (isSubmitted && testConfig.reopenTimestamp) {
            if (parseInt(submittedTime) < testConfig.reopenTimestamp) {
                // Clear the old lock!
                localStorage.removeItem(`submitted_${testId}`);
                localStorage.removeItem(`submitted_time_${testId}`);
                console.log("Admin has reopened the test. Lock cleared.");
            } else {
                showLockedScreen("ALREADY SUBMITTED", "You have already completed this test.");
                return;
            }
        } else if (isSubmitted) {
            showLockedScreen("ALREADY SUBMITTED", "You have already completed this test.");
            return;
        }

        startTest();
    } catch (error) {
        console.error("Failed to load test:", error);
        alert("Failed to load test configuration.");
    }
}

function showLockedScreen(title, message) {
    document.body.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#0a0a0a; color:#ff0055; font-family:sans-serif; text-align:center; padding:20px;">
            <h1 style="font-size:3rem; text-shadow: 0 0 10px #ff0055;">${title}</h1>
            <p style="color:#00f2ff; font-size:1.2rem;">${message}</p>
            <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; background:transparent; border:1px solid #00f2ff; color:#00f2ff; cursor:pointer;">RETRY</button>
        </div>
    `;
}

function startTest() {
    document.getElementById('student-name-display').textContent = sessionStorage.getItem('student_name') || "Guest Student";
    renderQuestionPalette();
    showQuestion(0);
    startTimer(testConfig.durationMinutes * 60);
}

function renderQuestionPalette() {
    const palette = document.getElementById('question-palette');
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
    const container = document.getElementById('question-container');
    
    let html = `<h3>Question ${index + 1}</h3><p>${q.question}</p>`;
    
    if (q.type === "mcq") {
        html += `<div class="options">`;
        q.options.forEach((opt, i) => {
            const isChecked = userAnswers[index] === opt ? "checked" : "";
            html += `
                <label class="option-card">
                    <input type="radio" name="q${index}" value="${opt}" ${isChecked} onchange="saveAnswer(${index}, '${opt}')">
                    ${opt}
                </label>
            `;
        });
        html += `</div>`;
    } else {
        const val = userAnswers[index] || "";
        html += `<textarea placeholder="Type your answer here..." oninput="saveAnswer(${index}, this.value)">${val}</textarea>`;
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
        if (userAnswers[idx]) {
            btn.classList.add('answered');
        } else {
            btn.classList.remove('answered');
        }
        
        if (idx === currentQuestionIndex) {
            btn.style.border = "2px solid #fff";
        } else {
            btn.style.border = "none";
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
    const timerDisplay = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 60) timerDisplay.style.color = "#ff0055";
        
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
    const studentName = sessionStorage.getItem('student_name') || "Unknown";

    const payload = {
        studentName: studentName,
        testId: testConfig.testId,
        answers: userAnswers
    };

    try {
        const response = await fetch(`${WORKER_URL}/api/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        // Lock the test for this student
        localStorage.setItem(`submitted_${testConfig.testId}`, "true");
        localStorage.setItem(`submitted_time_${testConfig.testId}`, Date.now().toString());

        alert(`Test Submitted Successfully!\nScore: ${result.score}/${result.total}`);
        location.href = "../index.html";
    } catch (error) {
        alert("Submission failed. Please check your internet.");
    }
}

// Start
init();
