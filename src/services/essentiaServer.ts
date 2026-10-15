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
 */
export function analyzeWithEssentia(
  samples: Float32Array,
  sampleRate = 22050,
  preferredGenre: 'salsa' | 'bachata' | 'auto' = 'auto'
): EssentiaAnalysisResult | null {
  const essentia = getEssentia();
  if (!essentia) return null;

  try {
    const minTempo = preferredGenre === 'bachata' ? 105 : preferredGenre === 'salsa' ? 145 : 85;
    const maxTempo = preferredGenre === 'bachata' ? 155 : preferredGenre === 'salsa' ? 225 : 225;

    const vec = essentia.arrayToVector(samples);
    const res = essentia.RhythmExtractor2013(vec, maxTempo, 'multifeature', minTempo);
    const rawTicks = essentia.vectorToArray(res.ticks);
    const ticks: number[] = Array.from(rawTicks);

    let bpm = Number(res.bpm.toFixed(1));
    const confidence = Number(res.confidence.toFixed(2));

    if (isNaN(bpm) || bpm < 50 || bpm > 260) {
      bpm = preferredGenre === 'bachata' ? 128.0 : 182.0;
    }

    // Correzione fondamentale dell'errore di ottava (Semi-Tempo):
    // La Bachata autentica ha un BPM tra 114 e 146 BPM.
    // La Salsa autentica ha un BPM tra 160 e 225 BPM.
    // Se Essentia o un algoritmo generico rileva un valore inferiore a 112 BPM (es. 80-105 BPM),
    // nella musica caraibica si tratta SEMPRE di una Salsa calcolata a metà tempo!
    // Raddoppiando il valore, la Salsa torna al suo tempo reale ed evita di essere scambiata per Bachata.
    if (bpm < 112) {
      bpm = Number((bpm * 2).toFixed(1));
    } else if (preferredGenre === 'salsa' && bpm < 145) {
      bpm = Number((bpm * 2).toFixed(1));
    } else if (preferredGenre === 'bachata' && bpm > 165) {
      bpm = Number((bpm / 2).toFixed(1));
    }

    // Risoluzione genere definitiva
    let resolvedGenre: 'salsa' | 'bachata' = 'salsa';
    if (preferredGenre === 'bachata' || preferredGenre === 'salsa') {
      resolvedGenre = preferredGenre;
    } else {
      // Se il BPM è nel range 112-148 è Bachata, sopra 148 è Salsa
      resolvedGenre = (bpm >= 112 && bpm <= 148) ? 'bachata' : 'salsa';
    }

    const beatPeriod = 60.0 / bpm;

    // Se Essentia ha individuato i ticks musicali reali
    if (ticks.length >= 4) {
      // Filtro passa-basso per isolare la tonica e il contrabbasso / basso elettrico (< 160 Hz)
      const alpha = (2 * Math.PI * 160) / sampleRate;
      const bass = new Float32Array(samples.length);
      let prev = 0;
      for (let i = 0; i < samples.length; i++) {
        prev += alpha * (samples[i] - prev);
        bass[i] = prev;
      }

      // Valutazione dei candidati 0..7 per allineare il Tempo 1
      const scores = new Float32Array(8);
      const halfWindow = Math.round(sampleRate * 0.08); // 80ms attorno al battito

      for (let c = 0; c < 8; c++) {
        let bass0 = 0;
        let bass4 = 0;
        let bass1 = 0;
        let count = 0;

        for (let k = 0; k < ticks.length; k++) {
          const beatNum = ((k - c) % 8 + 8) % 8;
          const center = Math.round(ticks[k] * sampleRate);

          let localBass = 0;
          for (let w = -halfWindow; w <= halfWindow; w++) {
            const idx = center + w;
            if (idx >= 0 && idx < samples.length) {
              localBass += bass[idx] * bass[idx];
            }
          }

          if (beatNum === 0) bass0 += localBass;
          else if (beatNum === 4) bass4 += localBass;
          else if (beatNum === 1) bass1 += localBass;
          count++;
        }

        const avgB0 = bass0 / Math.max(1, count / 8);
        const avgB4 = bass4 / Math.max(1, count / 8);
        const avgB1 = bass1 / Math.max(1, count / 8);

        // I downbeat 0 e 4 hanno basso dominante; il tempo 2 (slap) ha basso debole
        scores[c] = avgB0 * 2.5 + avgB4 * 1.8 - avgB1 * 2.2;
      }

      let bestC = 0;
      let maxScore = -Infinity;
      for (let c = 0; c < 8; c++) {
        if (scores[c] > maxScore) {
          maxScore = scores[c];
          bestC = c;
        }
      }

      // Trova il primo Tempo 1 dopo l'ascolto e la calibrazione dell'intro (almeno 5.5s di calcolo prima dell'ingresso)
      const minIntroSec = 5.5;
      let firstT1 = -1;

      for (let k = 0; k < ticks.length; k++) {
        const beatNum = ((k - bestC) % 8 + 8) % 8;
        if (beatNum === 0 && ticks[k] >= minIntroSec) {
          firstT1 = Number(ticks[k].toFixed(3));
          break;
        }
      }

      if (firstT1 < 0) {
        // Se tutti i ticks analizzati erano sotto i 5.5s, calcola il primo ciclo di 8 battiti utile oltre 5.5s
        let candidateT1 = ticks[0] || 1.8;
        while (candidateT1 < minIntroSec) {
          candidateT1 += beatPeriod * 8;
        }
        firstT1 = Number(candidateT1.toFixed(3));
      }

      // Costruisci la sequenza dei battiti ESCLUSIVAMENTE a partire dal primo Tempo 1
      // (nessun battito nell'intro: l'allievo ascolta e si prepara al battere)
      const beats: EssentiaBeatEvent[] = [];
      let t = firstT1;
      let b = 0;
      while (t <= 600) {
        beats.push({ time: Number(t.toFixed(3)), beat: b % 8 });
        t += beatPeriod;
        b++;
      }

      return {
        success: true,
        bpm,
        confidence,
        genre: resolvedGenre,
        beatOffset: firstT1,
        beats,
        recognitionSource: 'essentia_mir',
        details: `Essentia.js MIR: ${bpm} BPM (${resolvedGenre.toUpperCase()}) • Tempo 1 a ${firstT1}s • ${ticks.length} battiti tracciati`,
      };
    }

    // Fallback sintetico basato sul BPM stimato da Essentia
    const defaultOffset = resolvedGenre === 'bachata' ? 2.2 : 1.8;
    const fallbackBeats: EssentiaBeatEvent[] = [];
    let t = defaultOffset;
    let b = 0;
    while (t <= 600) {
      fallbackBeats.push({ time: Number(t.toFixed(3)), beat: b % 8 });
      t += beatPeriod;
      b++;
    }
    fallbackBeats.sort((x, y) => x.time - y.time);

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
