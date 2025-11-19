/**
 * Autonomous Finance Storyboard (RialoFlow)
 * Simulation Logic
 */

// --- Configuration & Static Data ---

const ASSETS = [
    { id: 'usdc', name: 'USDC Reserves', color: '#2563eb', desc: 'Stablecoin backing' },
    { id: 'tBills', name: 'T-Bills', color: '#10b981', desc: 'Risk-free yield' },
    { id: 'bonds', name: 'Corp Bonds', color: '#f59e0b', desc: 'Higher yield, riskier' },
    { id: 'cash', name: 'Cash', color: '#64748b', desc: 'Immediate liquidity' }
];

// Data-driven Step Definitions
const SIMULATION_STEPS = [
    {
        id: 0,
        key: 'INITIAL',
        title: 'T+0: Initial State',
        description: 'Treasury is balanced. Policies are active but not triggered.',
        traditionalText: 'Manual monitoring or fragmented scripts.',
        rialoText: 'Native scheduler monitoring price feeds.',
        metricsLabel: 'Healthy Reserve',
        apply: (state) => {
            // Reset to initial portfolio
            return { ...state.initialPortfolio };
        }
    },
    {
        id: 1,
        key: 'SHOCK',
        title: 'T+1: Market Shock',
        description: 'Sudden market drop impacts corporate bond values.',
        traditionalText: 'Alerts fire. Humans scramble to assess impact.',
        rialoText: 'Oracle update triggers atomic policy check.',
        metricsLabel: 'Value Dropped',
        apply: (state, currentPortfolio) => {
            const p = { ...currentPortfolio };
            const shockFactor = 1 - (state.params.shockMagnitude / 100);
            const oldBonds = p.bonds;
            p.bonds = p.bonds * shockFactor;

            logEvent(`[T+1] Market shock: Bonds dropped by ${state.params.shockMagnitude}% (-$${((oldBonds - p.bonds) / 1000).toFixed(0)}k)`);
            return p;
        }
    },
    {
        id: 2,
        key: 'REBALANCE',
        title: 'T+2: Auto-Rebalance',
        description: 'Reserve ratio dipped below target. Protocol sells bonds, buys T-Bills.',
        traditionalText: 'Manual trades, multi-sig delays, execution risk.',
        rialoText: 'Single atomic transaction rebalances portfolio instantly.',
        metricsLabel: 'Risk Reduced',
        apply: (state, currentPortfolio) => {
            const p = { ...currentPortfolio };
            const total = getTotalValue(p);
            const ratio = (total / 1000000) * 100; // Simplified liabilities

            if (ratio < state.params.targetReserveRatio) {
                // Sell 50% of remaining bonds, buy T-Bills
                const sellAmount = p.bonds * 0.5;
                p.bonds -= sellAmount;
                p.tBills += sellAmount;
                logEvent(`[T+2] Rebalance triggered: Sold $${(sellAmount / 1000).toFixed(0)}k Bonds, bought T-Bills`);
            } else {
                logEvent(`[T+2] Rebalance check: Ratio healthy (${ratio.toFixed(1)}%), no action needed`);
            }
            return p;
        }
    },
    {
        id: 3,
        key: 'DISTRIBUTION',
        title: 'T+3: Yield Distribution',
        description: 'Scheduled event distributes accumulated yield to holders.',
        traditionalText: 'Off-chain calculation, batch transfers, high gas.',
        rialoText: 'Scheduled event executes distribution logic natively.',
        metricsLabel: 'Yield Paid',
        apply: (state, currentPortfolio) => {
            const p = { ...currentPortfolio };
            const total = getTotalValue(p);
            const distAmount = total * (state.params.yieldDistribution / 100);

            // Pay from Cash first, then T-Bills
            let paidFromCash = 0;
            let paidFromBills = 0;

            if (p.cash >= distAmount) {
                paidFromCash = distAmount;
                p.cash -= distAmount;
            } else {
                paidFromCash = p.cash;
                const remainder = distAmount - p.cash;
                p.cash = 0;
                paidFromBills = remainder;
                p.tBills -= remainder;
            }

            logEvent(`[T+3] Distribution: Paid out $${(distAmount / 1000).toFixed(0)}k (${state.params.yieldDistribution}%) yield`);
            return p;
        }
    }
];

const PRESETS = {
    conservative: {
        shockMagnitude: 10,
        targetReserveRatio: 130,
        yieldDistribution: 2,
        label: 'Conservative'
    },
    balanced: {
        shockMagnitude: 20,
        targetReserveRatio: 110,
        yieldDistribution: 5,
        label: 'Balanced'
    },
    aggressive: {
        shockMagnitude: 35,
        targetReserveRatio: 105,
        yieldDistribution: 8,
        label: 'Aggressive'
    }
};

// --- State Management ---

const state = {
    currentStep: 0,
    isPlaying: false,
    hasEverPlayed: false,
    timerId: null,

    // User Parameters
    params: {
        shockMagnitude: 20, // % drop in bonds
        targetReserveRatio: 110, // %
        yieldDistribution: 5 // % of total value
    },

    // Portfolio State (Mutable)
    portfolio: {
        usdc: 0,
        tBills: 0,
        bonds: 0,
        cash: 0
    },

    // Initial Portfolio Config (Total ~1M)
    initialPortfolio: {
        usdc: 400000,
        tBills: 300000,
        bonds: 200000,
        cash: 100000
    },

    // History for Deltas
    history: [], // Array of { step: 0, value: 1000000 }

    // Logs
    logs: []
};

// --- Logic Functions ---

function init() {
    setupEventListeners();
    resetSimulation();
}

function resetSimulation() {
    stopSimulation();
    state.currentStep = 0;
    state.portfolio = { ...state.initialPortfolio };
    state.history = [{ step: 0, value: getTotalValue(state.portfolio) }];
    state.logs = [];

    logEvent("Simulation reset. Ready for T+0.");
    renderAll();

    // Fun reset message
    updateMicroStatus("Back to T+0. Your treasury is calm again. Turn up the shock if you want some drama.");
    setTimeout(() => {
        if (!state.isPlaying && state.currentStep === 0) {
            updateMicroStatus("Status: Ready. Hit Play to start the story.");
        }
    }, 3000);
}

// Revised Step Logic
function executeStep(stepIndex) {
    const stepDef = SIMULATION_STEPS[stepIndex];
    if (!stepDef) return;

    if (stepIndex === 0) {
        state.portfolio = { ...state.initialPortfolio };
    } else {
        // Apply logic based on previous state
        state.portfolio = stepDef.apply(state, state.portfolio);
    }

    // Record History
    const total = getTotalValue(state.portfolio);
    state.history[stepIndex] = { step: stepIndex, value: total };
}

function nextStep() {
    if (state.currentStep < SIMULATION_STEPS.length - 1) {
        state.currentStep++;
        executeStep(state.currentStep);
        renderAll();

        // Auto-stop at end
        if (state.currentStep === SIMULATION_STEPS.length - 1) {
            stopSimulation();
        }
        // After advancing, ensure the timeline panel is visible to the user
        scrollTimelineIntoView();
    } else {
        stopSimulation();
    }
}

// Smoothly scroll the main content grid so the timeline panel is visible/centered.
function scrollTimelineIntoView() {
    const mainGrid = document.querySelector('.main-grid');
    const timeline = document.querySelector('.timeline-panel');
    if (!mainGrid || !timeline) return;

    // If the main grid is the scrolling container, compute offset relative to it
    const gridRect = mainGrid.getBoundingClientRect();
    const targetRect = timeline.getBoundingClientRect();

    // Calculate top offset of timeline relative to the scroll container
    const offsetTop = targetRect.top - gridRect.top + mainGrid.scrollTop;

    // Scroll so that the timeline panel is centered vertically within the main grid
    const scrollTarget = Math.max(0, offsetTop - (gridRect.height / 2) + (targetRect.height / 2));

    try {
        mainGrid.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    } catch (e) {
        // Fallback for older browsers
        mainGrid.scrollTop = scrollTarget;
    }
}

function playSimulation() {
    if (state.currentStep === SIMULATION_STEPS.length - 1) {
        resetSimulation();
        setTimeout(() => {
            startPlaySequence();
        }, 100);
    } else {
        startPlaySequence();
    }
}

function startPlaySequence() {
    state.isPlaying = true;

    // Handle First Time Hint
    if (!state.hasEverPlayed) {
        state.hasEverPlayed = true;
        const hintBox = document.getElementById('hintBox');
        if (hintBox) hintBox.classList.add('hidden');
    }

    renderControls();

    // Immediate first step if we are at 0
    if (state.currentStep === 0) {
        // We are already at T+0 (initialized), so wait for T+1
        // Or should we "run" T+0? T+0 is static.
        // Let's just start the timer for T+1.
    }

    state.timerId = setInterval(() => {
        nextStep();
    }, 2000); // 2 seconds per step
}

function stopSimulation() {
    state.isPlaying = false;
    if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
    }
    renderControls();
}

function applyPreset(presetName) {
    const preset = PRESETS[presetName];
    if (!preset) return;

    state.params.shockMagnitude = preset.shockMagnitude;
    state.params.targetReserveRatio = preset.targetReserveRatio;
    state.params.yieldDistribution = preset.yieldDistribution;

    resetSimulation();
    updateMicroStatus(`Loaded ${preset.label} preset.`);
    logEvent(`Preset loaded: ${preset.label}`);
}

// --- Calculation Helpers ---

function getTotalValue(p) {
    return p.usdc + p.tBills + p.bonds + p.cash;
}

function getReserveRatio(p) {
    const liabilities = 1000000;
    return (getTotalValue(p) / liabilities) * 100;
}

function calculateRiskScore(p, params) {
    // Toy Risk Model
    // Higher Bonds + Higher Shock = Higher Risk
    // Higher Cash/T-Bills = Lower Risk

    const total = getTotalValue(p);
    if (total === 0) return 0;

    const wBonds = p.bonds / total;
    const wCash = p.cash / total;
    const wBills = p.tBills / total;
    const wUsdc = p.usdc / total;

    // Base risk from asset types (0-100 scale)
    // Bonds: 80 risk, T-Bills: 10 risk, USDC: 5 risk, Cash: 0 risk
    let compositionRisk = (wBonds * 80) + (wBills * 10) + (wUsdc * 5) + (wCash * 0);

    // Shock multiplier: If shock is high, bonds are even riskier
    // Shock 0-50. Factor 1.0 to 1.5
    const shockFactor = 1 + (params.shockMagnitude / 100);

    let finalRisk = compositionRisk * shockFactor;

    // Clamp 0-100
    return Math.min(100, Math.max(0, finalRisk));
}

function logEvent(msg) {
    state.logs.push(msg);
    // If we have too many logs, trim? Nah, it's short.
    renderLogs();
}

// --- Rendering Functions ---

function renderAll() {
    renderTreasury();
    renderRules();
    renderTimeline();
    renderControls();
    renderLogs();
}

function renderTreasury() {
    const p = state.portfolio;
    const total = getTotalValue(p);
    const ratio = getReserveRatio(p);
    const target = state.params.targetReserveRatio;
    const risk = calculateRiskScore(p, state.params);

    // Update Text Metrics
    document.getElementById('totalValue').textContent = `$${(total / 1000000).toFixed(2)}M`;

    // Reserve Ratio
    const ratioEl = document.getElementById('reserveRatio');
    ratioEl.className = 'value'; // Reset
    let ratioText = '';
    if (ratio >= target) {
        ratioEl.classList.add('ratio--healthy');
        ratioText = ' (healthy)';
    } else if (ratio >= target - 10) {
        ratioEl.classList.add('ratio--warn');
        ratioText = ' (below target)';
    } else {
        ratioEl.classList.add('ratio--danger');
        ratioText = ' (stressed)';
    }
    ratioEl.textContent = `${ratio.toFixed(1)}%${ratioText}`;

    // Risk Score
    const riskEl = document.getElementById('riskScore');
    riskEl.className = 'value'; // Reset
    let riskLabel = '';
    if (risk <= 33) {
        riskEl.classList.add('risk--low');
        riskLabel = '(low)';
    } else if (risk <= 66) {
        riskEl.classList.add('risk--med');
        riskLabel = '(medium)';
    } else {
        riskEl.classList.add('risk--high');
        riskLabel = '(high)';
    }
    riskEl.textContent = `${risk.toFixed(0)} ${riskLabel}`;

    // Update Asset List
    const listEl = document.getElementById('assetList');
    listEl.innerHTML = '';

    ASSETS.forEach(asset => {
        const val = p[asset.id];
        const percentage = (val / total) * 100;

        const li = document.createElement('li');
        li.className = 'asset-item';
        li.innerHTML = `
            <div class="asset-info">
                <div class="color-dot" style="background-color: ${asset.color}"></div>
                <div>
                    <span class="asset-name">${asset.name}</span>
                    <span class="asset-desc">${asset.desc}</span>
                </div>
            </div>
            <div class="asset-value">
                $${(val / 1000).toFixed(0)}k <small class="text-muted">(${percentage.toFixed(1)}%)</small>
            </div>
        `;
        listEl.appendChild(li);
    });

    // Draw Pie Chart
    renderPieChart(p, total);
}

function renderPieChart(portfolio, total) {
    const svg = document.getElementById('treasuryChart');
    svg.innerHTML = '';

    let cumulativePercent = 0;

    ASSETS.forEach(asset => {
        const val = portfolio[asset.id];
        const percent = val / total;
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += percent;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = percent > 0.5 ? 1 : 0;

        const pathData = [
            `M 50 50`,
            `L ${startX} ${startY}`,
            `A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 50 50`
        ].join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', asset.color);
        path.style.transition = 'd 0.5s ease';

        svg.appendChild(path);
    });
}

function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent) * 50 + 50;
    const y = Math.sin(2 * Math.PI * percent) * 50 + 50;
    return [x, y];
}

function renderRules() {
    // Update Slider Values
    document.getElementById('val-shock').textContent = `${state.params.shockMagnitude}%`;
    document.getElementById('val-reserve').textContent = `${state.params.targetReserveRatio}%`;
    document.getElementById('val-dist').textContent = `${state.params.yieldDistribution}%`;

    // Update Slider Labels
    document.getElementById('label-shock').textContent = getSliderLabel('shock', state.params.shockMagnitude);
    document.getElementById('label-reserve').textContent = getSliderLabel('reserve', state.params.targetReserveRatio);
    document.getElementById('label-dist').textContent = getSliderLabel('dist', state.params.yieldDistribution);

    // Highlight Active Rules
    document.getElementById('rule-shock').classList.toggle('active', state.currentStep === 1);
    document.getElementById('rule-rebalance').classList.toggle('active', state.currentStep === 2);
    document.getElementById('rule-dist').classList.toggle('active', state.currentStep === 3);

    // Update Policy Preview (reflect some current numeric values)
    const previewEl = document.getElementById('policyPreviewCode');
    if (previewEl) {
            const previewText = `policy: "reserve_guardrail" {
        shock_magnitude = ${state.params.shockMagnitude}%
        when reserve_ratio < ${state.params.targetReserveRatio} {
            sell "bonds"
            buy "tBills"
        }
    }

    policy: "monthly_yield" {
        at every month_end {
            distribute ${state.params.yieldDistribution}% to holders
        }
    }
    `;

            // Only update and animate when the text actually changes
            if (previewEl.textContent !== previewText) {
                previewEl.textContent = previewText;
                const card = previewEl.closest('.policy-preview-card');
                if (card) {
                    card.classList.remove('flash');
                    // Force reflow to restart animation
                    // eslint-disable-next-line no-unused-expressions
                    void card.offsetWidth;
                    card.classList.add('flash');
                    // Remove the class after animation duration
                    setTimeout(() => card.classList.remove('flash'), 900);
                }
            }
    }
}

function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = '';

    SIMULATION_STEPS.forEach((step, index) => {
        const isActive = index === state.currentStep;
        const isCompleted = index < state.currentStep;

        // Delta Calculation
        let deltaHtml = '';
        if (index > 0 && state.history[index] && state.history[index - 1]) {
            const curr = state.history[index].value;
            const prev = state.history[index - 1].value;
            const diff = curr - prev;
            const pct = (diff / prev) * 100;

            const sign = diff >= 0 ? '+' : ''; // minus is automatic
            const colorClass = diff >= 0 ? 'delta-pos' : 'delta-neg';

            deltaHtml = `<div class="step-metrics">
                Value: $${(curr / 1000).toFixed(0)}k 
                <span class="${colorClass}">(${sign}$${(Math.abs(diff) / 1000).toFixed(0)}k, ${sign}${pct.toFixed(1)}%)</span>
            </div>`;
        } else if (index === 0 && state.history[0]) {
            deltaHtml = `<div class="step-metrics">Value: $${(state.history[0].value / 1000).toFixed(0)}k</div>`;
        }

        const div = document.createElement('div');
        div.className = `timeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;

        // Optional small Rialo note for certain steps (subtle, explanatory)
        let rialoNoteHtml = '';
        if (step.key === 'REBALANCE') {
            rialoNoteHtml = `
                <div class="timeline-rialo-note">
                    <strong>On Rialo, this step could be:</strong>
                    <ul>
                        <li>A small on‑chain program that watches a real‑world price feed,</li>
                        <li>Checks if <code>reserve_ratio &lt; target_ratio</code>,</li>
                        <li>And schedules a single atomic rebalance transaction via native infrastructure.</li>
                    </ul>
                </div>
            `;
        } else if (step.key === 'DISTRIBUTION') {
            rialoNoteHtml = `
                <div class="timeline-rialo-note">
                    <strong>On Rialo, this could map to:</strong>
                    <ul>
                        <li>A scheduled on‑chain action that runs at month‑end,</li>
                        <li>Calculates yield from protocol data,</li>
                        <li>And distributes it in a single native transaction.</li>
                    </ul>
                </div>
            `;
        }

        div.innerHTML = `
            <div class="step-marker"></div>
            <div class="step-content">
                <div class="step-header-row">
                    <span class="step-title">${step.title}</span>
                    ${isActive ? '<span class="now-badge">● Now</span>' : ''}
                </div>
                <p class="step-desc">${step.description}</p>
                ${deltaHtml}
                <div class="comparison-box">
                    <div class="comp-item comp-trad">
                        <span class="comp-label">Traditional</span>
                        ${step.traditionalText}
                    </div>
                    <div class="comp-item comp-rialo">
                        <span class="comp-label">Rialo</span>
                        ${step.rialoText}
                    </div>
                </div>
                ${rialoNoteHtml}
            </div>
        `;
        container.appendChild(div);
    });
    // After rendering, ensure the active step is visible inside the timeline container
    scrollTimelineStepIntoView();
}

// Scroll the timeline steps container so the active step is centered/visible
function scrollTimelineStepIntoView() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    const active = container.querySelector('.timeline-step.active');
    if (!active) return;

    // Align the active step to the top of the timeline container with a small padding
    const padding = 12; // px
    const scrollTarget = Math.max(0, active.offsetTop - padding);
    try {
        container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    } catch (e) {
        container.scrollTop = scrollTarget;
    }
}

function renderLogs() {
    const list = document.getElementById('simLogList');
    if (!list) return;
    list.innerHTML = '';

    // Show last 5 logs or all? Let's show all, scrollable.
    state.logs.forEach(msg => {
        const li = document.createElement('li');
        li.textContent = msg;
        list.appendChild(li);
    });

    // Auto-scroll to bottom
    list.scrollTop = list.scrollHeight;
}

function renderControls() {
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const statusText = document.getElementById('statusText');
    const microStatus = document.getElementById('microStatus');

    if (state.isPlaying) {
        btnPlay.disabled = true;
        btnPause.disabled = false;
    } else {
        btnPlay.disabled = false;
        btnPause.disabled = true;
    }

    // Current Step Label
    const currentTitle = SIMULATION_STEPS[state.currentStep].title;
    statusText.textContent = state.currentStep === SIMULATION_STEPS.length - 1
        ? `${currentTitle} (Complete)`
        : currentTitle;

    // Micro Status
    if (state.isPlaying) {
        if (state.currentStep === 0) updateMicroStatus("Status: Applying market shock...");
        else if (state.currentStep === 1) updateMicroStatus("Status: Checking policies and rebalancing...");
        else if (state.currentStep === 2) updateMicroStatus("Status: Scheduling final yield distribution...");
    } else if (state.currentStep === SIMULATION_STEPS.length - 1) {
        updateMicroStatus("Simulation complete. Tweak the sliders and run it again.");
    } else {
        // Paused or Ready
        if (state.currentStep === 0 && !state.hasEverPlayed) {
            updateMicroStatus("Status: Ready. Hit Play to start the story.");
        } else {
            updateMicroStatus("Status: Paused.");
        }
    }
}

function updateMicroStatus(msg) {
    const el = document.getElementById('microStatus');
    if (el) el.textContent = msg;
}

function getSliderLabel(type, val) {
    if (type === 'shock') {
        if (val <= 10) return 'calm markets';
        if (val <= 25) return 'normal turbulence';
        if (val <= 40) return 'rough seas';
        return 'full chaos mode';
    }
    if (type === 'reserve') {
        if (val <= 110) return 'lightly defensive';
        if (val <= 130) return 'risk-aware';
        return 'max safety mode';
    }
    if (type === 'dist') {
        if (val <= 2) return 'almost no payouts';
        if (val <= 6) return 'balanced rewards';
        return 'aggressive payout policy';
    }
    return '';
}

function setupEventListeners() {
    // Controls
    document.getElementById('btn-play').addEventListener('click', playSimulation);
    document.getElementById('btn-pause').addEventListener('click', stopSimulation);
    document.getElementById('btn-reset').addEventListener('click', resetSimulation);

    // Sliders
    const sShock = document.getElementById('slider-shock');
    const sReserve = document.getElementById('slider-reserve');
    const sDist = document.getElementById('slider-dist');

    sShock.addEventListener('input', (e) => {
        state.params.shockMagnitude = parseInt(e.target.value);
        renderRules();
        renderTreasury(); // Update Risk Score live
    });
    sReserve.addEventListener('input', (e) => {
        state.params.targetReserveRatio = parseInt(e.target.value);
        renderRules();
    });
    sDist.addEventListener('input', (e) => {
        state.params.yieldDistribution = parseInt(e.target.value);
        renderRules();
    });

    // Presets
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const preset = e.target.dataset.preset;
            applyPreset(preset);

            // Update slider inputs visually
            sShock.value = state.params.shockMagnitude;
            sReserve.value = state.params.targetReserveRatio;
            sDist.value = state.params.yieldDistribution;
            renderRules();
        });
    });
}

// Start
init();
