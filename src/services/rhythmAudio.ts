/**
 * Motore audio armonico per Salsa e Bachata.
 * Sintetizza band complete (Pianoforte, Chitarra, Basso, Clave, Congas, Bongò, Güira)
 * e supporta anche la riproduzione di file audio MP3/audio personalizzati.
 */

export type DanceGenre = 'salsa' | 'bachata';

export interface MusicTrack {
  id: string;
  title: string;
  genre: DanceGenre;
  bpm: number;
  description: string;
  mood: string;
  chords: Array<{ name: string; notes: number[]; bass: number }>;
}

// 12 Brani musicali armonici pre-impostati per Salsa e Bachata
export const MUSIC_TRACKS: MusicTrack[] = [
  // SALSA (6 brani diversificati)
  {
    id: 'salsa-romantica',
    title: 'Salsa Romantica – Noche Suave',
    genre: 'salsa',
    bpm: 165,
    mood: 'Armonica e melodica, perfetta per connettersi',
    description: 'Pianoforte latino dolce, basso morbido e congas avvolgenti.',
    chords: [
      { name: 'Lam', notes: [220, 261.63, 329.63], bass: 110 },
      { name: 'Rem', notes: [146.83, 220, 293.66], bass: 146.83 },
      { name: 'Sol', notes: [196, 246.94, 293.66], bass: 98 },
      { name: 'Do',  notes: [261.63, 329.63, 392], bass: 130.81 },
    ],
  },
  {
    id: 'salsa-son-cubano',
    title: 'Son Cubano Tradizionale – Raíz y Clave',
    genre: 'salsa',
    bpm: 152,
    mood: 'Armonia classica cubana con clave 2-3 limpida',
    description: 'Tres melodico, congas rotonde e spazio per sentire il tempo 1.',
    chords: [
      { name: 'Do',  notes: [261.63, 329.63, 392], bass: 130.81 },
      { name: 'Fa',  notes: [174.61, 220, 261.63], bass: 87.31 },
      { name: 'Sol7', notes: [196, 246.94, 293.66, 349.23], bass: 98 },
      { name: 'Do',  notes: [261.63, 329.63, 392], bass: 130.81 },
    ],
  },
  {
    id: 'salsa-montuno',
    title: 'Son Montuno – Primi Passi & Connessione',
    genre: 'salsa',
    bpm: 148,
    mood: 'Tempo comodo e chiaro per principianti e intermedi',
    description: 'Stacco netto tra tempo 1 e 5, ritmo spazioso per ballare senza affanno.',
    chords: [
      { name: 'Fa',  notes: [174.61, 220, 261.63], bass: 87.31 },
      { name: 'Sib', notes: [233.08, 293.66, 349.23], bass: 116.54 },
      { name: 'Do7', notes: [261.63, 329.63, 392, 466.16], bass: 130.81 },
      { name: 'Fa',  notes: [174.61, 220, 261.63], bass: 87.31 },
    ],
  },
  {
    id: 'salsa-mambo-elegante',
    title: 'Mambo Elegante – Notte a New York',
    genre: 'salsa',
    bpm: 176,
    mood: 'Raffinata, swing latino e montuno sincopato',
    description: 'Armonia jazzy latina, pianoforte frizzante e battuta precisa.',
    chords: [
      { name: 'Solm', notes: [196, 233.08, 293.66], bass: 98 },
      { name: 'Dom',  notes: [261.63, 311.13, 392], bass: 130.81 },
      { name: 'Re7',  notes: [293.66, 369.99, 440], bass: 146.83 },
      { name: 'Solm', notes: [196, 233.08, 293.66], bass: 98 },
    ],
  },
  {
    id: 'salsa-dura',
    title: 'Salsa Dura – Fuego en la Pista',
    genre: 'salsa',
    bpm: 195,
    mood: 'Energica, incalzante, per serate avanzate',
    description: 'Montuno brillante, clave 3-2 scandita, campana e tumbao vivace.',
    chords: [
      { name: 'Rem', notes: [293.66, 349.23, 440], bass: 146.83 },
      { name: 'Solm', notes: [196, 233.08, 293.66], bass: 98 },
      { name: 'La7',  notes: [220, 277.18, 329.63], bass: 110 },
      { name: 'Rem',  notes: [293.66, 349.23, 440], bass: 146.83 },
    ],
  },
  {
    id: 'salsa-timba',
    title: 'Salsa Timba – Ritmo & Sabor',
    genre: 'salsa',
    bpm: 186,
    mood: 'Dinamica, carica e piena di sfumature',
    description: 'Basso potente, pianoforte sincopato e percussioni serrate.',
    chords: [
      { name: 'Mim', notes: [164.81, 196, 246.94], bass: 82.41 },
      { name: 'Lam', notes: [220, 261.63, 329.63], bass: 110 },
      { name: 'Si7', notes: [246.94, 311.13, 369.99], bass: 123.47 },
      { name: 'Mim', notes: [164.81, 196, 246.94], bass: 82.41 },
    ],
  },

  // BACHATA (6 brani diversificati)
  {
    id: 'bachata-sensual',
    title: 'Bachata Sensual – Tensión Lenta',
    genre: 'bachata',
    bpm: 116,
    mood: 'Dolce, avvolgente, chitarra acustica romantica',
    description: 'Arpeggi romantici in La minore, basso profondo e tap vellutato.',
    chords: [
      { name: 'Lam', notes: [220, 261.63, 329.63], bass: 110 },
      { name: 'Fa',  notes: [174.61, 220, 261.63], bass: 87.31 },
      { name: 'Do',  notes: [261.63, 329.63, 392], bass: 130.81 },
      { name: 'Sol', notes: [196, 246.94, 293.66], bass: 98 },
    ],
  },
  {
    id: 'bachata-acustica',
    title: 'Bachata Acustica – Chitarra & Cuore',
    genre: 'bachata',
    bpm: 112,
    mood: 'Altamente armonica e intima, perfetta per l\'orecchio',
    description: 'Chitarra solista requinto cristallina e arpeggio aperto per sentire il movimento.',
    chords: [
      { name: 'Do',  notes: [261.63, 329.63, 392], bass: 130.81 },
      { name: 'Lam', notes: [220, 261.63, 329.63], bass: 110 },
      { name: 'Fa',  notes: [174.61, 220, 261.63], bass: 87.31 },
      { name: 'Sol', notes: [196, 246.94, 293.66], bass: 98 },
    ],
  },
  {
    id: 'bachata-moderna',
    title: 'Bachata Moderna – Flirt Invisibile',
    genre: 'bachata',
    bpm: 124,
    mood: 'Groove moderno e coinvolgente',
    description: 'Chitarra ritmica, bongò sincopato e tap marcato su 4 e 8.',
    chords: [
      { name: 'Mim', notes: [164.81, 196, 246.94], bass: 82.41 },
      { name: 'Do',  notes: [261.63, 329.63, 392], bass: 130.81 },
      { name: 'Sol', notes: [196, 246.94, 293.66], bass: 98 },
      { name: 'Re',  notes: [146.83, 220, 293.66], bass: 73.42 },
    ],
  },
  {
    id: 'bachata-rosa',
    title: 'Bachata Rosa – Melodia Romantica',
    genre: 'bachata',
    bpm: 118,
    mood: 'Armonia morbida e nostalgica per camminata fluida',
    description: 'Accordi vellutati in Re minore con bassline cantabile e tap delicato.',
    chords: [
      { name: 'Rem',  notes: [293.66, 349.23, 440], bass: 146.83 },
      { name: 'Solm', notes: [196, 233.08, 293.66], bass: 98 },
      { name: 'Do',   notes: [261.63, 329.63, 392], bass: 130.81 },
      { name: 'Fa',   notes: [174.61, 220, 261.63], bass: 87.31 },
    ],
  },
  {
    id: 'bachata-dominicana',
    title: 'Bachata Dominicana – Fiesta Tradizionale',
    genre: 'bachata',
    bpm: 132,
    mood: 'Autentica, vivace e dinamica',
    description: 'Requinto brillante, bongò martellato e güira rapida con sabor caraibico.',
    chords: [
      { name: 'La',   notes: [220, 277.18, 329.63], bass: 110 },
      { name: 'Mi',   notes: [164.81, 207.65, 246.94], bass: 82.41 },
      { name: 'Fa#m', notes: [185, 220, 277.18], bass: 92.5 },
      { name: 'Re',   notes: [146.83, 220, 293.66], bass: 73.42 },
    ],
  },
  {
    id: 'bachata-bolero',
    title: 'Bachata Bolero – Intimità & Connessione',
    genre: 'bachata',
    bpm: 108,
    mood: 'Lenta, romantica e profonda',
    description: 'Ritmo disteso per allenare la connessione corporea e la guida senza fretta.',
    chords: [
      { name: 'Sol',  notes: [196, 246.94, 293.66], bass: 98 },
      { name: 'Mim',  notes: [164.81, 196, 246.94], bass: 82.41 },
      { name: 'Lam',  notes: [220, 261.63, 329.63], bass: 110 },
      { name: 'Re7',  notes: [293.66, 369.99, 440], bass: 146.83 },
    ],
  },
];

export interface RhythmMixer {
  harmony: boolean;    // Pianoforte / Chitarra armonica
  bass: boolean;       // Basso latino
  countVoice: boolean; // Voce/Click guida del tempo
  percussion: boolean; // Clave, Congas, Bongò, Güira
}

class HarmonizedRhythmAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private currentTrack: MusicTrack = MUSIC_TRACKS[0];
  private bpm: number = 165;
  private currentBeat: number = 0; // 0 to 7
  private currentMeasure: number = 0; // 0 to chords.length - 1
  private nextBeatTime: number = 0;
  private startTime: number | null = null;
  private timerId: number | null = null;
  private onBeatCallback: ((beat: number, chordName: string) => void) | null = null;
  private scheduledEvents: Array<{ beat: number; time: number; chordName: string }> = [];

  public mixer: RhythmMixer = {
    harmony: true,
    bass: true,
    countVoice: true,
    percussion: true,
  };

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  public selectTrack(trackId: string) {
    const found = MUSIC_TRACKS.find((t) => t.id === trackId);
    if (found) {
      this.currentTrack = found;
      this.bpm = found.bpm;
      this.currentMeasure = 0;
      this.currentBeat = 0;
    }
  }

  public getTrack(): MusicTrack {
    return this.currentTrack;
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(90, Math.min(230, bpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setOnBeat(cb: (beat: number, chordName: string) => void) {
    this.onBeatCallback = cb;
  }

  public async start() {
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.error('AudioContext resume error:', err);
      }
    }
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentBeat = 0;
    this.currentMeasure = 0;
    this.scheduledEvents = [];
    // Piccolo buffer di sicurezza (0.08s) per garantire che l'hardware audio sia pronto
    this.startTime = this.ctx.currentTime + 0.08;
    this.nextBeatTime = this.startTime;
    this.scheduleLoop();
  }

  public stop() {
    this.isRunning = false;
    this.startTime = null;
    this.scheduledEvents = [];
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentBeat = 0;
    this.currentMeasure = 0;
    if (this.onBeatCallback) {
      this.onBeatCallback(-1, '');
    }
  }

  public isPlaying(): boolean {
    return this.isRunning;
  }

  /**
   * Restituisce l'esatto battito attuale in sincronia perfetta con il clock audio hardware Web Audio.
   * Utilizza l'elenco degli eventi programmati e verifica il currentTime esatto dell'AudioContext.
   */
  public getCurrentBeatState(): { beat: number; chordName: string } | null {
    if (!this.isRunning || !this.ctx || this.startTime === null) return null;
    const now = this.ctx.currentTime;

    // Rimuove battute passate da oltre 0.4s
    while (this.scheduledEvents.length > 1 && this.scheduledEvents[1].time <= now) {
      this.scheduledEvents.shift();
    }

    if (this.scheduledEvents.length > 0 && this.scheduledEvents[0].time <= now) {
      return {
        beat: this.scheduledEvents[0].beat,
        chordName: this.scheduledEvents[0].chordName,
      };
    }

    if (this.scheduledEvents.length > 0 && now < this.scheduledEvents[0].time) {
      return {
        beat: 0,
        chordName: this.scheduledEvents[0].chordName,
      };
    }

    return null;
  }

  private scheduleLoop = () => {
    if (!this.isRunning || !this.ctx) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const lookahead = 0.15;

    while (this.nextBeatTime < this.ctx.currentTime + lookahead) {
      const chord = this.currentTrack.chords[this.currentMeasure % this.currentTrack.chords.length];

      this.scheduleMusicalBeat(this.currentBeat, this.nextBeatTime, chord);

      // Registra timestamp audio esatto per sincronia visiva perfetta a 60 FPS
      this.scheduledEvents.push({
        beat: this.currentBeat,
        time: this.nextBeatTime,
        chordName: chord.name,
      });

      const beatNum = this.currentBeat;
      const cName = chord.name;
      const delayMs = Math.max(0, (this.nextBeatTime - this.ctx.currentTime) * 1000);

      window.setTimeout(() => {
        if (this.isRunning && this.onBeatCallback) {
          this.onBeatCallback(beatNum, cName);
        }
      }, delayMs);

      this.nextBeatTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % 8;
      if (this.currentBeat === 0) {
        this.currentMeasure = (this.currentMeasure + 1) % this.currentTrack.chords.length;
      }
    }

    this.timerId = window.setTimeout(this.scheduleLoop, 25);
  };

  private scheduleMusicalBeat(
    beat: number,
    time: number,
    chord: { name: string; notes: number[]; bass: number }
  ) {
    if (!this.ctx) return;
    const isSalsa = this.currentTrack.genre === 'salsa';
    const halfBeat = (60.0 / this.bpm) * 0.5;

    // 1. GUIDA DEL TEMPO (Click musicale morbido o accentato)
    if (this.mixer.countVoice) {
      this.playGuideClick(time, beat, isSalsa);
    }

    // 2. ARMONIA (Pianoforte Salsa o Chitarra Bachata)
    if (this.mixer.harmony) {
      if (isSalsa) {
        // Montuno sincopato Salsa (accordi su beat 0, 1.5, 3, 4, 5.5, 7)
        if (beat === 0 || beat === 3 || beat === 4 || beat === 7) {
          this.playPianoChord(time, chord.notes, 0.25);
        }
        if (beat === 1 || beat === 5) {
          this.playPianoChord(time + halfBeat, chord.notes, 0.28);
        }
      } else {
        // Arpeggio chitarra Bachata (plucked arpeggio su 1-2-3-4 e 5-6-7-8)
        const noteIdx = beat % chord.notes.length;
        const note = chord.notes[noteIdx];
        const isTap = beat === 3 || beat === 7;
        this.playGuitarPluck(time, note, isTap ? 0.35 : 0.28, isTap);
      }
    }

    // 3. BASSO LATINO
    if (this.mixer.bass) {
      if (isSalsa) {
        // Tumbao Bass con ancoraggio netto sui tempi 1 e 5 per tempo impeccabile
        if (beat === 0 || beat === 4) {
          this.playBassNote(time, chord.bass, 0.52);
        }
        if (beat === 1 || beat === 5) {
          this.playBassNote(time + halfBeat, chord.bass, 0.45);
        }
        if (beat === 3 || beat === 7) {
          this.playBassNote(time, chord.bass, 0.5);
        }
      } else {
        // Bachata Bass (battere 0 e 2, 4 e 6)
        if (beat === 0 || beat === 4) {
          this.playBassNote(time, chord.bass, 0.5);
        } else if (beat === 2 || beat === 6) {
          this.playBassNote(time, chord.bass * 1.5, 0.38);
        }
      }
    }

    // 4. PERCUSSIONI (Congas, Clave, Güira, Bongò)
    if (this.mixer.percussion) {
      if (isSalsa) {
        // Clave Son 3-2
        if (beat === 0 || beat === 3 || beat === 5 || beat === 6) {
          this.playClave(time);
        }
        if (beat === 1) {
          this.playClave(time + halfBeat);
        }

        // Congas (Tumbao slap su 1 e 5; open su 3 e 7)
        if (beat === 1 || beat === 5) {
          this.playCongaSlap(time);
        }
        if (beat === 3 || beat === 7) {
          this.playCongaOpen(time);
          this.playCongaOpen(time + halfBeat);
        }

        // Bongò
        this.playBongo(time, beat % 2 === 0 ? 460 : 320);
      } else {
        // Bachata Güira (Raschio continuo sui 16esimi)
        const qtr = (60.0 / this.bpm) * 0.25;
        this.playGuira(time, 0.25);
        this.playGuira(time + qtr, 0.2);
        this.playGuira(time + qtr * 2, 0.35);

        // Bongò Bachata (Marcato sul Tap 3 e 7)
        if (beat === 3 || beat === 7) {
          this.playBongo(time, 560, 0.5); // Accento deciso sul Tap
        } else {
          this.playBongo(time, 350, 0.28);
        }
      }
    }
  }

  // --- SINTESI STRUMENTI ARMONICI ---

  // Piano latino con filtro caldo e inviluppo dolce
  private playPianoChord(time: number, notes: number[], volume = 0.3) {
    if (!this.ctx) return;
    notes.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, time);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(volume / notes.length, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  // Chitarra acustica Bachata pizzicata
  private playGuitarPluck(time: number, freq: number, volume = 0.3, isAccent = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isAccent ? 1800 : 1200, time);
    filter.Q.setValueAtTime(2, time);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isAccent ? 0.35 : 0.22));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  // Basso profondo latino
  private playBassNote(time: number, freq: number, volume = 0.45) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  // Guida Conteggio tempi (Pitch chiaro)
  private playGuideClick(time: number, beat: number, isSalsa: boolean) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    let freq = 440;
    let vol = 0.2;

    if (beat === 0) {
      freq = 880; // Tempo 1 (Forte)
      vol = 0.45;
    } else if (beat === 4) {
      freq = 660; // Tempo 5 (Medio)
      vol = 0.35;
    } else if (beat === 3 || beat === 7) {
      if (isSalsa) {
        freq = 380; // Battuta Tempo 4 e 8 Salsa (woodblock percussivo netto)
        vol = 0.24;
      } else {
        freq = 950; // Tap Bachata brillante
        vol = 0.4;
      }
    }

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  // Clave Cubana
  private playClave(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2500, time);
    filter.Q.setValueAtTime(12, time);

    osc.type = 'square';
    osc.frequency.setValueAtTime(2500, time);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  // Conga Slap
  private playCongaSlap(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.05);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  // Conga Open
  private playCongaOpen(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(180, time + 0.16);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.17);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.18);
  }

  // Bongò
  private playBongo(time: number, freq = 440, vol = 0.25) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + 0.07);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  // Güira
  private playGuira(time: number, vol = 0.2) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
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
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.038);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(time);
    noise.stop(time + 0.04);
  }
}

export const harmonizedEngine = new HarmonizedRhythmAudioEngine();
