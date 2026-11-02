/* ==========================================================================
   RJ ACADEMY PRO - Core Functional Script
   ========================================================================== */

const WORKER_URL = "https://rj-test-backen.internationalbgi.workers.dev";

// Global State
let testConfig = {
    testId: "",
    title: "",
    duration: 60, // in minutes
    questions: []
};

let currentQIndex = 0;
let userAnswers = {}; // { qIndex: selectedOptionIndex }
let flaggedQuestions = new Set();
let visitedQuestions = new Set();
let timerInterval = null;
let timeRemaining = 0;

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
document.addEventListener("DOMContentLoaded", async () => {
    initFabDraggable();
    
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get("testId") || "demo_test";

    // Check if already submitted
    if (localStorage.getItem(`submitted_${testId}`)) {
        showLockedScreen("Assessment already submitted on this device.");
        return;
    }

    await loadTestConfig(testId);
});

// Fetch Test Config from Worker
async function loadTestConfig(testId) {
    try {
        const res = await fetch(`${WORKER_URL}/api/config?testId=${testId}`);
        if (!res.ok) throw new Error("Failed to load test parameters.");
        
        const data = await res.json();
        testConfig = data;
        
        document.getElementById("test-title-display").innerText = testConfig.title || "Assessment";
        timeRemaining = (testConfig.duration || 60) * 60;
        
        startTimer();
        renderQuestion(0);
        renderMatrix();
    } catch (err) {
        console.error(err);
        // Fallback Mock Data if Worker API fails
        loadMockData(testId);
    }
}

// Mock Data Fallback
function loadMockData(testId) {
    testConfig = {
        testId: testId,
        title: "RJ ACADEMY PRO Demo Mock Test",
        duration: 30,
        questions: [
            {
                id: "q1",
                text: "What is the primary function of the cell nucleus in eukaryotic organisms?",
                options: [
                    "Energy production via ATP synthesis",
                    "Storage and regulation of genetic material (DNA)",
                    "Protein synthesis and ribosome assembly",
                    "Cellular waste degradation and recycling"
                ]
            },
            {
                id: "q2",
                text: "Which vector quantity represents the rate of change of momentum with respect to time?",
                options: ["Work Done", "Impulse", "Net Force", "Kinetic Energy"]
            },
            {
                id: "q3",
                text: "In chemical kinetics, what does the activation energy of a reaction indicate?",
                options: [
                    "Total energy released during exothermic reaction",
                    "Minimum energy required to form the transition state",
                    "Enthalpy change of the equilibrium system",
                    "Free energy of products minus reactants"
                ]
            }
        ]
    };

    document.getElementById("test-title-display").innerText = testConfig.title;
    timeRemaining = testConfig.duration * 60;
    startTimer();
    renderQuestion(0);
    renderMatrix();
}

// Timer Logic
function startTimer() {
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

    document.getElementById("time-left").innerText = display;
}

// Question Rendering
function renderQuestion(index) {
    if (!testConfig.questions[index]) return;
    
    currentQIndex = index;
    visitedQuestions.add(index);
    
    const q = testConfig.questions[index];
    
    document.getElementById("q-number").innerText = `Q.${index + 1}`;
    document.getElementById("question-text").innerText = q.text;
    
    // Flag Button UI
    const flagBtn = document.getElementById("flag-btn");
    if (flaggedQuestions.has(index)) {
        flagBtn.classList.add("flagged");
    } else {
        flagBtn.classList.remove("flagged");
    }

    // Question Image Handling
    const imgContainer = document.getElementById("question-image-container");
    const imgEl = document.getElementById("question-image");
    if (q.imageUrl) {
        imgEl.src = q.imageUrl;
        imgContainer.classList.remove("hidden");
    } else {
        imgContainer.classList.add("hidden");
    }

    // Render Options
    const optsContainer = document.getElementById("options-container");
    optsContainer.innerHTML = "";

    const labels = ["A", "B", "C", "D", "E"];
    q.options.forEach((optText, optIdx) => {
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
    grid.innerHTML = "";

    testConfig.questions.forEach((_, idx) => {
        const btn = document.createElement("button");
        btn.className = "p-item";
        btn.innerText = idx + 1;

        if (idx === currentQIndex) btn.classList.add("active-q");
        
        if (userAnswers[idx] !== undefined) {
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
    sidebar.classList.toggle("active-matrix");
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

        // Boundary Clamp
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
        
        // Clean Tap Detection (If moved less than 12px, count as CLICK)
        if (fabDragState.dragDistance < 12) {
            toggleMatrix();
        }
    };

    // Touch Event Listeners
    fab.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', doDrag, { passive: true });
    window.addEventListener('touchend', stopDrag);

    // Mouse Event Listeners
    fab.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
}

// Confirmation & Submission Logic
function openSubmitConfirm() {
    const total = testConfig.questions.length;
    const answered = Object.keys(userAnswers).length;
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

// Bind Desktop Header Submit Button
document.getElementById("header-submit-btn").onclick = openSubmitConfirm;

async function submitTestFinal() {
    closeSubmitConfirm();
    clearInterval(timerInterval);

    const payload = {
        testId: testConfig.testId,
        answers: userAnswers,
        submittedAt: new Date().toISOString()
    };

    try {
        await fetch(`${WORKER_URL}/api/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.warn("Offline or submit warning:", err);
    }

    localStorage.setItem(`submitted_${testConfig.testId}`, "true");
    showLockedScreen("Assessment submitted successfully!");
}

function autoSubmitOnTimeout() {
    submitTestFinal();
    showLockedScreen("Time expired! Assessment auto-submitted.");
}

function showLockedScreen(msg) {
    document.getElementById("locked-message").innerText = msg;
    document.getElementById("locked-timestamp").innerText = `Time: ${new Date().toLocaleString()}`;
    document.getElementById("locked-screen").classList.remove("hidden");
}