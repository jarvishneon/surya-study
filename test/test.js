// ==========================================
// RJ STUDY ACADEMY - SECURE EXAM CONTROLLER
// ==========================================

const testConfig = {
    testId: "ENG_TENSE_001",
    testName: "Present Indefinite Tense (Hindi to English)",
    durationMinutes: 45, // 45 मिनट का टाइमर
    questions: [
        {
            id: 1, type: "mcq",
            question: "मैं रोज स्कूल जाता हूँ।",
            options: ["I goes to school every day.", "I go to school every day.", "I going to school every day.", "I went to school every day."],
            correctOption: 1
        },
        {
            id: 2, type: "mcq",
            question: "वह क्रिकेट खेलता है।",
            options: ["He play cricket.", "He playing cricket.", "He plays cricket.", "He played cricket."],
            correctOption: 2
        },
        {
            id: 3, type: "mcq",
            question: "सीता खाना बनाती है।",
            options: ["Sita cook food.", "Sita cooks food.", "Sita cooking food.", "Sita cooked food."],
            correctOption: 1
        },
        {
            id: 4, type: "mcq",
            question: "हम अंग्रेजी पढ़ते हैं।",
            options: ["We studies English.", "We studying English.", "We study English.", "We studied English."],
            correctOption: 2
        },
        {
            id: 5, type: "mcq",
            question: "वे बाजार जाते हैं।",
            options: ["They goes to the market.", "They go to the market.", "They going to the market.", "They went to the market."],
            correctOption: 1
        },
        {
            id: 6, type: "mcq",
            question: "मेरा भाई दूध पीता है।",
            options: ["My brother drink milk.", "My brother drinks milk.", "My brother drinking milk.", "My brother drank milk."],
            correctOption: 1
        },
        {
            id: 7, type: "mcq",
            question: "सूरज पूर्व से निकलता है।",
            options: ["The sun rise in the east.", "The sun rises in the east.", "The sun rising in the east.", "The sun rose in the east."],
            correctOption: 1
        },
        {
            id: 8, type: "mcq",
            question: "बच्चे पार्क में खेलते हैं।",
            options: ["Children plays in the park.", "Children play in the park.", "Children playing in the park.", "Children played in the park."],
            correctOption: 1
        },
        {
            id: 9, type: "mcq",
            question: "वह मुझे जानती है।",
            options: ["She know me.", "She knowing me.", "She knows me.", "She knew me."],
            correctOption: 2
        },
        {
            id: 10, type: "mcq",
            question: "मेरे पिता अखबार पढ़ते हैं।",
            options: ["My father read a newspaper.", "My father reads a newspaper.", "My father reading a newspaper.", "My father is read a newspaper."],
            correctOption: 1
        },
        {
            id: 11, type: "mcq",
            question: "मैं झूठ नहीं बोलता हूँ।",
            options: ["I does not tell lies.", "I do not tell lies.", "I am not tell lies.", "I not tell lies."],
            correctOption: 1
        },
        {
            id: 12, type: "mcq",
            question: "वह स्कूल नहीं जाता है।",
            options: ["He do not go to school.", "He does not goes to school.", "He does not go to school.", "He not go to school."],
            correctOption: 2
        },
        {
            id: 13, type: "mcq",
            question: "सीता चाय नहीं पीती है।",
            options: ["Sita does not drink tea.", "Sita do not drink tea.", "Sita does not drinks tea.", "Sita not drink tea."],
            correctOption: 0
        },
        {
            id: 14, type: "mcq",
            question: "हम क्रिकेट नहीं खेलते हैं।",
            options: ["We does not play cricket.", "We do not play cricket.", "We do not plays cricket.", "We not play cricket."],
            correctOption: 1
        },
        {
            id: 15, type: "mcq",
            question: "वे अंग्रेजी नहीं बोलते हैं।",
            options: ["They does not speak English.", "They do not speaks English.", "They do not speak English.", "They not speak English."],
            correctOption: 2
        },
        {
            id: 16, type: "mcq",
            question: "मेरा भाई टीवी नहीं देखता है।",
            options: ["My brother do not watch TV.", "My brother does not watches TV.", "My brother does not watch TV.", "My brother not watch TV."],
            correctOption: 2
        },
        {
            id: 17, type: "mcq",
            question: "वह मेरी मदद नहीं करती है।",
            options: ["She do not help me.", "She does not help me.", "She does not helps me.", "She not helps me."],
            correctOption: 1
        },
        {
            id: 18, type: "mcq",
            question: "बच्चे शोर नहीं करते हैं।",
            options: ["Children does not make noise.", "Children do not makes noise.", "Children do not make noise.", "Children not make noise."],
            correctOption: 2
        },
        {
            id: 19, type: "mcq",
            question: "मैं कॉफी नहीं पीता हूँ।",
            options: ["I does not drink coffee.", "I do not drink coffee.", "I do not drinks coffee.", "I not drink coffee."],
            correctOption: 1
        },
        {
            id: 20, type: "mcq",
            question: "राम अपना काम नहीं करता है।",
            options: ["Ram do not do his work.", "Ram does not does his work.", "Ram does not do his work.", "Ram not do his work."],
            correctOption: 2
        },
        {
            id: 21, type: "mcq",
            question: "क्या तुम स्कूल जाते हो?",
            options: ["Does you go to school?", "Do you go to school?", "Are you go to school?", "Do you goes to school?"],
            correctOption: 1
        },
        {
            id: 22, type: "mcq",
            question: "क्या वह क्रिकेट खेलता है?",
            options: ["Do he play cricket?", "Does he plays cricket?", "Does he play cricket?", "Is he play cricket?"],
            correctOption: 2
        },
        {
            id: 23, type: "mcq",
            question: "क्या सीता गाना गाती है?",
            options: ["Do Sita sing a song?", "Does Sita sings a song?", "Does Sita sing a song?", "Is Sita sing a song?"],
            correctOption: 2
        },
        {
            id: 24, type: "mcq",
            question: "क्या वे यहाँ रहते हैं?",
            options: ["Does they live here?", "Do they live here?", "Are they live here?", "Do they lives here?"],
            correctOption: 1
        },
        {
            id: 25, type: "mcq",
            question: "क्या तुम्हारी माँ खाना बनाती हैं?",
            options: ["Do your mother cook food?", "Does your mother cooks food?", "Does your mother cook food?", "Is your mother cook food?"],
            correctOption: 2
        },
        {
            id: 26, type: "mcq",
            question: "क्या तुम अंग्रेजी समझते हो?",
            options: ["Does you understand English?", "Do you understands English?", "Do you understand English?", "Are you understand English?"],
            correctOption: 2
        },
        {
            id: 27, type: "mcq",
            question: "क्या वह रोज दौड़ता है?",
            options: ["Do he run every day?", "Does he runs every day?", "Does he run every day?", "Is he run every day?"],
            correctOption: 2
        },
        {
            id: 28, type: "mcq",
            question: "क्या बच्चे पढ़ते हैं?",
            options: ["Does children study?", "Do children studies?", "Do children study?", "Are children study?"],
            correctOption: 2
        },
        {
            id: 29, type: "mcq",
            question: "क्या राम तुम्हें जानता है?",
            options: ["Do Ram know you?", "Does Ram knows you?", "Does Ram know you?", "Is Ram know you?"],
            correctOption: 2
        },
        {
            id: 30, type: "mcq",
            question: "क्या तुम्हारे पिता अखबार पढ़ते हैं?",
            options: ["Do your father read a newspaper?", "Does your father reads a newspaper?", "Does your father read a newspaper?", "Are your father read a newspaper?"],
            correctOption: 2
        },
        {
            id: 31, type: "mcq",
            question: "क्या तुम स्कूल नहीं जाते हो?",
            options: ["Does you not go to school?", "Do you not go to school?", "Do you not goes to school?", "Are you not go to school?"],
            correctOption: 1
        },
        {
            id: 32, type: "mcq",
            question: "क्या वह दूध नहीं पीता है?",
            options: ["Do he not drink milk?", "Does he not drinks milk?", "Does he not drink milk?", "Is he not drink milk?"],
            correctOption: 2
        },
        {
            id: 33, type: "mcq",
            question: "क्या सीता खाना नहीं बनाती है?",
            options: ["Do Sita not cook food?", "Does Sita not cooks food?", "Does Sita not cook food?", "Is Sita not cook food?"],
            correctOption: 2
        },
        {
            id: 34, type: "mcq",
            question: "क्या वे तुम्हारी मदद नहीं करते हैं?",
            options: ["Does they not help you?", "Do they not help you?", "Do they not helps you?", "Are they not help you?"],
            correctOption: 1
        },
        {
            id: 35, type: "mcq",
            question: "क्या तुम मुझे नहीं जानते हो?",
            options: ["Does you not know me?", "Do you not knows me?", "Do you not know me?", "Are you not know me?"],
            correctOption: 2
        }
    ]
};

// ✅ FIXED: आखिर में / मत लगाओ
const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";

// Global State
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let remainingSeconds = testConfig.durationMinutes * 60;
let studentName = "";

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

    let score = 0;
    let mcqTotal = 0;

    testConfig.questions.forEach((q, idx) => {
        if (q.type === "mcq") {
            mcqTotal++;
            if (userAnswers[idx] === q.correctOption) score++;
        }
    });

    const payload = {
        studentName: studentName,
        testId: testConfig.testId,
        score: `${score}/${mcqTotal}`,
        answers: userAnswers,
        submittedAt: new Date().toISOString()
    };

    // पहले lock मत करो — पहले Telegram भेजो
    let telegramOk = false;
    try {
        const res = await fetch(`${WORKER_URL}/api/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        console.log("Worker response:", result);
        telegramOk = result.success === true;
    } catch (err) {
        console.error("Failed to post submission:", err);
        alert("⚠ Network error! Result Telegram par nahi gaya. Check Worker URL.");
    }

    // अब lock करो
    localStorage.setItem(`submitted_${testConfig.testId}`, "true");

    if (telegramOk) {
        showLockedScreen("TEST SUBMITTED SUCCESSFULLY", `Thank you, ${studentName}. Result sent to Admin Telegram!`);
    } else {
        showLockedScreen("TEST SAVED (TELEGRAM FAILED)", `Answers saved locally, but Telegram alert failed. Tell admin to check Bot Token / Chat ID.`);
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
