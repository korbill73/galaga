export default class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    play(type) {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);

        switch (type) {
            case 'shoot':
                // Pew Pew: Fast frequency sweep
                const osc = this.ctx.createOscillator();
                osc.connect(gain);
                osc.type = 'square'; // Square wave for 8-bit feel
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case 'explosion':
                // Boom: White noise
                if (!this.noiseBuffer) this.noiseBuffer = this.createNoiseBuffer();
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.noiseBuffer;

                // Filter for "thud" sound
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1000, now);
                filter.frequency.linearRampToValueAtTime(100, now + 0.3);

                noise.connect(filter);
                filter.connect(gain);

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

                noise.start(now);
                noise.stop(now + 0.3);
                break;

            case 'powerup':
                // Magic sound: Arpeggio or chime
                const osc1 = this.ctx.createOscillator();
                osc1.type = 'triangle';
                osc1.connect(gain);

                // Play two tones
                osc1.frequency.setValueAtTime(523.25, now); // C5
                osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
                osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5

                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);

                osc1.start(now);
                osc1.stop(now + 0.4);
                break;
        }
    }
}
