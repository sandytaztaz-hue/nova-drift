// Procedural WebAudio sound effects for NOVA DRIFT: every sound is synthesized
// from oscillators and filtered noise at play time. No audio files, no network.
// The context is created lazily on the first user gesture; until then every
// call is a safe no-op, so headless screenshot runs stay silent and error-free.
export class NovaAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
  }

  /** Create (or resume) the audio context. Call from a user gesture. */
  unlock() {
    try {
      if (!this.context) {
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        if (!Ctor) return;
        this.context = new Ctor();
        this.master = this.context.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') void this.context.resume();
    } catch {
      this.context = null;
    }
  }

  _tone({ frequency, endFrequency, duration, type = 'sine', volume = 0.5, delay = 0 }) {
    if (!this.context || !this.master || this.muted) return;
    try {
      const now = this.context.currentTime + delay;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      if (endFrequency !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // A sound must never break the game.
    }
  }

  _noise({ duration, volume = 0.4, frequency = 1200, delay = 0 }) {
    if (!this.context || !this.master || this.muted) return;
    try {
      const now = this.context.currentTime + delay;
      const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = frequency;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(now);
    } catch {
      // A sound must never break the game.
    }
  }

  /** A short bright zap when a bullet leaves the ship. */
  laser() {
    this._tone({ frequency: 880, endFrequency: 220, duration: 0.09, type: 'square', volume: 0.12 });
  }

  /** A thump-and-noise burst when an enemy dies; bigger enemies boom longer. */
  explosion(big = false) {
    this._noise({ duration: big ? 0.5 : 0.28, volume: big ? 0.5 : 0.32, frequency: big ? 900 : 1600 });
    this._tone({ frequency: big ? 160 : 220, endFrequency: 40, duration: big ? 0.45 : 0.25, type: 'sine', volume: 0.4 });
  }

  /** A rising two-note chime when a nova core is collected. */
  pickup() {
    this._tone({ frequency: 660, duration: 0.07, type: 'sine', volume: 0.18 });
    this._tone({ frequency: 990, duration: 0.1, type: 'sine', volume: 0.18, delay: 0.06 });
  }

  /** A low hit thud when the ship takes damage. */
  hurt() {
    this._tone({ frequency: 140, endFrequency: 55, duration: 0.22, type: 'sawtooth', volume: 0.3 });
    this._noise({ duration: 0.15, volume: 0.2, frequency: 700 });
  }

  /** A rising stinger when a new wave begins. */
  waveHorn() {
    this._tone({ frequency: 220, endFrequency: 440, duration: 0.35, type: 'triangle', volume: 0.25 });
    this._tone({ frequency: 330, endFrequency: 660, duration: 0.35, type: 'triangle', volume: 0.18, delay: 0.08 });
  }

  /** A bright arpeggio when an upgrade card is chosen. */
  upgrade() {
    [523, 659, 784, 1047].forEach((frequency, i) => {
      this._tone({ frequency, duration: 0.12, type: 'triangle', volume: 0.2, delay: i * 0.07 });
    });
  }

  /** A slow descending line when the run ends. */
  gameOver() {
    [392, 311, 262, 196].forEach((frequency, i) => {
      this._tone({ frequency, duration: 0.3, type: 'triangle', volume: 0.22, delay: i * 0.16 });
    });
  }
}
