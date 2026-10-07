/**
 * Motore audio Web Audio API per l'Allenatore di Ritmo (Salsa & Bachata).
 * Funziona 100% offline nel browser, a bassissima latenza, senza costi API.
 */

export type DanceGenre = 'salsa' | 'bachata';

export interface RhythmInstruments {
  countVoice: boolean; // Metronomo / Conteggio tempi
  clave: boolean;      // Clave (Son Clave per Salsa)
  congas: boolean;     // Tumbao Congas (Salsa)
  cowbell: boolean;    // Campana (Salsa & Bachata)
  bongo: boolean;      // Martillo Bongò
  guira: boolean;      // Güira / Shaker (Bachata)
}

class RhythmAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private bpm: number = 180;
  private genre: DanceGenre = 'salsa';
  private currentBeat: number = 0; // 0 to 7 (tempi 1 a 8)
  private nextBeatTime: number = 0;
  private timerId: number | null = null;
  private onBeatCallback: ((beat: number) => void) | null = null;

  public instruments: RhythmInstruments = {
    countVoice: true,
    clave: true,
    congas: true,
    cowbell: false,
    bongo: true,
    guira: true,
  };

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setGenre(genre: DanceGenre) {
    this.genre = genre;
    // Set appropriate default BPM
    if (genre === 'salsa') {
      this.bpm = 180;
      this.instruments.congas = true;
      this.instruments.clave = true;
      this.instruments.guira = false;
    } else {
      this.bpm = 125;
      this.instruments.congas = false;
      this.instruments.clave = false;
      this.instruments.guira = true;
    }
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(90, Math.min(230, bpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setOnBeat(cb: (beat: number) => void) {
    this.onBeatCallback = cb;
  }

  public start() {
    this.initContext();
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentBeat = 0;
    this.nextBeatTime = this.ctx!.currentTime + 0.05;
    this.scheduleLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public isPlaying(): boolean {
    return this.isRunning;
  }

  // Lookahead scheduler standard Web Audio API (evita lag e sfasamenti ritmici)
  private scheduleLoop = () => {
    if (!this.isRunning || !this.ctx) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const lookahead = 0.1; // 100ms guardahead

    while (this.nextBeatTime < this.ctx.currentTime + lookahead) {
      this.scheduleBeat(this.currentBeat, this.nextBeatTime);

      // Notifica l'interfaccia grafica in modo sincronizzato
      const beatNum = this.currentBeat;
      const delayMs = Math.max(0, (this.nextBeatTime - this.ctx.currentTime) * 1000);
      window.setTimeout(() => {
        if (this.isRunning && this.onBeatCallback) {
          this.onBeatCallback(beatNum);
        }
      }, delayMs);

      this.nextBeatTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % 8;
    }

    this.timerId = window.setTimeout(this.scheduleLoop, 25);
  };

  private scheduleBeat(beat: number, time: number) {
    if (!this.ctx) return;

    // 1. GUIDA DEL CONTEGGIO (Beep / Audio Clicks differenziati)
    if (this.instruments.countVoice) {
      this.playCountClick(time, beat);
    }

    if (this.genre === 'salsa') {
      // SALSA PATTERNS (8 tempi)
      // Clave Son 3-2 (Tempi: 1, 2.5, 4, 6, 7)
      if (this.instruments.clave) {
        if (beat === 0) this.playClave(time);                     // 1
        if (beat === 1) this.playClave(time + (60/this.bpm)*0.5); // 2&
        if (beat === 3) this.playClave(time);                     // 4
        if (beat === 5) this.playClave(time);                     // 6
        if (beat === 6) this.playClave(time);                     // 7
      }

      // Congas (Tumbao classico: Slap su 2 e 6, Open tones su 4 e 4&, 8 e 8&)
      if (this.instruments.congas) {
        const halfBeat = (60 / this.bpm) * 0.5;
        if (beat === 1 || beat === 5) {
          this.playCongaSlap(time); // Slap deciso su 2 e 6
        }
        if (beat === 3 || beat === 7) {
          this.playCongaOpen(time); // Suono aperto su 4 e 8
          this.playCongaOpen(time + halfBeat); // Suono aperto su &
        }
      }

      // Campana / Cowbell (Salsa martello sul battere)
      if (this.instruments.cowbell) {
        if (beat === 0 || beat === 2 || beat === 4 || beat === 6) {
          this.playCowbell(time, beat === 0 || beat === 4);
        }
      }

      // Bongò Martillo
      if (this.instruments.bongo) {
        const half = (60 / this.bpm) * 0.5;
        if (beat % 2 === 0) {
          this.playBongo(time, 460);
        } else {
          this.playBongo(time + half, 310);
        }
      }

    } else {
      // BACHATA PATTERNS (8 tempi: 1-2-3-[4 TAP], 5-6-7-[8 TAP])
      // Güira dominicana (Raschio continuo tipico di Bachata)
      if (this.instruments.guira) {
        const quarter = (60 / this.bpm) * 0.25;
        this.playGuira(time, 0.3);
        this.playGuira(time + quarter, 0.2);
        this.playGuira(time + quarter * 2, 0.4);
      }

      // Bongò Bachata (Marcato con syncopato)
      if (this.instruments.bongo) {
        if (beat === 3 || beat === 7) {
          // Accentato sul 4 e sull'8 (tempo del TAP)
          this.playBongo(time, 520, 0.7);
        } else {
          this.playBongo(time, 340, 0.4);
        }
      }

      // Campana leggera per Bachata tradizionale
      if (this.instruments.cowbell) {
        if (beat === 3 || beat === 7) {
          this.playCowbell(time, true);
        }
      }
    }
  }

  // --- SINTETIZZATORI STRUMENTI CON WEB AUDIO API ---

  // 1. Suono guida tempi (Pitch differenziato)
  private playCountClick(time: number, beat: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    let freq = 440;
    let vol = 0.25;

    if (beat === 0) {
      // TEMPO 1: Tono alto e chiaro (A5 880Hz)
      freq = 880;
      vol = 0.55;
    } else if (beat === 4) {
      // TEMPO 5: Tono medio-alto (E5 660Hz)
      freq = 660;
      vol = 0.45;
    } else if (beat === 3 || beat === 7) {
      // TEMPI 4 e 8:
      if (this.genre === 'salsa') {
        // Pausa salsa: click molto morbido per sentire la sospensione
        freq = 330;
        vol = 0.12;
      } else {
        // Tap Bachata: pop secco per marcare il cambio anca
        freq = 920;
        vol = 0.5;
      }
    }

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  // 2. Clave Cubana (Impulso legnoso risonante)
  private playClave(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.Q.setValueAtTime(12, time);

    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, time);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  // 3. Campana / Cowbell latina
  private playCowbell(time: number, isAccent: boolean = false) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, time);
    filter.Q.setValueAtTime(3, time);

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(800, time);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(540, time);

    const vol = isAccent ? 0.35 : 0.2;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.13);
    osc2.stop(time + 0.13);
  }

  // 4. Conga Slap (Tumbao Salsa)
  private playCongaSlap(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, time);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.06);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  // 5. Conga Suono Aperto
  private playCongaOpen(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(225, time);
    osc.frequency.exponentialRampToValueAtTime(195, time + 0.18);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.19);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  // 6. Bongò
  private playBongo(time: number, freq: number = 440, vol: number = 0.3) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + 0.08);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  // 7. Güira dominicana (Rumore bianco filtrato passa-alto)
  private playGuira(time: number, vol: number = 0.25) {
    if (!this.ctx) return;
    // Buffer di rumore bianco sintetizzato al volo
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(time);
    noise.stop(time + 0.05);
  }
}

export const rhythmEngine = new RhythmAudioEngine();
