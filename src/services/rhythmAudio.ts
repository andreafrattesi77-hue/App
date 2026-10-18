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

const CHORDS_BACHATA_POP = [
  { name: 'Lam', notes: [220, 261.63, 329.63], bass: 55 },
  { name: 'Fa', notes: [174.61, 220, 261.63], bass: 43.65 },
  { name: 'Do', notes: [261.63, 329.63, 392], bass: 65.41 },
  { name: 'Sol', notes: [196, 246.94, 293.66], bass: 49 },
];

const CHORDS_BACHATA_ROMANTIC = [
  { name: 'Rem', notes: [293.66, 349.23, 440], bass: 73.42 },
  { name: 'Sol', notes: [196, 246.94, 293.66], bass: 49 },
  { name: 'Do', notes: [261.63, 329.63, 392], bass: 65.41 },
  { name: 'Lam', notes: [220, 261.63, 329.63], bass: 55 },
];

const CHORDS_BACHATA_TRAD = [
  { name: 'Lam', notes: [220, 261.63, 329.63], bass: 55 },
  { name: 'Rem', notes: [293.66, 349.23, 440], bass: 73.42 },
  { name: 'Mi7', notes: [164.81, 207.65, 246.94], bass: 41.2 },
  { name: 'Lam', notes: [220, 261.63, 329.63], bass: 55 },
];

const CHORDS_SALSA_CLASSIC = [
  { name: 'Rem', notes: [293.66, 349.23, 440], bass: 73.42 },
  { name: 'Sol7', notes: [196, 246.94, 349.23], bass: 49 },
  { name: 'Do', notes: [261.63, 329.63, 392], bass: 65.41 },
  { name: 'La7', notes: [220, 277.18, 329.63], bass: 55 },
];

const CHORDS_SALSA_CUBANA = [
  { name: 'Solm', notes: [196, 233.08, 293.66], bass: 49 },
  { name: 'Do7', notes: [261.63, 329.63, 466.16], bass: 65.41 },
  { name: 'Fa', notes: [174.61, 220, 261.63], bass: 43.65 },
  { name: 'Re7', notes: [293.66, 369.99, 440], bass: 73.42 },
];

const CHORDS_SALSA_TIMBA = [
  { name: 'Do', notes: [261.63, 329.63, 392], bass: 65.41 },
  { name: 'Fa', notes: [174.61, 220, 261.63], bass: 43.65 },
  { name: 'Sol', notes: [196, 246.94, 293.66], bass: 49 },
  { name: 'Fa', notes: [174.61, 220, 261.63], bass: 43.65 },
];

// 10 Canzoni Didattiche Progressive a tempo matematico (5 Bachata + 5 Salsa)
export const MUSIC_TRACKS: MusicTrack[] = [
  // --- 5 CANZONI DIDATTICHE BACHATA (da 116 a 134 BPM) ---
  {
    id: 'did-bachata-01',
    title: 'Bachata Base 1: Primi Passi Lenti',
    genre: 'bachata',
    bpm: 116,
    description: 'Velocità super comoda per imparare il passo base e sentire il TAP sul 4 e 8.',
    mood: 'Didattica Base',
    chords: CHORDS_BACHATA_POP,
  },
  {
    id: 'did-bachata-02',
    title: 'Bachata Base 2: Ascolto del Basso',
    genre: 'bachata',
    bpm: 120,
    description: 'Basso costante e bongo morbido per isolare i tempi 1 e 5 senza anticipare.',
    mood: 'Didattica Base',
    chords: CHORDS_BACHATA_ROMANTIC,
  },
  {
    id: 'did-bachata-03',
    title: 'Bachata Sensual 1: Onde Lente',
    genre: 'bachata',
    bpm: 125,
    description: 'Melodia fluida per allenare onde, peso corporeo e isolazioni del busto.',
    mood: 'Sensual',
    chords: CHORDS_BACHATA_ROMANTIC,
  },
  {
    id: 'did-bachata-04',
    title: 'Bachata Sensual 2: Movimento di Bacino',
    genre: 'bachata',
    bpm: 128,
    description: 'La velocità aurea della Bachata Sensual moderna per ballare morbidi in coppia.',
    mood: 'Sensual',
    chords: CHORDS_BACHATA_POP,
  },
  {
    id: 'did-bachata-05',
    title: 'Bachata Tradizionale: Chitarra Ritmica',
    genre: 'bachata',
    bpm: 134,
    description: 'Chitarra sincopata e bongo energico dominicano per ballare a ritmo sostenuto.',
    mood: 'Tradizionale',
    chords: CHORDS_BACHATA_TRAD,
  },

  // --- 5 CANZONI DIDATTICHE SALSA (da 160 a 200 BPM) ---
  {
    id: 'did-salsa-01',
    title: 'Salsa Principianti 1: Il Primo 1-2-3',
    genre: 'salsa',
    bpm: 160,
    description: 'Velocità lenta per contare i passi, sentire la pausa sul 4 e ripartire sul 5.',
    mood: 'Principianti Lenta',
    chords: CHORDS_SALSA_CLASSIC,
  },
  {
    id: 'did-salsa-02',
    title: 'Salsa Principianti 2: Pianoforte Montuno',
    genre: 'salsa',
    bpm: 170,
    description: 'Il pianoforte scandisce ogni singolo tempo con precisione matematica.',
    mood: 'Principianti Lenta',
    chords: CHORDS_SALSA_CUBANA,
  },
  {
    id: 'did-salsa-03',
    title: 'Salsa Principianti 3: Il Primo Giro a Tempo',
    genre: 'salsa',
    bpm: 178,
    description: 'Velocità ideale per provare la prima vuelta a destra senza fretta né ansia.',
    mood: 'Principianti',
    chords: CHORDS_SALSA_CLASSIC,
  },
  {
    id: 'did-salsa-04',
    title: 'Salsa Cubana: Clave & Guaguancó',
    genre: 'salsa',
    bpm: 185,
    description: 'Clave 2-3 ben marcata e congas per sentire il tumbao cubano e guidare sicuri.',
    mood: 'Cubana',
    chords: CHORDS_SALSA_CUBANA,
  },
  {
    id: 'did-salsa-05',
    title: 'Salsa Veloce: Serata Latina',
    genre: 'salsa',
    bpm: 200,
    description: 'Velocità classica della pista da ballo il sabato sera per riflessi rapidi.',
    mood: 'Veloce',
    chords: CHORDS_SALSA_TIMBA,
  },
];

const EMPTY_TRACK: MusicTrack = {
  id: 'empty',
  title: 'Nessun brano sintetico',
  genre: 'salsa',
  bpm: 180,
  description: '',
  mood: '',
  chords: [],
};

export interface RhythmMixer {
  harmony: boolean;    // Pianoforte / Chitarra armonica
  bass: boolean;       // Basso latino
  countVoice: boolean; // Voce/Click guida del tempo
  percussion: boolean; // Clave, Congas, Bongò, Güira
}

class HarmonizedRhythmAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private currentTrack: MusicTrack = EMPTY_TRACK;
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
        // Montuno pianoforte Salsa: battute nitide sui passi 1, 2, 3 e 5, 6, 7
        if (beat === 0 || beat === 1 || beat === 2 || beat === 4 || beat === 5 || beat === 6) {
          const vol = (beat === 0 || beat === 4) ? 0.32 : 0.24;
          this.playPianoChord(time, chord.notes, vol);
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
        // Basso Salsa: guida chiara per i ballerini sui passi 1, 2, 3 e 5, 6, 7. Pausa su 4 e 8.
        if (beat === 0 || beat === 4) {
          this.playBassNote(time, chord.bass, 0.55);
        } else if (beat === 1 || beat === 5) {
          this.playBassNote(time, chord.bass * 1.25, 0.40);
        } else if (beat === 2 || beat === 6) {
          this.playBassNote(time, chord.bass * 1.12, 0.44);
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
        // Clave Son sui tempi forti
        if (beat === 0 || beat === 2 || beat === 4 || beat === 6) {
          this.playClave(time);
        }

        // Congas: Slap marcato su 2 e 6 (beat 1 e 5), Open su 1 e 5 (beat 0 e 4)
        if (beat === 1 || beat === 5) {
          this.playCongaSlap(time);
        }
        if (beat === 0 || beat === 4) {
          this.playCongaOpen(time);
        }

        // Bongò sui passi attivi (silenzio sulle pause 4 e 8)
        if (beat !== 3 && beat !== 7) {
          this.playBongo(time, beat % 2 === 0 ? 460 : 320);
        }
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

    let freq = 520;
    let vol = 0.22;

    if (beat === 0) {
      freq = 880; // Tempo 1 (Forte e limpido)
      vol = 0.45;
    } else if (beat === 4) {
      freq = 660; // Tempo 5 (Medio deciso)
      vol = 0.38;
    } else if (beat === 3 || beat === 7) {
      if (isSalsa) {
        // Pausa Salsa (tempi 4 e 8): silenzio completo per non disturbare la sospensione del passo!
        return;
      } else {
        freq = 950; // Tap Bachata brillante
        vol = 0.4;
      }
    } else {
      // Tempi 2, 3, 6, 7 (passi di ballo)
      freq = 520;
      vol = 0.22;
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
