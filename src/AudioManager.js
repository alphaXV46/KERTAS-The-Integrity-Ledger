// AudioManager.js — Procedural audio via Web Audio API
export class AudioManager {
  constructor() {
    this._ctx = null;
    this._muted = false;
    this._masterGain = null;
  }

  _init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 0.35;
    this._masterGain.connect(this._ctx.destination);
  }

  _resume() {
    if (this._ctx?.state === 'suspended') this._ctx.resume();
  }

  _tone(freq, type, duration, gainVal = 0.3, delay = 0) {
    if (this._muted) return;
    this._init();
    this._resume();
    const osc = this._ctx.createOscillator();
    const g = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gainVal, this._ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + delay + duration);
    osc.connect(g);
    g.connect(this._masterGain);
    osc.start(this._ctx.currentTime + delay);
    osc.stop(this._ctx.currentTime + delay + duration);
  }

  playGoodChoice() {
    this._tone(523, 'sine', 0.15, 0.3);
    this._tone(659, 'sine', 0.15, 0.3, 0.12);
    this._tone(784, 'sine', 0.25, 0.3, 0.24);
  }

  playBadChoice() {
    this._tone(220, 'sawtooth', 0.25, 0.2);
    this._tone(185, 'sawtooth', 0.3, 0.2, 0.15);
  }

  playTokenDepleted() {
    this._tone(150, 'square', 0.4, 0.25);
    this._tone(100, 'sawtooth', 0.4, 0.25, 0.2);
  }

  playClick() {
    this._tone(800, 'sine', 0.08, 0.15);
  }

  playWin() {
    [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 'sine', 0.3, 0.4, i * 0.1));
  }

  playLose() {
    [400, 320, 240, 160].forEach((f, i) => this._tone(f, 'sawtooth', 0.3, 0.3, i * 0.15));
  }

  playTick() {
    this._tone(1200, 'sine', 0.05, 0.1);
  }

  toggleMute() {
    this._muted = !this._muted;
    if (this._masterGain) {
      this._masterGain.gain.value = this._muted ? 0 : 0.35;
    }
    return this._muted;
  }

  get isMuted() { return this._muted; }
}
