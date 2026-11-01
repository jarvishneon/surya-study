const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";
let testConfig = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval;

async function init() {
    try {
        // Step 1: ALWAYS Fetch Server Config FIRST
        const response = await fetch(`${WORKER_URL}/api/config`);
        testConfig = await response.json();

        // Step 2: Check if Admin CLOSED the test
        if (testConfig.status !== "open") {
            showLockedScreen("TEST CLOSED", "The administrator has closed this test.");
            return;
        }

        // Step 3: Check REOPEN Override from Admin
        const testId = testConfig.testId;
        const isSubmitted = localStorage.getItem(`submitted_${testId}`);
        const submittedTime = localStorage.getItem(`submitted_time_${testId}`);

        if (isSubmitted) {
            // Agar Admin ne /reopen kiya hai (reopenTimestamp > student submission time)
            if (testConfig.reopenTimestamp && submittedTime && parseInt(submittedTime) < testConfig.reopenTimestamp) {
                // Lock unlock kar do!
                localStorage.removeItem(`submitted_${testId}`);
                localStorage.removeItem(`submitted_time_${testId}`);
                console.log("Admin reopened the test. Lock cleared!");
            } else {
                showLockedScreen("ALREADY SUBMITTED", "You have already completed this test.");
                return;
            }
        }

        // Sab sahi hai toh test shuru karo
        startTest();

    } catch (error) {
        console.error("Failed to load test:", error);
        alert("Failed to load test. Please check your connection.");
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
    document.getElementById('student-name-display').textContent = sessionStorage.getItem('student_name') || "Student";
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
    
    let html = `<h3>Question ${index + 1} of ${testConfig.questions.length}</h3><p style="font-size:1.2rem; margin:15px 0;">${q.question}</p>`;
    
    if (q.type === "mcq") {
        html += `<div class="options">`;
        q.options.forEach((opt, i) => {
            const isChecked = userAnswers[index] === i ? "checked" : "";
            html += `
                <label class="option-card" style="display:block; margin:8px 0; padding:10px; background:rgba(255,255,255,0.05); border-radius:5px; cursor:pointer;">
                    <input type="radio" name="q${index}" value="${i}" ${isChecked} onchange="saveAnswer(${index}, ${i})">
                    <span style="margin-left:10px;">${opt}</span>
                </label>
            `;
        });
        html += `</div>`;
    } else {
        const val = userAnswers[index] || "";
        html += `<textarea placeholder="Type your answer here..." style="width:100%; height:100px; background:#111; color:#fff; padding:10px;" oninput="saveAnswer(${index}, this.value)">${val}</textarea>`;
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
    const timerDisplay = document.getElementById('timer');
    
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
    const studentName = sessionStorage.getItem('student_name') || "Guest Student";

    const payload = {
        studentName: studentName,
        answers: userAnswers,
        submittedAt: Date.now()
    };

    try {
        const response = await fetch(`${WORKER_URL}/api/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.success) {
            // Lock test in student's browser
            localStorage.setItem(`submitted_${testConfig.testId}`, "true");
            localStorage.setItem(`submitted_time_${testConfig.testId}`, Date.now().toString());

            alert(`Test Submitted Successfully!\nYour Score: ${result.score}`);
            location.href = "../index.html";
        } else {
            alert(result.error || "Submission failed.");
        }
    } catch (error) {
        alert("Submission failed. Please check your internet connection.");
    }
}

// Shuruat
init();
