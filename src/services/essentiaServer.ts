import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let essentiaInstance: any = null;

function getEssentia() {
  if (!essentiaInstance) {
    try {
      const { EssentiaWASM, Essentia } = require('essentia.js');
      essentiaInstance = new Essentia(EssentiaWASM);
      console.log('✓ Essentia.js WASM Engine caricato con successo (versione', essentiaInstance.version, ')');
    } catch (err) {
      console.error('Errore inizializzazione Essentia.js:', err);
      return null;
    }
  }
  return essentiaInstance;
}

export interface EssentiaBeatEvent {
  time: number;
  beat: number;
}

export interface EssentiaAnalysisResult {
  success: boolean;
  bpm: number;
  confidence: number;
  genre: 'salsa' | 'bachata';
  beatOffset: number;
  beats: EssentiaBeatEvent[];
  recognitionSource: 'essentia_mir';
  details: string;
}

/**
 * Analisi professionale con Essentia.js MIR (Music Information Retrieval)
 * Algoritmo RhythmExtractor2013 + discriminazione del Tempo 1 / Tempo 5
 * Rilevamento automatico puro senza timer, senza countdown e senza scatti casuali.
 */
export function analyzeWithEssentia(
  samples: Float32Array,
  sampleRate = 22050,
  preferredGenre: 'salsa' | 'bachata' | 'auto' = 'auto'
): EssentiaAnalysisResult | null {
  const essentia = getEssentia();
  if (!essentia) return null;

  try {
    // 1. Rilevamento della vera entrata dell'audio/ritmo (Energy RMS scan in finestre da 40ms)
    // Esclude l'eventuale silenzio o rumore di fondo prima che la traccia cominci
    const windowSamples = Math.round(sampleRate * 0.04);
    let totalRMS = 0;
    let windowCount = 0;
    for (let i = 0; i < samples.length - windowSamples; i += windowSamples) {
      let sumSq = 0;
      for (let j = 0; j < windowSamples; j++) {
        sumSq += samples[i + j] * samples[i + j];
      }
      totalRMS += Math.sqrt(sumSq / windowSamples);
      windowCount++;
    }
    const avgRMS = windowCount > 0 ? totalRMS / windowCount : 0.01;

    let soundStartSec = 0;
    for (let i = 0; i < samples.length - windowSamples; i += windowSamples) {
      let sumSq = 0;
      for (let j = 0; j < windowSamples; j++) {
        sumSq += samples[i + j] * samples[i + j];
      }
      const localRMS = Math.sqrt(sumSq / windowSamples);
      if (localRMS > avgRMS * 0.12) {
        soundStartSec = i / sampleRate;
        break;
      }
    }

    const minTempo = preferredGenre === 'bachata' ? 105 : preferredGenre === 'salsa' ? 145 : 75;
    const maxTempo = preferredGenre === 'bachata' ? 155 : preferredGenre === 'salsa' ? 225 : 230;

    const vec = essentia.arrayToVector(samples);
    const res = essentia.RhythmExtractor2013(vec, maxTempo, 'multifeature', minTempo);
    const rawTicks = essentia.vectorToArray(res.ticks);
    const ticks: number[] = Array.from(rawTicks);

    let bpm = Number(res.bpm.toFixed(1));
    const confidence = Number(res.confidence.toFixed(2));

    if (isNaN(bpm) || bpm < 50 || bpm > 260) {
      bpm = preferredGenre === 'bachata' ? 128.0 : 182.0;
    }

    // 2. Risoluzione intelligente del genere e correzione ottava (Semi-Tempo):
    // Bachata autentica: 110 - 146 BPM
    // Salsa autentica: 160 - 225 BPM
    let resolvedGenre: 'salsa' | 'bachata' = 'salsa';

    if (preferredGenre === 'bachata') {
      resolvedGenre = 'bachata';
      if (bpm < 95) bpm = Number((bpm * 2).toFixed(1));
      if (bpm > 165) bpm = Number((bpm / 2).toFixed(1));
    } else if (preferredGenre === 'salsa') {
      resolvedGenre = 'salsa';
      if (bpm < 135) bpm = Number((bpm * 2).toFixed(1));
    } else {
      // Modalità 'auto': determinazione oggettiva
      if (bpm >= 55 && bpm <= 75) {
        // Semi-tempo Bachata tipico (es. 64 BPM -> 128 BPM)
        bpm = Number((bpm * 2).toFixed(1));
        resolvedGenre = 'bachata';
      } else if (bpm >= 110 && bpm <= 146) {
        // Finestra tipica Bachata
        resolvedGenre = 'bachata';
      } else if (bpm > 75 && bpm < 110) {
        // Semi-tempo Salsa (es. 85-105 BPM -> 170-210 BPM)
        bpm = Number((bpm * 2).toFixed(1));
        resolvedGenre = 'salsa';
      } else {
        // Sopra 146 BPM è Salsa
        resolvedGenre = 'salsa';
      }
    }

    const beatPeriod = 60.0 / bpm;

    // Filtro passa-basso per isolare la tonica e il basso profondo (< 180 Hz)
    const alphaBass = (2 * Math.PI * 180) / sampleRate;
    const bass = new Float32Array(samples.length);
    let prevB = 0;
    for (let i = 0; i < samples.length; i++) {
      prevB += alphaBass * (samples[i] - prevB);
      bass[i] = prevB;
    }

    // Filtro passa-banda medi (220 Hz - 3200 Hz) per isolare slap e percussioni
    const alphaMidL = (2 * Math.PI * 220) / sampleRate;
    const alphaMidH = (2 * Math.PI * 3200) / sampleRate;
    const mid = new Float32Array(samples.length);
    let prevML = 0;
    let prevMH = 0;
    for (let i = 0; i < samples.length; i++) {
      prevML += alphaMidL * (samples[i] - prevML);
      prevMH += alphaMidH * (samples[i] - prevMH);
      mid[i] = prevMH - prevML;
    }

    // 1b. Rilevamento dell'ingresso del ritmo pieno (Drop con basso o percussioni sostenute)
    let avgBass = 0;
    for (let i = 0; i < bass.length; i += 100) {
      avgBass += bass[i] * bass[i];
    }
    avgBass /= Math.max(1, bass.length / 100);

    let rhythmDropSec = soundStartSec;
    const stepSamples = Math.round(sampleRate * 0.1);
    for (let i = Math.round(soundStartSec * sampleRate); i < Math.min(samples.length - stepSamples, sampleRate * 25); i += stepSamples) {
      let bSum = 0;
      for (let j = 0; j < stepSamples; j++) {
        bSum += bass[i + j] * bass[i + j];
      }
      if (bSum / stepSamples > avgBass * 0.40) {
        rhythmDropSec = i / sampleRate;
        break;
      }
    }

    // 3. Filtra solo i tick musicali che appartengono al brano reale (scarta i tick artificiali nel silenzio pre-audio)
    const realTicks = ticks.filter((t) => t >= Math.max(0, soundStartSec - 0.25));

    if (realTicks.length >= 4) {
      // Valutazione dei candidati di fase 0..7 per identificare esattamente quale battito è il Tempo 1 (beat 0)
      const scores = new Float32Array(8);
      const halfWindow = Math.round(sampleRate * 0.08); // 80ms attorno al battito

      for (let c = 0; c < 8; c++) {
        const bassByBeat = new Float64Array(8);
        const midByBeat = new Float64Array(8);
        const countByBeat = new Int32Array(8);

        for (let k = 0; k < realTicks.length; k++) {
          const beatNum = ((k - c) % 8 + 8) % 8;
          const center = Math.round(realTicks[k] * sampleRate);

          let localBass = 0;
          let localMid = 0;
          for (let w = -halfWindow; w <= halfWindow; w++) {
            const idx = center + w;
            if (idx >= 0 && idx < samples.length) {
              localBass += bass[idx] * bass[idx];
              localMid += mid[idx] * mid[idx];
            }
          }

          bassByBeat[beatNum] += localBass;
          midByBeat[beatNum] += localMid;
          countByBeat[beatNum]++;
        }

        const avgB = Array.from(bassByBeat).map((v, i) => v / Math.max(1, countByBeat[i]));
        const avgM = Array.from(midByBeat).map((v, i) => v / Math.max(1, countByBeat[i]));

        const b0 = avgB[0], b4 = avgB[4];
        const b1 = avgB[1], b5 = avgB[5];
        const b3 = avgB[3], b7 = avgB[7];
        const m0 = avgM[0], m4 = avgM[4];
        const m1 = avgM[1], m5 = avgM[5];

        let candidateScore = 0;
        if (resolvedGenre === 'bachata') {
          // BACHATA:
          // - I battiti 3 e 7 sono i TAP (basso fermo, percussione secca rim/bongo)
          // - I battiti 0 (Tempo 1) e 4 (Tempo 5) sono i downbeat (basso pieno e forte ripartenza dopo il tap)
          const tapContrast = (b0 - b7) * 4.0 + (b4 - b3) * 3.0;
          const downbeatBass = (b0 + b4) * 2.5 - (b1 + b5) * 2.0;
          const tonicSuperiority = b0 >= b4 ? 2.5 : -2.5;
          candidateScore = tapContrast + downbeatBass + tonicSuperiority;
        } else {
          // SALSA:
          // - I battiti 0 (Tempo 1) e 4 (Tempo 5) sono i downbeat armonici di battuta
          // - I battiti 1 (Tempo 2) e 5 (Tempo 6) sono gli slap delle congas (medi alti, basso debole)
          // - I battiti 3 e 7 sono il ponche anticipato del tumbao
          const downbeatBass = (b0 + b4) * 3.0 - (b1 + b5) * 3.0;
          const congaSlapScore = (m1 + m5) * 2.5 - (m0 + m4) * 1.5;
          const poncheScore = (b3 + b7) * 2.0;
          const tonicSuperiority = b0 >= b4 ? 2.0 : -2.0;
          candidateScore = downbeatBass + congaSlapScore + poncheScore + tonicSuperiority;
        }

        scores[c] = candidateScore;
      }

      let bestC = 0;
      let maxScore = -Infinity;
      for (let c = 0; c < 8; c++) {
        if (scores[c] > maxScore) {
          maxScore = scores[c];
          bestC = c;
        }
      }

      // 4. Trova il primo tick reale che corrisponde esattamente al Tempo 1 (beatNum === 0)
      let firstT1TickIdx = -1;
      // Cerca prima a partire dall'ingresso effettivo del ritmo (drop percussioni/basso)
      for (let k = 0; k < realTicks.length; k++) {
        const beatNum = ((k - bestC) % 8 + 8) % 8;
        if (beatNum === 0 && realTicks[k] >= rhythmDropSec - 0.20) {
          firstT1TickIdx = k;
          break;
        }
      }
      // Se non trovato attorno al drop, cerca da soundStartSec
      if (firstT1TickIdx < 0) {
        for (let k = 0; k < realTicks.length; k++) {
          const beatNum = ((k - bestC) % 8 + 8) % 8;
          if (beatNum === 0 && realTicks[k] >= soundStartSec - 0.1) {
            firstT1TickIdx = k;
            break;
          }
        }
      }

      if (firstT1TickIdx < 0) {
        firstT1TickIdx = 0;
      }

      const firstTempo1Sec = Number(realTicks[firstT1TickIdx].toFixed(3));

      // 5. Costruisci la sequenza dei battiti che inizia ESATTAMENTE dal primo Tempo 1 autentico
      // Nessuna estrapolazione artificiale a ritroso nel silenzio o nell'intro!
      const beats: EssentiaBeatEvent[] = [];

      for (let k = firstT1TickIdx; k < realTicks.length; k++) {
        const beatNum = ((k - bestC) % 8 + 8) % 8;
        beats.push({
          time: Number(realTicks[k].toFixed(3)),
          beat: beatNum,
        });
      }

      // Estendi in avanti fino alla fine del brano (600s) mantenendo il periodo ritmico costante
      if (beats.length > 0) {
        let lastT = beats[beats.length - 1].time;
        let lastB = beats[beats.length - 1].beat;
        let tFwd = lastT + beatPeriod;
        let bFwd = lastB + 1;
        while (tFwd <= 600) {
          beats.push({
            time: Number(tFwd.toFixed(3)),
            beat: bFwd % 8,
          });
          tFwd += beatPeriod;
          bFwd++;
        }
      }

      return {
        success: true,
        bpm,
        confidence,
        genre: resolvedGenre,
        beatOffset: firstTempo1Sec,
        beats,
        recognitionSource: 'essentia_mir',
        details: `Essentia.js MIR: ${bpm} BPM (${resolvedGenre.toUpperCase()}) • Tempo 1 a ${firstTempo1Sec}s • Riconoscimento automatico`,
      };
    }

    // Fallback se non ci sono abbastanza ticks: calcolo basato su soundStartSec
    const defaultOffset = Number((soundStartSec + 0.5).toFixed(3));
    const fallbackBeats: EssentiaBeatEvent[] = [];
    let t = defaultOffset;
    let b = 0;
    while (t <= 600) {
      fallbackBeats.push({ time: Number(t.toFixed(3)), beat: b % 8 });
      t += beatPeriod;
      b++;
    }

    return {
      success: true,
      bpm,
      confidence,
      genre: resolvedGenre,
      beatOffset: defaultOffset,
      beats: fallbackBeats,
      recognitionSource: 'essentia_mir',
      details: `Essentia.js MIR: ${bpm} BPM (${resolvedGenre.toUpperCase()}) • Tempo 1 a ${defaultOffset}s`,
    };
  } catch (err) {
    console.warn('Errore calcolo Essentia.js:', err);
    return null;
  }
}
