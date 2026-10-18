/**
 * Servizio per la gestione della Libreria Condivisa Cloud/Server.
 * Permette all'insegnante di caricare e calibrare le basi musicali con il Tempo 1 e il BPM esatto,
 * e salvarle sul server in modo che chiunque apra l'app possa ascoltarle e ballarle
 * senza dover fare alcuna modifica.
 */

export interface SharedTrack {
  id: string;
  name: string;
  artist?: string;
  genre: 'salsa' | 'bachata';
  bpm: number;
  beatOffset: number;
  beats: Array<{ time: number; beat: number }>;
  duration?: number;
  audioUrl: string;
  uploadedAt: number;
  isCalibrated: boolean;
}

export async function fetchSharedTracks(): Promise<SharedTrack[]> {
  try {
    const res = await fetch('/api/shared-tracks');
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('Impossibile recuperare i brani condivisi dal server:', err);
    return [];
  }
}

export async function publishTrackToServer(
  track: {
    id: string;
    name: string;
    artist?: string;
    genre: 'salsa' | 'bachata';
    bpm: number;
    beatOffset: number;
    beats: Array<{ time: number; beat: number }>;
    duration?: number;
  },
  file?: Blob | File
): Promise<{ success: boolean; track?: SharedTrack; error?: string }> {
  try {
    let audioBase64: string | undefined = undefined;
    let fileExtension = 'mp3';
    let mimeType = 'audio/mpeg';

    if (file) {
      if (file instanceof File) {
        const parts = file.name.split('.');
        if (parts.length > 1) {
          fileExtension = parts.pop() || 'mp3';
        }
      }
      mimeType = file.type || 'audio/mpeg';

      // Conversione rapida e affidabile a 64 bit senza bloccare la memoria del browser
      audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const commaIdx = res.indexOf(',');
          resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }

    const payload = {
      id: track.id,
      name: track.name,
      artist: track.artist,
      genre: track.genre,
      bpm: track.bpm,
      beatOffset: track.beatOffset,
      beats: track.beats,
      duration: track.duration,
      audioBase64,
      fileExtension,
      mimeType,
    };

    const res = await fetch('/api/shared-tracks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Errore salvataggio server' };
    }

    const data = await res.json();
    return { success: true, track: data.track };
  } catch (err: any) {
    console.error('Errore pubblicazione brano sul server:', err);
    return { success: false, error: err.message || 'Errore di connessione al server' };
  }
}

export async function deleteSharedTrackFromServer(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/shared-tracks/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.warn('Errore eliminazione traccia server:', err);
    return false;
  }
}
