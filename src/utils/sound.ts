/**
 * Retro Pokedex Web Audio Synthesizer & Soft Volume-Normalized Official Pokemon Cry Player.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private activeAudio: HTMLAudioElement | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private decodedCryCache: Map<string, AudioBuffer> = new Map();

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playClick(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.045);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  public playWrongGuess(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.setValueAtTime(210, now + 0.09);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playWinFanfare(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.085;
      const dur = idx === notes.length - 1 ? 0.32 : 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.05, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.01);
    });
  }

  public playGameOver(enabled: boolean): void {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [392.0, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.12;
      const dur = 0.16;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.05, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.01);
    });
  }

  /**
   * Computes a gentle, ear-safe gain multiplier for a Pokémon cry so it matches
   * the soft UI sound level and never startles the player.
   */
  private computeNormalizedGain(buffer: AudioBuffer): number {
    const channelData = buffer.getChannelData(0);
    let sumSquares = 0;
    let activeSamples = 0;
    let peak = 0;

    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > peak) {
        peak = abs;
      }
      if (abs > 0.008) {
        sumSquares += abs * abs;
        activeSamples++;
      }
    }

    if (activeSamples === 0 || peak === 0) {
      return 0.08;
    }

    const rms = Math.sqrt(sumSquares / activeSamples);
    // Gentle target RMS and strict peak ceiling matching the soft UI sounds
    const TARGET_RMS = 0.032;
    const MAX_PEAK_CEILING = 0.14;

    let gain = TARGET_RMS / Math.max(0.02, rms);
    if (gain * peak > MAX_PEAK_CEILING) {
      gain = MAX_PEAK_CEILING / peak;
    }

    return Math.max(0.03, Math.min(0.32, gain));
  }

  /**
   * Plays the official Pokemon cry audio from PokeAPI (`cries.latest`) with:
   * - Soft RMS normalization & strict peak ceiling
   * - 45ms smooth fade-in ramp (eliminates sudden startle pop)
   * - 3.6kHz low-pass filter (tames piercing chiptune high frequencies)
   * - Post-gain limiter/compressor
   */
  public async playPokemonCry(
    cryUrl?: string,
    forcePlay: boolean = true
  ): Promise<void> {
    if (!forcePlay || !cryUrl || typeof window === 'undefined') return;

    // Stop any currently playing cry
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {
        // Ignore
      }
      this.activeSource = null;
    }
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }

    const ctx = this.getContext();
    if (ctx) {
      try {
        let audioBuffer = this.decodedCryCache.get(cryUrl);
        if (!audioBuffer) {
          const response = await fetch(cryUrl, { mode: 'cors' });
          if (!response.ok) throw new Error('Cry fetch failed');
          const arrayBuffer = await response.arrayBuffer();
          audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          this.decodedCryCache.set(cryUrl, audioBuffer);
        }

        const normalizedGain = this.computeNormalizedGain(audioBuffer);
        const now = ctx.currentTime;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        // Low-pass filter rolls off harsh, ear-piercing chiptune frequencies above 3.6kHz
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(3600, now);
        lowpass.Q.setValueAtTime(0.7, now);

        // Gain node with a gentle 45ms fade-in ramp so it never pops or startles
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(normalizedGain, now + 0.045);

        // Brickwall dynamics compressor after gain node as a final safety ceiling
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, now);
        compressor.knee.setValueAtTime(10, now);
        compressor.ratio.setValueAtTime(12, now);
        compressor.attack.setValueAtTime(0.002, now);
        compressor.release.setValueAtTime(0.15, now);

        source.connect(lowpass);
        lowpass.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(ctx.destination);

        this.activeSource = source;
        source.onended = () => {
          if (this.activeSource === source) {
            this.activeSource = null;
          }
        };

        source.start(0);
        return;
      } catch {
        // Fallback to standard HTMLAudioElement below if Web Audio decode fails
      }
    }

    try {
      const audio = new Audio(cryUrl);
      audio.volume = 0.08;
      this.activeAudio = audio;
      audio.play().catch(() => {
        this.playClick(true);
      });
    } catch {
      this.playClick(true);
    }
  }
}

export const soundEngine = new SoundEngine();
