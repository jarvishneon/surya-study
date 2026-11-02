const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";

let testConfig = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let remainingSeconds = 0;
let studentName = "";
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", () => {
    fetchConfigAndInit();
    initDraggableFAB(); // Initialize Moveable Floating Icon
});

async function fetchConfigAndInit() {
    try {
        const res = await fetch(WORKER_URL + "/api/config?t=" + Date.now());
        if (!res.ok) throw new Error("Server Error");
        testConfig = await res.json();

        if (testConfig.status !== "open") {
            showLockedScreen("TEST CURRENTLY CLOSED", "This test is currently closed or locked by Admin.", "🔴");
            return;
        }
        checkLockStatus();
    } catch (err) {
        console.error(err);
        setTimeout(fetchConfigAndInit, 3000);
    }
}

function checkLockStatus() {
    var isSubmitted = localStorage.getItem("submitted_" + testConfig.testId);
    var submittedTimeRaw = localStorage.getItem("submitted_time_" + testConfig.testId);

    if (isSubmitted) {
        var reopenTime = testConfig.reopenTimestamp || 0;
        var submittedTime = submittedTimeRaw ? parseInt(submittedTimeRaw, 10) : 0;

        if (reopenTime > 0 && (submittedTime === 0 || submittedTime < reopenTime)) {
            localStorage.removeItem("submitted_" + testConfig.testId);
            localStorage.removeItem("submitted_time_" + testConfig.testId);
        } else {
            showLockedScreen("TEST ALREADY SUBMITTED", "You have already completed this test session.", "🔒");
            return;
        }
    }

    studentName = sessionStorage.getItem("student_name") || localStorage.getItem("rjStudyUsername") || "Student";
    sessionStorage.setItem("student_name", studentName);
    initExam();
}

function initExam() {
    var nameEl = document.getElementById("student-display-name");
    if (nameEl) nameEl.innerText = studentName;

    var app = document.getElementById("exam-app");
    if (app) app.classList.remove("hidden");

    remainingSeconds = (testConfig.durationMinutes || 45) * 60;
    renderPalette();
    loadQuestion(0);
    startTimer();
}

function renderPalette() {
    var grid = document.getElementById("palette-grid");
    if (!grid) return;
    grid.innerHTML = "";
    testConfig.questions.forEach(function (_, idx) {
        var btn = document.createElement("button");
        btn.className = "palette-num";
        btn.innerText = idx + 1;
        btn.id = "palette-item-" + idx;
        btn.onclick = function () { jumpToQuestion(idx); };
        grid.appendChild(btn);
    });
    updatePaletteUI();
}

function updatePaletteUI() {
    testConfig.questions.forEach(function (_, idx) {
        var btn = document.getElementById("palette-item-" + idx);
        if (!btn) return;
        btn.className = "palette-num";
        if (idx === currentQuestionIndex) btn.classList.add("active");
        if (userAnswers[idx] !== undefined && userAnswers[idx] !== "") btn.classList.add("answered");
    });
}

function loadQuestion(index) {
    currentQuestionIndex = index;
    var q = testConfig.questions[index];

    var qNum = document.getElementById("question-number");
    if (qNum) qNum.innerText = "QUESTION " + (index + 1) + " OF " + testConfig.questions.length;

    var qBadge = document.getElementById("question-type-badge");
    if (qBadge) qBadge.innerText = (q.type || "mcq").toUpperCase();

    var qText = document.getElementById("question-text");
    if (qText) qText.innerText = q.question;

    var container = document.getElementById("options-container");
    if (!container) return;
    container.innerHTML = "";

    if (q.type === "mcq") {
        q.options.forEach(function (optText, optIdx) {
            var card = document.createElement("div");
            card.className = "option-card";
            if (userAnswers[index] === optIdx) card.classList.add("selected");
            card.onclick = function () { selectMCQOption(optIdx); };
            card.innerHTML = '<input type="radio" name="option" ' + (userAnswers[index] === optIdx ? "checked" : "") + '><span>' + optText + '</span>';
            container.appendChild(card);
        });
    }

    var prevBtn = document.getElementById("prev-btn");
    if (prevBtn) prevBtn.disabled = index === 0;
    var nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.innerText = index === testConfig.questions.length - 1 ? "FINISH →" : "Next →";

    var mobPrevBtn = document.getElementById("mob-prev-btn");
    if (mobPrevBtn) mobPrevBtn.disabled = index === 0;
    var mobNextBtn = document.getElementById("mob-next-btn");
    if (mobNextBtn) mobNextBtn.innerText = index === testConfig.questions.length - 1 ? "FINISH →" : "Next →";

    updatePaletteUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

function toggleMatrix() {
    var sidebar = document.querySelector('.sidebar-section');
    if (sidebar) {
        sidebar.classList.toggle('active-matrix');
        document.body.style.overflow = sidebar.classList.contains('active-matrix') ? 'hidden' : '';
    }
}

function jumpToQuestion(idx) {
    loadQuestion(idx);
    var sidebar = document.querySelector('.sidebar-section');
    if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('active-matrix')) {
        sidebar.classList.remove('active-matrix');
        document.body.style.overflow = '';
    }
}

// ==========================================
// MOVEABLE / DRAGGABLE FAB LOGIC (TOUCH & MOUSE)
// ==========================================
function initDraggableFAB() {
    const fab = document.getElementById('draggable-fab');
    if (!fab) return;

    let isDragging = false;
    let hasMoved = false;
    let startX, startY, initialLeft, initialTop;

    function onStart(e) {
        isDragging = true;
        hasMoved = false;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;

        const rect = fab.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        fab.style.transition = 'none';
    }

    function onMove(e) {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            hasMoved = true;
        }

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        // Keep inside screen bounds
        const maxLeft = window.innerWidth - fab.offsetWidth - 10;
        const maxTop = window.innerHeight - fab.offsetHeight - 10;

        newLeft = Math.max(10, Math.min(newLeft, maxLeft));
        newTop = Math.max(10, Math.min(newTop, maxTop));

        fab.style.left = newLeft + 'px';
        fab.style.top = newTop + 'px';
        fab.style.right = 'auto';
        fab.style.bottom = 'auto';
    }

    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        fab.style.transition = 'transform 0.15s, box-shadow 0.15s';
        
        if (!hasMoved) {
            toggleMatrix(); // Single tap opens matrix
        }
    }

    fab.addEventListener('touchstart', onStart, { passive: true });
    fab.addEventListener('touchmove', onMove, { passive: true });
    fab.addEventListener('touchend', onEnd);

    fab.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(function () {
        remainingSeconds--;
        updateTimerDisplay();
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            autoSubmitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    var hours = Math.floor(remainingSeconds / 3600);
    var mins = Math.floor((remainingSeconds % 3600) / 60);
    var secs = remainingSeconds % 60;
    var timerElem = document.getElementById("exam-timer");
    if (timerElem) {
        timerElem.innerText =
            String(hours).padStart(2, "0") + ":" +
            String(mins).padStart(2, "0") + ":" +
            String(secs).padStart(2, "0");
        if (remainingSeconds <= 60) timerElem.style.color = "#EF4444";
        else timerElem.style.color = "";
    }
}

function confirmSubmission() {
    if (isSubmitting) return;
    var answered = Object.keys(userAnswers).filter(function (k) {
        return userAnswers[k] !== "";
    }).length;
    var summary = document.getElementById("submission-summary");
    if (summary) {
        summary.innerText = "You have answered " + answered + " out of " + testConfig.questions.length + " questions. Submit test now?";
    }
    var sidebar = document.querySelector('.sidebar-section');
    if (sidebar) {
        sidebar.classList.remove('active-matrix');
        document.body.style.overflow = '';
    }
    var modal = document.getElementById("confirm-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeConfirmModal() {
    var modal = document.getElementById("confirm-modal");
    if (modal) modal.classList.add("hidden");
}

async function finalSubmitExam() {
    if (isSubmitting) return;
    isSubmitting = true;
    if (timerInterval) clearInterval(timerInterval);
    closeConfirmModal();

    var now = Date.now();
    var payload = {
        studentName: studentName || "Student",
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
        if (result.success) {
            localStorage.setItem("submitted_" + testConfig.testId, "true");
            localStorage.setItem("submitted_time_" + testConfig.testId, now.toString());
            showLockedScreen("TEST SUBMITTED", "Score: " + result.score + ". Result sent!", "🎉");
        } else {
            isSubmitting = false;
            alert(result.error || "Submission failed.");
        }
    } catch (err) {
        isSubmitting = false;
        alert("Submission failed. Check network.");
    }
}

function autoSubmitExam() {
    if (isSubmitting) return;
    alert("Time limit reached! Auto-submitting your exam.");
    finalSubmitExam();
}

function showLockedScreen(title, msg, icon) {
    if (!icon) icon = "🛡️";
    var app = document.getElementById("exam-app");
    if (app) app.classList.add("hidden");
    var iconEl = document.getElementById("locked-icon");
    if (iconEl) iconEl.innerText = icon;
    var titleEl = document.getElementById("locked-title");
    if (titleEl) titleEl.innerText = title;
    var msgEl = document.getElementById("locked-message");
    if (msgEl) msgEl.innerText = msg;
    var locked = document.getElementById("locked-screen");
    if (locked) locked.classList.remove("hidden");
}

window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.clearAnswer = clearAnswer;
window.confirmSubmission = confirmSubmission;
window.closeConfirmModal = closeConfirmModal;
window.finalSubmitExam = finalSubmitExam;
window.jumpToQuestion = jumpToQuestion;
window.toggleMatrix = toggleMatrix;