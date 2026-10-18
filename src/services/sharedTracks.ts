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

import { DEFAULT_SHARED_TRACKS } from '../data/defaultSharedTracks';

const DELETED_TRACKS_KEY = 'ec_deleted_shared_tracks_ids';

export function getDeletedTrackIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_TRACKS_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

export function markTrackAsDeleted(id: string) {
  try {
    const set = getDeletedTrackIds();
    set.add(id);
    localStorage.setItem(DELETED_TRACKS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export async function fetchSharedTracks(): Promise<SharedTrack[]> {
  const deletedIds = getDeletedTrackIds();
  try {
    const res = await fetch('/api/shared-tracks');
    if (res.ok) {
      const serverTracks = (await res.json()) as SharedTrack[];
      if (Array.isArray(serverTracks) && serverTracks.length > 0) {
        return serverTracks.filter((t) => !deletedIds.has(t.id));
      }
    }
  } catch (err) {
    console.warn('Impossibile recuperare i brani dal server, uso libreria permanente:', err);
  }

  // Fallback garantito: restituisce i brani memorizzati stabilmente nell'app
  return DEFAULT_SHARED_TRACKS.filter((t) => !deletedIds.has(t.id));
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
  markTrackAsDeleted(id);
  try {
    const res = await fetch(`/api/shared-tracks/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.warn('Errore eliminazione traccia server:', err);
    return true; // Contrassegnata comunque come eliminata localmente
  }
}
