// ==============================
// PHYSIOLOGISCHER SEUFZER — Atemroutine
// ==============================
(function () {
    // Zeiten orientiert an Balban et al. 2023 (Stanford, Cell Reports Medicine) &
    // Huberman Labs Protokoll: 1:2-Verhältnis Einatmen:Ausatmen (dort z.B. 4s:8s).
    // Erste Einatmung ~3s, kurzes Nachziehen ~1,2s, Ausatmung ~doppelt so lang wie beide Einatmungen zusammen.
    const PHASES = [
        { key: 'inhale1', label: 'Einatmen', instruction: 'Tief durch die Nase einatmen', duration: 3000, scale: 0.78, filter: 1500, gain: 0.13, pitch: 1.07 },
        { key: 'inhale2', label: 'Nachziehen', instruction: 'Noch einmal kurz durch die Nase nachziehen', duration: 1200, scale: 1.0, filter: 1900, gain: 0.16, pitch: 1.125 },
        { key: 'exhale', label: 'Ausatmen', instruction: 'Lang & entspannt durch den Mund ausatmen', duration: 8400, scale: 0.5, filter: 420, gain: 0.05, pitch: 1.0 }
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
    // Kein externer Musik-Track. Zwei Schichten:
    //  1) Ein warmer Ambient-Pad-Ton, der beim Einatmen sanft nach oben gleitet
    //     und beim Ausatmen wieder absinkt — so klingt Ein- und Ausatmen spürbar anders.
    //  2) Ein leises, atemähnliches Rauschen ("Whoosh"), das nur beim Ausatmen
    //     kurz anschwillt und wieder verklingt.
    // Ein synthetischer Hall (Impulsantwort aus Rauschen) gibt dem Pad Wärme und Raum.
    // ------------------------------
    const BreathAudio = (function () {
        let ctx = null, masterGain = null, filter = null, oscillators = [];
        let noiseSource = null, noiseFilter = null, noiseGain = null;
        const baseFreq = 130.81; // C3
        const partials = [
            { ratio: 1, type: 'sine', gain: 0.5, detune: 0 },
            { ratio: 1, type: 'sine', gain: 0.2, detune: -7 },   // leichte Schwebung für Wärme
            { ratio: 1.5, type: 'sine', gain: 0.22, detune: 0 }, // Quinte
            { ratio: 2.25, type: 'triangle', gain: 0.09, detune: 0 } // None, luftige Oberstimme
        ];

        function createReverbImpulse(duration, decay) {
            const rate = ctx.sampleRate;
            const length = Math.floor(rate * duration);
            const impulse = ctx.createBuffer(2, length, rate);
            for (let ch = 0; ch < 2; ch++) {
                const data = impulse.getChannelData(ch);
                for (let i = 0; i < length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
                }
            }
            return impulse;
        }

        function createBreathNoiseBuffer() {
            const length = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < length; i++) {
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + 0.02 * white) / 1.02;
                data[i] = lastOut * 3.2;
            }
            return buffer;
        }

        function build() {
            ctx = new (window.AudioContext || window.webkitAudioContext)();

            filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 420;
            filter.Q.value = 0.5;

            const dryGain = ctx.createGain();
            dryGain.gain.value = 0.8;
            const wetGain = ctx.createGain();
            wetGain.gain.value = 0.35;
            const reverb = ctx.createConvolver();
            reverb.buffer = createReverbImpulse(1.8, 2.4);

            masterGain = ctx.createGain();
            masterGain.gain.value = 0.0001;

            filter.connect(dryGain).connect(masterGain);
            filter.connect(reverb).connect(wetGain).connect(masterGain);
            masterGain.connect(ctx.destination);

            oscillators = partials.map(p => {
                const osc = ctx.createOscillator();
                osc.type = p.type;
                osc.frequency.value = baseFreq * p.ratio;
                osc.detune.value = p.detune;
                const g = ctx.createGain();
                g.gain.value = p.gain;
                osc.connect(g);
                g.connect(filter);
                osc.start();
                return { osc, ratio: p.ratio };
            });

            // Atemähnliches Rauschen — nur während des Ausatmens hörbar.
            noiseSource = ctx.createBufferSource();
            noiseSource.buffer = createBreathNoiseBuffer();
            noiseSource.loop = true;
            noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 700;
            noiseFilter.Q.value = 0.6;
            noiseGain = ctx.createGain();
            noiseGain.gain.value = 0.0001;
            noiseSource.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
            noiseSource.start();
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
                const durationSec = phase.duration / 1000;
                const timeConstant = Math.max(durationSec / 3, 0.15);

                filter.frequency.cancelScheduledValues(now);
                filter.frequency.setTargetAtTime(phase.filter, now, timeConstant);
                masterGain.gain.cancelScheduledValues(now);
                masterGain.gain.setTargetAtTime(phase.gain, now, timeConstant);

                oscillators.forEach(({ osc, ratio }) => {
                    osc.frequency.cancelScheduledValues(now);
                    osc.frequency.setTargetAtTime(baseFreq * phase.pitch * ratio, now, timeConstant);
                });

                noiseGain.gain.cancelScheduledValues(now);
                if (phase.key === 'exhale') {
                    const swellTime = Math.min(1.4, durationSec * 0.35);
                    noiseGain.gain.setValueAtTime(0.0001, now);
                    noiseGain.gain.linearRampToValueAtTime(0.045, now + swellTime);
                    noiseGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);
                    noiseFilter.frequency.setTargetAtTime(600, now, timeConstant);
                } else {
                    noiseGain.gain.setTargetAtTime(0.0001, now, 0.2);
                    noiseFilter.frequency.setTargetAtTime(900, now, timeConstant);
                }
            },
            pause() {
                if (!ctx) return;
                const now = ctx.currentTime;
                masterGain.gain.cancelScheduledValues(now);
                masterGain.gain.setTargetAtTime(0.0001, now, 0.2);
                noiseGain.gain.cancelScheduledValues(now);
                noiseGain.gain.setTargetAtTime(0.0001, now, 0.2);
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
                noiseGain.gain.cancelScheduledValues(now);
                noiseGain.gain.setTargetAtTime(0.0001, now, 0.2);
                const closingCtx = ctx;
                const closingOscs = oscillators;
                const closingNoise = noiseSource;
                setTimeout(() => {
                    closingOscs.forEach(({ osc }) => { try { osc.stop(); } catch (e) {} });
                    try { closingNoise.stop(); } catch (e) {}
                    closingCtx.close();
                }, 600);
                ctx = null;
                masterGain = null;
                filter = null;
                oscillators = [];
                noiseSource = null;
                noiseFilter = null;
                noiseGain = null;
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
