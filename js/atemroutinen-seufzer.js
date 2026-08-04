// ==============================
// PHYSIOLOGISCHER SEUFZER — Atemroutine
// ==============================
(function () {
    const PHASES = [
        { key: 'inhale1', label: 'Einatmen', instruction: 'Tief durch die Nase einatmen', duration: 1900, scale: 0.78, filter: 1500, gain: 0.13 },
        { key: 'inhale2', label: 'Nachziehen', instruction: 'Noch einmal kurz durch die Nase nachziehen', duration: 900, scale: 1.0, filter: 1900, gain: 0.16 },
        { key: 'exhale', label: 'Ausatmen', instruction: 'Lang & entspannt durch den Mund ausatmen', duration: 6200, scale: 0.5, filter: 420, gain: 0.05 }
    ];
    const REST_SCALE = 0.5;
    const CYCLE_MS = PHASES.reduce((sum, p) => sum + p.duration, 0);

    const els = {
        panel: document.getElementById('breathPanel'),
        session: document.getElementById('breathSession'),
        complete: document.getElementById('breathComplete'),
        modeCycles: document.getElementById('modeCycles'),
        modeDuration: document.getElementById('modeDuration'),
        fieldCycles: document.getElementById('fieldCycles'),
        fieldDuration: document.getElementById('fieldDuration'),
        inputCycles: document.getElementById('inputCycles'),
        inputDuration: document.getElementById('inputDuration'),
        hintCycles: document.getElementById('hintCycles'),
        hintDuration: document.getElementById('hintDuration'),
        musicOn: document.getElementById('musicOn'),
        musicOff: document.getElementById('musicOff'),
        startBtn: document.getElementById('breathStartBtn'),
        pauseBtn: document.getElementById('breathPauseBtn'),
        stopBtn: document.getElementById('breathStopBtn'),
        circle: document.getElementById('breathCircle'),
        phaseLabel: document.getElementById('breathPhaseLabel'),
        phaseInstruction: document.getElementById('breathPhaseInstruction'),
        cycleCurrent: document.getElementById('breathCycleCurrent'),
        cycleTotal: document.getElementById('breathCycleTotal'),
        completeCycles: document.getElementById('completeCycles'),
        completeDuration: document.getElementById('completeDuration'),
        restartBtn: document.getElementById('breathRestartBtn'),
        backBtn: document.getElementById('breathBackBtn')
    };

    if (!els.panel) return; // Script eingebunden, aber kein Atem-Tool auf dieser Seite

    // ------------------------------
    // Settings-Panel: Modus & Werte
    // ------------------------------
    let mode = 'cycles';
    let musicEnabled = false;

    function estimateMinutes(cycles) {
        return (cycles * CYCLE_MS) / 60000;
    }

    function estimateCycles(minutes) {
        return Math.max(1, Math.round((minutes * 60000) / CYCLE_MS));
    }

    function updateHints() {
        const cycles = Math.max(1, parseInt(els.inputCycles.value, 10) || 1);
        els.hintCycles.textContent = `≈ ${estimateMinutes(cycles).toFixed(1).replace('.0', '')} Minuten`;

        const minutes = Math.max(1, parseFloat(els.inputDuration.value) || 1);
        els.hintDuration.textContent = `≈ ${estimateCycles(minutes)} Zyklen`;
    }

    function setMode(newMode) {
        mode = newMode;
        els.modeCycles.classList.toggle('active', mode === 'cycles');
        els.modeCycles.setAttribute('aria-pressed', mode === 'cycles');
        els.modeDuration.classList.toggle('active', mode === 'duration');
        els.modeDuration.setAttribute('aria-pressed', mode === 'duration');
        els.fieldCycles.style.display = mode === 'cycles' ? 'block' : 'none';
        els.fieldDuration.style.display = mode === 'duration' ? 'block' : 'none';
    }

    function setMusic(enabled) {
        musicEnabled = enabled;
        els.musicOn.classList.toggle('active', enabled);
        els.musicOn.setAttribute('aria-pressed', enabled);
        els.musicOff.classList.toggle('active', !enabled);
        els.musicOff.setAttribute('aria-pressed', !enabled);
    }

    els.modeCycles.addEventListener('click', () => setMode('cycles'));
    els.modeDuration.addEventListener('click', () => setMode('duration'));
    els.musicOn.addEventListener('click', () => setMusic(true));
    els.musicOff.addEventListener('click', () => setMusic(false));
    els.inputCycles.addEventListener('input', updateHints);
    els.inputDuration.addEventListener('input', updateHints);

    setMode('cycles');
    setMusic(false);
    updateHints();

    // ------------------------------
    // Generative Klangbegleitung (Web Audio API)
    // Kein externer Musik-Track — ein weicher Ambient-Pad,
    // dessen Lautstärke & Klangfarbe dem Atemrhythmus folgt.
    // ------------------------------
    const BreathAudio = (function () {
        let ctx = null, masterGain = null, filter = null, oscillators = [];

        function build() {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 420;
            filter.Q.value = 0.6;

            masterGain = ctx.createGain();
            masterGain.gain.value = 0.0001;

            filter.connect(masterGain);
            masterGain.connect(ctx.destination);

            const partials = [
                { ratio: 1, type: 'sine', gain: 0.6 },
                { ratio: 1.5, type: 'sine', gain: 0.28 },
                { ratio: 2, type: 'triangle', gain: 0.12 }
            ];
            const baseFreq = 130.81; // C3

            oscillators = partials.map(p => {
                const osc = ctx.createOscillator();
                osc.type = p.type;
                osc.frequency.value = baseFreq * p.ratio;
                const g = ctx.createGain();
                g.gain.value = p.gain;
                osc.connect(g);
                g.connect(filter);
                osc.start();
                return osc;
            });
        }

        return {
            start() {
                if (!ctx) build();
                if (ctx.state === 'suspended') ctx.resume();
                const now = ctx.currentTime;
                masterGain.gain.cancelScheduledValues(now);
                masterGain.gain.setTargetAtTime(0.12, now, 0.6);
            },
            setPhase(phase) {
                if (!ctx) return;
                const now = ctx.currentTime;
                const timeConstant = Math.max(phase.duration / 1000 / 3, 0.15);
                filter.frequency.cancelScheduledValues(now);
                filter.frequency.setTargetAtTime(phase.filter, now, timeConstant);
                masterGain.gain.cancelScheduledValues(now);
                masterGain.gain.setTargetAtTime(phase.gain, now, timeConstant);
            },
            pause() {
                if (!ctx) return;
                const now = ctx.currentTime;
                masterGain.gain.cancelScheduledValues(now);
                masterGain.gain.setTargetAtTime(0.0001, now, 0.2);
            },
            resume(phase) {
                if (!ctx) return;
                this.setPhase(phase);
            },
            stop() {
                if (!ctx) return;
                const now = ctx.currentTime;
                masterGain.gain.cancelScheduledValues(now);
                masterGain.gain.setTargetAtTime(0.0001, now, 0.3);
                const closingCtx = ctx;
                const closingOscs = oscillators;
                setTimeout(() => {
                    closingOscs.forEach(o => { try { o.stop(); } catch (e) {} });
                    closingCtx.close();
                }, 600);
                ctx = null;
                masterGain = null;
                filter = null;
                oscillators = [];
            }
        };
    })();

    // ------------------------------
    // Atem-Engine (rAF-getrieben, pausierbar)
    // ------------------------------
    function easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    const state = {
        running: false,
        paused: false,
        phaseIndex: 0,
        phaseStartTime: 0,
        pausedElapsed: 0,
        cycle: 0,
        totalCycles: 8,
        rafId: null,
        startedAt: 0
    };

    function prevScaleFor(index) {
        return index === 0 ? REST_SCALE : PHASES[index - 1].scale;
    }

    function applyVisual(scale, phase) {
        els.circle.style.setProperty('--breath-scale', scale.toFixed(4));
        els.phaseLabel.textContent = phase.label;
        els.phaseInstruction.textContent = phase.instruction;
    }

    function tick(now) {
        if (!state.running || state.paused) return;
        const phase = PHASES[state.phaseIndex];
        const elapsed = now - state.phaseStartTime;
        const t = Math.min(elapsed / phase.duration, 1);
        const scale = prevScaleFor(state.phaseIndex) + (phase.scale - prevScaleFor(state.phaseIndex)) * easeInOutSine(t);
        applyVisual(scale, phase);

        if (t >= 1) {
            advancePhase(now);
        } else {
            state.rafId = requestAnimationFrame(tick);
        }
    }

    function advancePhase(now) {
        let nextIndex = state.phaseIndex + 1;
        if (nextIndex >= PHASES.length) {
            nextIndex = 0;
            state.cycle++;
            els.cycleCurrent.textContent = state.cycle;
            if (state.cycle >= state.totalCycles) {
                finishSession();
                return;
            }
        }
        state.phaseIndex = nextIndex;
        state.phaseStartTime = now;
        if (musicEnabled) BreathAudio.setPhase(PHASES[nextIndex]);
        state.rafId = requestAnimationFrame(tick);
    }

    function startSession() {
        const cycles = mode === 'cycles'
            ? Math.min(60, Math.max(1, parseInt(els.inputCycles.value, 10) || 8))
            : estimateCycles(Math.max(1, parseFloat(els.inputDuration.value) || 3));

        state.running = true;
        state.paused = false;
        state.phaseIndex = 0;
        state.cycle = 0;
        state.totalCycles = cycles;
        state.startedAt = performance.now();

        els.cycleCurrent.textContent = '0';
        els.cycleTotal.textContent = cycles;
        els.circle.classList.remove('idle');
        applyVisual(REST_SCALE, { label: 'Bereit …', instruction: 'Gleich geht’s los' });

        els.panel.style.display = 'none';
        els.complete.style.display = 'none';
        els.session.style.display = 'block';
        els.pauseBtn.textContent = 'Pause';

        if (musicEnabled) BreathAudio.start();

        const now = performance.now();
        state.phaseStartTime = now;
        if (musicEnabled) BreathAudio.setPhase(PHASES[0]);
        state.rafId = requestAnimationFrame(tick);
    }

    function togglePause() {
        if (!state.running) return;
        if (state.paused) {
            state.paused = false;
            const now = performance.now();
            state.phaseStartTime = now - state.pausedElapsed;
            els.pauseBtn.textContent = 'Pause';
            if (musicEnabled) BreathAudio.resume(PHASES[state.phaseIndex]);
            state.rafId = requestAnimationFrame(tick);
        } else {
            state.paused = true;
            cancelAnimationFrame(state.rafId);
            state.pausedElapsed = performance.now() - state.phaseStartTime;
            els.pauseBtn.textContent = 'Weiter';
            if (musicEnabled) BreathAudio.pause();
        }
    }

    function endSession(toPanel) {
        state.running = false;
        state.paused = false;
        cancelAnimationFrame(state.rafId);
        BreathAudio.stop();
        els.session.style.display = 'none';
        els.complete.style.display = 'none';
        els.circle.classList.add('idle');
        applyVisual(REST_SCALE, { label: 'Bereit?', instruction: 'Wähle deine Einstellungen und starte.' });
        if (toPanel) els.panel.style.display = 'block';
    }

    function finishSession() {
        state.running = false;
        cancelAnimationFrame(state.rafId);
        BreathAudio.stop();
        const totalSeconds = Math.round((performance.now() - state.startedAt) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        els.completeCycles.textContent = state.totalCycles;
        els.completeDuration.textContent = minutes > 0 ? `${minutes} Min. ${seconds} Sek.` : `${seconds} Sek.`;
        els.session.style.display = 'none';
        els.complete.style.display = 'block';
    }

    els.circle.classList.add('idle');
    applyVisual(REST_SCALE, { label: 'Bereit?', instruction: 'Wähle deine Einstellungen und starte.' });

    els.startBtn.addEventListener('click', startSession);
    els.pauseBtn.addEventListener('click', togglePause);
    els.stopBtn.addEventListener('click', () => endSession(true));
    els.restartBtn.addEventListener('click', () => {
        els.complete.style.display = 'none';
        startSession();
    });
    els.backBtn.addEventListener('click', () => endSession(true));
})();
