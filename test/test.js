/* ==========================================
   RJ STUDY PRO - v14.0
   4th Option Fix + 3D Animated FAB
   ========================================== */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
    --bg-main: #060913;
    --bg-panel: rgba(17, 24, 39, 0.78);
    --text-primary: #F9FAFB;
    --text-secondary: #9CA3AF;
    --accent-color: #00E5FF;
    --accent-hover: #00B2CC;
    --danger-color: #EF4444;
    --success-color: #10B981;
    --border-color: rgba(255, 255, 255, 0.1);
    --font-main: 'Inter', sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

html, body {
    height: 100%;
    overflow-x: hidden;
}

body {
    background-color: var(--bg-main);
    background-image: 
        radial-gradient(circle at top right, rgba(0, 229, 255, 0.12), transparent 42%),
        radial-gradient(circle at bottom left, rgba(239, 68, 68, 0.06), transparent 42%);
    color: var(--text-primary);
    font-family: var(--font-main);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.hidden { display: none !important; }

.glass-panel {
    background: var(--bg-panel);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
}

/* ===== HEADER ===== */
.exam-header {
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--border-color);
    background: rgba(6, 9, 19, 0.96);
    flex-shrink: 0;
}

.brand-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1.1rem; }
.pro-badge {
    background: linear-gradient(135deg, var(--accent-color), #0077FF);
    color: #000; font-size: 0.65rem; padding: 2px 7px;
    border-radius: 4px; font-weight: 800;
}

.timer-box {
    display: flex; align-items: center; gap: 8px;
    font-size: 1.15rem; font-weight: 700; color: var(--accent-color);
    padding: 6px 14px; border-radius: 10px;
    background: rgba(0, 229, 255, 0.07);
    border: 1px solid rgba(0, 229, 255, 0.35);
}
.glow-effect { box-shadow: 0 0 18px rgba(0, 229, 255, 0.25); }

.candidate-badge {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.05); padding: 5px 14px 5px 5px;
    border-radius: 50px; font-weight: 500; font-size: 0.9rem;
}
.avatar {
    width: 28px; height: 28px; background: var(--accent-color);
    border-radius: 50%; display: flex; justify-content: center; align-items: center;
}

/* ===== LAYOUT ===== */
.exam-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 24px;
    flex-grow: 1;
    position: relative;
}

/* ===== QUESTION SECTION ===== */
.question-section {
    border-radius: 18px;
    padding: 24px;
    display: flex;
    flex-direction: column;
}

.question-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 12px; margin-bottom: 16px;
}
.q-num { font-weight: 600; color: var(--accent-color); letter-spacing: 1px; font-size: 0.9rem; }
.q-type {
    background: rgba(255,255,255,0.1); padding: 4px 12px;
    border-radius: 6px; font-size: 0.75rem; font-weight: 600;
}

#question-text {
    font-size: 1.3rem; line-height: 1.5; font-weight: 500;
    margin-bottom: 20px; color: #fff;
}

/* ===== OPTIONS ===== */
.options-grid { display: flex; flex-direction: column; gap: 10px; }

.option-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border-color);
    padding: 14px 16px; border-radius: 12px;
    cursor: pointer; display: flex; align-items: center; gap: 12px;
    font-size: 1rem; transition: all 0.2s ease;
}
.option-card:hover { background: rgba(255,255,255,0.07); transform: translateX(4px); }
.option-card.selected {
    background: rgba(0, 229, 255, 0.12);
    border-color: var(--accent-color);
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.15);
}

.option-card input[type="radio"] {
    appearance: none; width: 20px; height: 20px;
    border: 2px solid var(--text-secondary); border-radius: 50%;
    outline: none; cursor: pointer; position: relative; flex-shrink: 0; transition: 0.2s;
}
.option-card.selected input[type="radio"] { border-color: var(--accent-color); }
.option-card.selected input[type="radio"]::after {
    content: ''; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 10px; height: 10px; background: var(--accent-color); border-radius: 50%;
}

.bottom-scroll-spacer { width: 100%; height: 8px; flex-shrink: 0; }

/* ===== ACTION FOOTER (Desktop) ===== */
.action-footer {
    display: flex; justify-content: space-between; gap: 12px;
    margin-top: 24px; padding-top: 18px;
    border-top: 1px solid var(--border-color);
}
.nav-btn {
    padding: 12px 18px; border-radius: 10px; font-weight: 600;
    cursor: pointer; transition: 0.2s; font-family: inherit; font-size: 0.95rem;
}
.nav-btn.prev, .nav-btn.clear {
    background: transparent; border: 1px solid var(--text-secondary); color: var(--text-primary);
}
.nav-btn.prev:hover:not(:disabled), .nav-btn.clear:hover { background: rgba(255,255,255,0.08); }
.nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.nav-btn.next {
    background: var(--accent-color); color: #000; border: none;
    box-shadow: 0 4px 0 #0099aa;
}
.nav-btn.next:active { transform: translateY(3px); box-shadow: 0 1px 0 #0099aa; }

/* ===== MATRIX (Desktop) ===== */
.sidebar-section { display: flex; flex-direction: column; gap: 20px; }
.matrix-card { border-radius: 18px; padding: 22px; }
.matrix-handle { display: none; }
.matrix-title {
    font-size: 0.85rem; color: var(--text-secondary);
    margin-bottom: 16px; text-align: center; letter-spacing: 1.5px; font-weight: 600;
}
.matrix-legend {
    display: flex; justify-content: space-between; margin-bottom: 16px;
    font-size: 0.75rem; color: var(--text-secondary);
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot { width: 9px; height: 9px; border-radius: 50%; }
.dot.answered { background: var(--success-color); box-shadow: 0 0 8px var(--success-color); }
.dot.current { border: 2px solid var(--accent-color); background: transparent; }
.dot.unanswered { background: transparent; border: 1px solid var(--text-secondary); }

.palette-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.palette-num {
    background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
    color: var(--text-primary); height: 44px; border-radius: 10px;
    font-weight: 600; cursor: pointer; transition: 0.15s; font-size: 0.95rem;
}
.palette-num:hover { background: rgba(255,255,255,0.12); }
.palette-num.answered {
    background: rgba(16, 185, 129, 0.2); color: var(--success-color);
    border-color: rgba(16, 185, 129, 0.45);
}
.palette-num.active {
    border: 2px solid var(--accent-color); color: var(--accent-color);
    transform: scale(1.06); box-shadow: 0 0 14px rgba(0, 229, 255, 0.3);
}

/* ===== SUBMIT ===== */
.submit-exam-btn {
    background: linear-gradient(135deg, #EF4444, #BE123C);
    color: #fff; border: none; padding: 15px; border-radius: 12px;
    font-weight: 700; font-size: 0.95rem; letter-spacing: 0.8px;
    cursor: pointer; display: flex; justify-content: center; align-items: center;
    gap: 8px; width: 100%; margin-top: 18px;
    box-shadow: 0 5px 0 #881337, 0 8px 18px rgba(239, 68, 68, 0.3);
    transition: 0.15s;
}
.submit-exam-btn:active {
    transform: translateY(4px);
    box-shadow: 0 1px 0 #881337, 0 4px 10px rgba(239, 68, 68, 0.25);
}

/* ===== 3D ANIMATED FAB ===== */
@keyframes fabPulse {
    0%, 100% { box-shadow: 0 6px 0 #0097a7, 0 8px 24px rgba(0, 229, 255, 0.35), 0 0 0 0 rgba(0, 229, 255, 0.4); }
    50%      { box-shadow: 0 6px 0 #0097a7, 0 8px 28px rgba(0, 229, 255, 0.5), 0 0 0 12px rgba(0, 229, 255, 0); }
}
@keyframes fabFloat {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-5px); }
}

.matrix-fab {
    position: fixed;
    bottom: 88px;
    right: 16px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(145deg, #00F0FF, #00B8D4);
    color: #000;
    border: none;
    display: none;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 1100;
    /* 3D depth */
    box-shadow: 0 6px 0 #0097a7, 0 10px 25px rgba(0, 229, 255, 0.4);
    animation: fabPulse 2.4s ease-in-out infinite, fabFloat 3s ease-in-out infinite;
    transition: transform 0.15s, box-shadow 0.15s;
}
.matrix-fab:active {
    transform: translateY(5px) !important;
    box-shadow: 0 1px 0 #0097a7, 0 4px 12px rgba(0, 229, 255, 0.3) !important;
    animation: none;
}
.matrix-fab svg {
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
}

.close-matrix-btn {
    display: none; width: 100%; margin-top: 10px; padding: 13px;
    background: rgba(255,255,255,0.04); color: var(--text-secondary);
    border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;
    font-weight: 600; cursor: pointer; font-size: 0.95rem;
}
.close-matrix-btn:active { background: rgba(255,255,255,0.1); }

/* ===== MODALS ===== */
.modal-overlay, .locked-container {
    position: fixed; inset: 0; background: rgba(0,0,0,0.92);
    display: flex; justify-content: center; align-items: center; z-index: 3000;
}
.modal-card, .locked-card {
    border-radius: 20px; padding: 32px; max-width: 420px; width: 90%; text-align: center;
}
.modal-card h2 { margin-bottom: 12px; font-size: 1.35rem; }
.modal-card p { color: var(--text-secondary); margin-bottom: 24px; line-height: 1.5; }
.modal-actions { display: flex; gap: 12px; }
.cancel-btn, .confirm-btn {
    flex: 1; padding: 13px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.95rem;
}
.cancel-btn { background: transparent; border: 1px solid var(--text-secondary); color: var(--text-primary); }
.confirm-btn { background: var(--success-color); color: #fff; border: none; }

.locked-icon { font-size: 3.5rem; margin-bottom: 12px; }
.locked-card h1 {
    color: var(--accent-color); margin-bottom: 10px; font-size: 1.6rem;
    text-shadow: 0 0 20px rgba(0,229,255,0.4);
}
.locked-card p { color: var(--text-secondary); margin-bottom: 24px; }
.locked-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.dashboard-btn {
    background: var(--accent-color); color: #000; border: none;
    padding: 12px 22px; border-radius: 10px; font-weight: 700; cursor: pointer;
}
.retry-btn {
    background: transparent; border: 1px solid var(--border-color);
    color: var(--text-secondary); padding: 12px 20px; border-radius: 10px;
    font-weight: 600; cursor: pointer;
}

/* ============================================================
   MOBILE + 3D MATRIX BOTTOM SHEET
   ============================================================ */
@keyframes matrixPop {
    0%   { transform: translateY(100%); opacity: 0.5; }
    100% { transform: translateY(0); opacity: 1; }
}

@media (max-width: 992px) {
    .exam-layout { grid-template-columns: 1fr; }
    .matrix-fab { display: flex; }

    .sidebar-section {
        position: fixed; inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        z-index: 2000;
        display: flex; justify-content: center; align-items: flex-end;
        padding: 0;
        opacity: 0; visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .sidebar-section.active-matrix {
        opacity: 1; visibility: visible;
    }

    .matrix-card {
        width: 100%;
        max-height: 86vh;
        overflow-y: auto;
        border-radius: 22px 22px 0 0 !important;
        padding: 10px 18px 26px !important;
        background: linear-gradient(170deg, #0f172a 0%, #0a0f1c 60%, #060913 100%) !important;
        border: none !important;
        border-top: 1px solid rgba(0, 229, 255, 0.3) !important;
        box-shadow: 0 -12px 50px rgba(0,0,0,0.85), 0 0 40px rgba(0,229,255,0.07) !important;
        animation: matrixPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .matrix-handle {
        display: block;
        width: 44px; height: 5px;
        background: rgba(255,255,255,0.22);
        border-radius: 10px;
        margin: 4px auto 14px;
    }

    .close-matrix-btn { display: block; }

    .palette-num {
        background: linear-gradient(145deg, #1e293b, #0f172a) !important;
        border: none !important;
        box-shadow: 0 4px 0 #020617, 0 5px 10px rgba(0,0,0,0.35) !important;
        height: 44px !important; border-radius: 11px !important;
    }
    .palette-num:active {
        transform: translateY(3px) !important;
        box-shadow: 0 1px 0 #020617 !important;
    }
    .palette-num.active {
        background: linear-gradient(145deg, #00E5FF, #00B8D4) !important;
        color: #000 !important; font-weight: 800 !important;
        box-shadow: 0 4px 0 #0097a7, 0 6px 16px rgba(0,229,255,0.4) !important;
    }
    .palette-num.answered {
        background: linear-gradient(145deg, #10B981, #059669) !important;
        color: #fff !important;
        box-shadow: 0 4px 0 #047857 !important;
    }
}

/* ========== MAIN MOBILE FIX (4th option) ========== */
@media (max-width: 768px) {
    .exam-header {
        flex-wrap: wrap; padding: 8px 12px; gap: 8px;
    }
    .brand-logo { font-size: 0.95rem; }
    .candidate-badge { display: none; }
    .timer-box {
        width: 100%; justify-content: center;
        font-size: 1.05rem; padding: 7px; order: 3;
    }

    .exam-layout {
        padding: 10px 10px 0 !important;
        /* CRITICAL: enough room to scroll 4th option ABOVE the sticky footer */
        padding-bottom: 175px !important;
    }

    .question-section {
        padding: 14px 12px 16px;
        border-radius: 14px;
    }
    .question-header { margin-bottom: 12px; padding-bottom: 8px; }
    .q-num { font-size: 0.8rem; }
    #question-text {
        font-size: 1.08rem;
        margin-bottom: 14px;
        line-height: 1.45;
    }

    .options-grid { gap: 8px; }
    .option-card {
        padding: 11px 12px;
        font-size: 0.92rem;
        border-radius: 10px;
        gap: 10px;
    }
    .option-card input[type="radio"] { width: 18px; height: 18px; }
    .option-card:hover { transform: none; }
    .option-card.selected input[type="radio"]::after {
        width: 9px; height: 9px;
    }

    /* STICKY FOOTER */
    .action-footer {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        margin: 0;
        padding: 8px 10px;
        padding-bottom: calc(8px + env(safe-area-inset-bottom));
        background: rgba(6, 9, 19, 0.97);
        border-top: 1px solid var(--border-color);
        z-index: 1000;
        display: flex;
        gap: 7px;
        box-shadow: 0 -6px 24px rgba(0,0,0,0.55);
    }
    .nav-btn {
        flex: 1;
        padding: 11px 6px;
        font-size: 0.84rem;
        min-height: 44px;