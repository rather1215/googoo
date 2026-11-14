// Synthesized retro 8-bit/16-bit Web Audio sound effects (no external files required)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.08,
    delay = 0,
    slideTo?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playStep() {
    this.playTone(190, 0.045, 'triangle', 0.04, 0, 140);
  }

  playBump() {
    this.playTone(110, 0.08, 'sine', 0.06, 0, 75);
  }

  playSelect() {
    this.playTone(520, 0.06, 'triangle', 0.06);
  }

  playTick() {
    this.playTone(880, 0.04, 'square', 0.04);
  }

  playCorrect() {
    this.playTone(523.25, 0.09, 'triangle', 0.09, 0);
    this.playTone(659.25, 0.09, 'triangle', 0.09, 0.07);
    this.playTone(783.99, 0.16, 'triangle', 0.1, 0.14);
  }

  playAttack() {
    this.playTone(320, 0.08, 'sawtooth', 0.07, 0, 640);
    this.playTone(587.33, 0.11, 'square', 0.06, 0.06);
    this.playTone(880, 0.14, 'triangle', 0.08, 0.12);
  }

  playWrong() {
    this.playTone(260, 0.12, 'triangle', 0.08, 0, 190);
    this.playTone(195, 0.18, 'triangle', 0.08, 0.11, 145);
  }

  playDoorOpen() {
    this.playTone(392, 0.09, 'triangle', 0.08, 0);
    this.playTone(523.25, 0.09, 'triangle', 0.08, 0.08);
    this.playTone(659.25, 0.1, 'triangle', 0.09, 0.16);
    this.playTone(1046.5, 0.22, 'triangle', 0.09, 0.24);
  }

  playChestOpen() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, 0.12, 'sine', 0.09, i * 0.065);
    });
  }

  playDefeatMonster() {
    this.playTone(440, 0.09, 'square', 0.06, 0);
    this.playTone(554.37, 0.09, 'square', 0.06, 0.07);
    this.playTone(659.25, 0.09, 'square', 0.06, 0.14);
    this.playTone(880, 0.22, 'triangle', 0.09, 0.21);
  }

  playStageClear() {
    const melody = [
      { f: 523.25, d: 0.11, t: 0 },
      { f: 659.25, d: 0.11, t: 0.11 },
      { f: 783.99, d: 0.11, t: 0.22 },
      { f: 1046.5, d: 0.3, t: 0.33 },
      { f: 783.99, d: 0.1, t: 0.55 },
      { f: 1046.5, d: 0.35, t: 0.66 },
    ];
    melody.forEach((m) => this.playTone(m.f, m.d, 'triangle', 0.09, m.t));
  }

  playGameOver() {
    this.playTone(349.23, 0.16, 'triangle', 0.08, 0);
    this.playTone(329.63, 0.16, 'triangle', 0.08, 0.16);
    this.playTone(293.66, 0.18, 'triangle', 0.08, 0.32);
    this.playTone(261.63, 0.32, 'triangle', 0.08, 0.48);
  }
}

export const sound = new SoundEngine();
